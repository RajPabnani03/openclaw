import { v4 as uuidv4 } from "uuid";
import type { GatewaySession } from "../api/gateway-session";
import type {
  ChatMessage,
  ChatMessageContent,
  ChatPendingToolCall,
  ChatSessionEntry,
  ChatHistory,
  OutgoingAttachment,
  ThinkingLevel,
} from "../types/chat";

export interface ChatControllerState {
  sessionKey: string;
  sessionId?: string;
  messages: ChatMessage[];
  errorText?: string;
  healthOk: boolean;
  thinkingLevel: ThinkingLevel;
  pendingRunCount: number;
  streamingAssistantText?: string;
  pendingToolCalls: ChatPendingToolCall[];
  sessions: ChatSessionEntry[];
}

type StateListener = (state: ChatControllerState) => void;

/**
 * Manages chat state and communication with the gateway.
 * Mirrors the Android ChatController for protocol compatibility.
 */
export class ChatController {
  private session: GatewaySession;
  private supportsChatSubscribe: boolean;
  private listeners = new Set<StateListener>();

  private state: ChatControllerState = {
    sessionKey: "main",
    messages: [],
    healthOk: false,
    thinkingLevel: "off",
    pendingRunCount: 0,
    pendingToolCalls: [],
    sessions: [],
  };

  private pendingRuns = new Set<string>();
  private pendingRunTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingToolCallsById = new Map<string, ChatPendingToolCall>();
  private lastHealthPollAt?: number;
  private readonly pendingRunTimeoutMs = 120_000;

  constructor(session: GatewaySession, supportsChatSubscribe = true) {
    this.session = session;
    this.supportsChatSubscribe = supportsChatSubscribe;
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Get the current state snapshot. */
  getState(): ChatControllerState {
    return this.state;
  }

  /** Called when the gateway connection drops. */
  onDisconnected(_message: string): void {
    this.clearAllPendingRuns();
    this.pendingToolCallsById.clear();
    this.emit({
      healthOk: false,
      errorText: undefined,
      streamingAssistantText: undefined,
      sessionId: undefined,
      pendingToolCalls: [],
      pendingRunCount: 0,
    });
  }

  /** Load a chat session by key. */
  load(sessionKey: string): void {
    const key = sessionKey.trim() || "main";
    this.emit({ sessionKey: key });
    this.bootstrap(true);
  }

  /** Apply the main session key from the connect response. */
  applyMainSessionKey(mainSessionKey: string): void {
    const trimmed = mainSessionKey.trim();
    if (!trimmed || this.state.sessionKey === trimmed || this.state.sessionKey !== "main") return;
    this.emit({ sessionKey: trimmed });
    this.bootstrap(true);
  }

  /** Refresh chat history and health. */
  refresh(): void {
    this.bootstrap(true);
  }

  /** Refresh the session list. */
  refreshSessions(limit?: number): void {
    this.fetchSessions(limit);
  }

  /** Set the thinking level. */
  setThinkingLevel(level: ThinkingLevel): void {
    if (level === this.state.thinkingLevel) return;
    this.emit({ thinkingLevel: level });
  }

  /** Switch to a different chat session. */
  switchSession(sessionKey: string): void {
    const key = sessionKey.trim();
    if (!key || key === this.state.sessionKey) return;
    this.emit({ sessionKey: key });
    this.bootstrap(true);
  }

  /** Send a message to the current chat session. */
  sendMessage(message: string, thinkingLevel: ThinkingLevel, attachments: OutgoingAttachment[] = []): void {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;
    if (!this.state.healthOk) {
      this.emit({ errorText: "Gateway health not OK; cannot send" });
      return;
    }

    const runId = uuidv4();
    const text = !trimmed && attachments.length > 0 ? "See attached." : trimmed;

    // Optimistic user message
    const userContent: ChatMessageContent[] = [
      { type: "text", text },
      ...attachments.map((att) => ({
        type: att.type,
        mimeType: att.mimeType,
        fileName: att.fileName,
        base64: att.base64,
      })),
    ];

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: userContent,
      timestampMs: Date.now(),
    };

    this.addPendingRun(runId);
    this.pendingToolCallsById.clear();

    this.emit({
      messages: [...this.state.messages, userMessage],
      errorText: undefined,
      streamingAssistantText: undefined,
      pendingToolCalls: [],
    });

    const params: Record<string, unknown> = {
      sessionKey: this.state.sessionKey,
      message: text,
      thinking: thinkingLevel,
      timeoutMs: 30_000,
      idempotencyKey: runId,
    };

    if (attachments.length > 0) {
      params.attachments = attachments.map((att) => ({
        type: att.type,
        mimeType: att.mimeType,
        fileName: att.fileName,
        content: att.base64,
      }));
    }

    this.session
      .request("chat.send", params)
      .then((res) => {
        const actualRunId = this.parseRunId(res);
        if (actualRunId && actualRunId !== runId) {
          this.removePendingRun(runId);
          this.addPendingRun(actualRunId);
        }
      })
      .catch((err) => {
        this.removePendingRun(runId);
        this.emit({ errorText: err instanceof Error ? err.message : "Send failed" });
      });
  }

