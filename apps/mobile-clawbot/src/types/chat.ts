/** A single chat message. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: ChatMessageContent[];
  timestampMs?: number;
}

/** Content block within a message (text, image, file). */
export interface ChatMessageContent {
  type: string;
  text?: string;
  mimeType?: string;
  fileName?: string;
  base64?: string;
}

/** A pending tool call displayed while the agent works. */
export interface ChatPendingToolCall {
  toolCallId: string;
  name: string;
  args?: Record<string, unknown>;
  startedAtMs: number;
  isError?: boolean;
}

/** An entry in the session list. */
export interface ChatSessionEntry {
  key: string;
  updatedAtMs?: number;
  displayName?: string;
}

/** Parsed chat history from the gateway. */
export interface ChatHistory {
  sessionKey: string;
  sessionId?: string;
  thinkingLevel?: string;
  messages: ChatMessage[];
}

/** Outgoing file attachment. */
export interface OutgoingAttachment {
  type: string;
  mimeType: string;
  fileName: string;
  base64: string;
}

/** Thinking level for AI reasoning depth. */
export type ThinkingLevel = "off" | "low" | "medium" | "high";