  /** Abort all pending runs. */
  abort(): void {
    const runIds = [...this.pendingRuns];
    if (runIds.length === 0) return;

    for (const runId of runIds) {
      this.session
        .request("chat.abort", {
          sessionKey: this.state.sessionKey,
          runId,
        })
        .catch(() => {
          // best-effort
        });
    }
  }

  /** Handle a gateway event. */
  handleGatewayEvent(event: string, payloadJson?: string): void {
    switch (event) {
      case "tick":
        this.pollHealthIfNeeded(false);
        break;
      case "health":
        this.emit({ healthOk: true });
        break;
      case "seqGap":
        this.clearAllPendingRuns();
        this.emit({ errorText: "Event stream interrupted; try refreshing." });
        break;
      case "chat":
        if (payloadJson) this.handleChatEvent(payloadJson);
        break;
      case "agent":
        if (payloadJson) this.handleAgentEvent(payloadJson);
        break;
    }
  }

  // --- Private ---

  private async bootstrap(forceHealth: boolean): Promise<void> {
    this.clearAllPendingRuns();
    this.pendingToolCallsById.clear();
    this.emit({
      errorText: undefined,
      healthOk: false,
      streamingAssistantText: undefined,
      sessionId: undefined,
      pendingToolCalls: [],
      pendingRunCount: 0,
    });

    const key = this.state.sessionKey;
    try {
      if (this.supportsChatSubscribe) {
        await this.session.sendNodeEvent("chat.subscribe", JSON.stringify({ sessionKey: key }));
      }

      const historyRaw = await this.session.request("chat.history", { sessionKey: key });
      const history = this.parseHistory(historyRaw, key);
      this.emit({
        messages: history.messages,
        sessionId: history.sessionId,
      });
      if (history.thinkingLevel) {
        this.emit({ thinkingLevel: normalizeThinking(history.thinkingLevel) });
      }

      await this.pollHealthIfNeeded(forceHealth);
      await this.fetchSessions(50);
    } catch (err) {
      this.emit({ errorText: err instanceof Error ? err.message : "Bootstrap failed" });
    }
  }

  private async fetchSessions(limit?: number): Promise<void> {
    try {
      const params: Record<string, unknown> = {
        includeGlobal: true,
        includeUnknown: false,
      };
      if (limit && limit > 0) params.limit = limit;
      const res = await this.session.request("sessions.list", params);
      const sessions = this.parseSessions(res);
      this.emit({ sessions });
    } catch {
      // best-effort
    }
  }

  private async pollHealthIfNeeded(force: boolean): Promise<void> {
    const now = Date.now();
    if (!force && this.lastHealthPollAt && now - this.lastHealthPollAt < 10_000) return;
    this.lastHealthPollAt = now;
    try {
      await this.session.request("health");
      this.emit({ healthOk: true });
    } catch {
      this.emit({ healthOk: false });
    }
  }

  private handleChatEvent(payloadJson: string): void {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      return;
    }

    const sessionKey = typeof payload.sessionKey === "string" ? payload.sessionKey.trim() : null;
    if (sessionKey && sessionKey !== this.state.sessionKey) return;

    const runId = typeof payload.runId === "string" ? payload.runId : null;
    if (runId && !this.pendingRuns.has(runId)) return;

    const state = typeof payload.state === "string" ? payload.state : null;

    if (state === "delta") {
      const text = this.parseAssistantDeltaText(payload);
      if (text) this.emit({ streamingAssistantText: text });
      return;
    }

    if (state === "final" || state === "aborted" || state === "error") {
      if (state === "error") {
        const errorMessage = typeof payload.errorMessage === "string" ? payload.errorMessage : "Chat failed";
        this.emit({ errorText: errorMessage });
      }

      if (runId) this.removePendingRun(runId);
      else this.clearAllPendingRuns();

      this.pendingToolCallsById.clear();
      this.emit({
        streamingAssistantText: undefined,
        pendingToolCalls: [],
      });

      // Refresh history
      this.session
        .request("chat.history", { sessionKey: this.state.sessionKey })
        .then((res) => {
          const history = this.parseHistory(res, this.state.sessionKey);
          this.emit({
            messages: history.messages,
            sessionId: history.sessionId,
          });
          if (history.thinkingLevel) {
            this.emit({ thinkingLevel: normalizeThinking(history.thinkingLevel) });
          }
        })
        .catch(() => {
          // best-effort
        });
    }
  }

  private handleAgentEvent(payloadJson: string): void {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      return;
    }

    const sessionKey = typeof payload.sessionKey === "string" ? payload.sessionKey.trim() : null;
    if (sessionKey && sessionKey !== this.state.sessionKey) return;

    const stream = typeof payload.stream === "string" ? payload.stream : null;
    const data = typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;

    if (stream === "assistant" && data) {
      const text = typeof data.text === "string" ? data.text : null;
      if (text) this.emit({ streamingAssistantText: text });
    } else if (stream === "tool" && data) {
      const phase = typeof data.phase === "string" ? data.phase : null;
      const name = typeof data.name === "string" ? data.name : null;
      const toolCallId = typeof data.toolCallId === "string" ? data.toolCallId : null;
      if (!phase || !name || !toolCallId) return;

      const ts = typeof payload.ts === "number" ? payload.ts : Date.now();

      if (phase === "start") {
        const args = typeof data.args === "object" && data.args !== null
          ? (data.args as Record<string, unknown>)
          : undefined;
        this.pendingToolCallsById.set(toolCallId, {
          toolCallId,
          name,
          args,
          startedAtMs: ts,
        });
        this.publishPendingToolCalls();
      } else if (phase === "result") {
        this.pendingToolCallsById.delete(toolCallId);
        this.publishPendingToolCalls();
      }
    } else if (stream === "error") {
      this.clearAllPendingRuns();
      this.pendingToolCallsById.clear();
      this.emit({
        errorText: "Event stream interrupted; try refreshing.",
        streamingAssistantText: undefined,
        pendingToolCalls: [],
      });
    }
  }

  private parseAssistantDeltaText(payload: Record<string, unknown>): string | null {
    const message = payload.message as Record<string, unknown> | undefined;
    if (!message || message.role !== "assistant") return null;
    const content = message.content as unknown[];
    if (!Array.isArray(content)) return null;

    for (const item of content) {
      if (typeof item !== "object" || item === null) continue;
      const obj = item as Record<string, unknown>;
      if (obj.type !== "text") continue;
      if (typeof obj.text === "string" && obj.text) return obj.text;
    }
    return null;
  }

  private parseHistory(raw: unknown, sessionKey: string): ChatHistory {
    if (typeof raw !== "object" || raw === null) {
      return { sessionKey, messages: [] };
    }
    const obj = raw as Record<string, unknown>;
    const sessionId = typeof obj.sessionId === "string" ? obj.sessionId : undefined;
    const thinkingLevel = typeof obj.thinkingLevel === "string" ? obj.thinkingLevel : undefined;
    const messagesArr = Array.isArray(obj.messages) ? obj.messages : [];

    const messages: ChatMessage[] = messagesArr
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => {
        const role = typeof item.role === "string" ? item.role : "system";
        const contentArr = Array.isArray(item.content) ? item.content : [];
        const content: ChatMessageContent[] = contentArr
          .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
          .map((c) => ({
            type: typeof c.type === "string" ? c.type : "text",
            text: typeof c.text === "string" ? c.text : undefined,
            mimeType: typeof c.mimeType === "string" ? c.mimeType : undefined,
            fileName: typeof c.fileName === "string" ? c.fileName : undefined,
            base64: typeof c.content === "string" ? c.content : undefined,
          }));
        const ts = typeof item.timestamp === "number" ? item.timestamp : undefined;
        return {
          id: uuidv4(),
          role: role as ChatMessage["role"],
          content,
          timestampMs: ts,
        };
      });

    return { sessionKey, sessionId, thinkingLevel, messages };
  }

  private parseSessions(raw: unknown): ChatSessionEntry[] {
    if (typeof raw !== "object" || raw === null) return [];
    const obj = raw as Record<string, unknown>;
    const sessions = Array.isArray(obj.sessions) ? obj.sessions : [];
    return sessions
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        key: typeof item.key === "string" ? item.key.trim() : "",
        updatedAtMs: typeof item.updatedAt === "number" ? item.updatedAt : undefined,
        displayName: typeof item.displayName === "string" ? item.displayName.trim() : undefined,
      }))
      .filter((entry) => entry.key.length > 0);
  }

  private parseRunId(res: unknown): string | null {
    if (typeof res !== "object" || res === null) return null;
    const obj = res as Record<string, unknown>;
    return typeof obj.runId === "string" ? obj.runId : null;
  }

  private addPendingRun(runId: string): void {
    this.pendingRuns.add(runId);
    this.emit({ pendingRunCount: this.pendingRuns.size });

    // Arm timeout
    const timer = setTimeout(() => {
      if (!this.pendingRuns.has(runId)) return;
      this.removePendingRun(runId);
      this.emit({ errorText: "Timed out waiting for a reply; try again or refresh." });
    }, this.pendingRunTimeoutMs);
    this.pendingRunTimers.set(runId, timer);
  }

  private removePendingRun(runId: string): void {
    const timer = this.pendingRunTimers.get(runId);
    if (timer) clearTimeout(timer);
    this.pendingRunTimers.delete(runId);
    this.pendingRuns.delete(runId);
    this.emit({ pendingRunCount: this.pendingRuns.size });
  }

  private clearAllPendingRuns(): void {
    for (const [, timer] of this.pendingRunTimers) {
      clearTimeout(timer);
    }
    this.pendingRunTimers.clear();
    this.pendingRuns.clear();
    this.emit({ pendingRunCount: 0 });
  }

  private publishPendingToolCalls(): void {
    const calls = [...this.pendingToolCallsById.values()].sort(
      (a, b) => a.startedAtMs - b.startedAtMs,
    );
    this.emit({ pendingToolCalls: calls });
  }

  private emit(partial: Partial<ChatControllerState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

function normalizeThinking(raw: string): ThinkingLevel {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
  return "off";
}
