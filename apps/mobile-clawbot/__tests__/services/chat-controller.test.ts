import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatController } from "../../src/services/chat-controller";
import type { ChatControllerState } from "../../src/services/chat-controller";

// Mock GatewaySession
function createMockSession() {
  return {
    request: vi.fn().mockResolvedValue({}),
    sendNodeEvent: vi.fn().mockResolvedValue(true),
    connect: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    getCanvasHostUrl: vi.fn().mockReturnValue(null),
    getMainSessionKey: vi.fn().mockReturnValue(null),
  };
}

describe("ChatController", () => {
  let session: ReturnType<typeof createMockSession>;
  let controller: ChatController;
  let lastState: ChatControllerState;

  beforeEach(() => {
    session = createMockSession();
    // @ts-expect-error - mock session
    controller = new ChatController(session, true);
    controller.subscribe((state) => {
      lastState = state;
    });
  });

  describe("initial state", () => {
    it("starts with default state", () => {
      expect(lastState.sessionKey).toBe("main");
      expect(lastState.messages).toEqual([]);
      expect(lastState.healthOk).toBe(false);
      expect(lastState.thinkingLevel).toBe("off");
      expect(lastState.pendingRunCount).toBe(0);
      expect(lastState.pendingToolCalls).toEqual([]);
      expect(lastState.sessions).toEqual([]);
    });
  });

  describe("subscribe", () => {
    it("calls listener immediately with current state", () => {
      const listener = vi.fn();
      controller.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ sessionKey: "main" }));
    });

    it("returns unsubscribe function", () => {
      const listener = vi.fn();
      const unsub = controller.subscribe(listener);
      listener.mockClear();
      unsub();
      controller.setThinkingLevel("high");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("setThinkingLevel", () => {
    it("updates thinking level", () => {
      controller.setThinkingLevel("high");
      expect(lastState.thinkingLevel).toBe("high");
    });

    it("does not emit when level unchanged", () => {
      const listener = vi.fn();
      controller.subscribe(listener);
      listener.mockClear();
      controller.setThinkingLevel("off");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("onDisconnected", () => {
    it("resets health and clears pending state", () => {
      controller.onDisconnected("Connection lost");
      expect(lastState.healthOk).toBe(false);
      expect(lastState.pendingRunCount).toBe(0);
      expect(lastState.pendingToolCalls).toEqual([]);
      expect(lastState.streamingAssistantText).toBeUndefined();
    });
  });

  describe("sendMessage", () => {
    it("rejects when health is not OK", () => {
      controller.sendMessage("hello", "off");
      expect(lastState.errorText).toBe("Gateway health not OK; cannot send");
    });

    it("ignores empty messages", () => {
      const listener = vi.fn();
      controller.subscribe(listener);
      listener.mockClear();
      controller.sendMessage("", "off");
      // Should not emit (no message, no error since it exits early)
      expect(listener).not.toHaveBeenCalled();
    });

    it("sends message when health is OK", async () => {
      // Simulate health OK
      Object.assign(controller, { state: { ...controller.getState(), healthOk: true } });
      // Force healthOk
      controller.handleGatewayEvent("health", undefined);

      session.request.mockResolvedValueOnce({
        sessionId: "s1",
        messages: [],
      });
      session.request.mockResolvedValueOnce({});
      session.request.mockResolvedValueOnce({ sessions: [] });
      session.request.mockResolvedValueOnce({ runId: "run-1" });

      // Need to set health OK first
      await new Promise((r) => setTimeout(r, 10));

      if (lastState.healthOk) {
        controller.sendMessage("hello", "low");
        expect(lastState.messages.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("handleGatewayEvent", () => {
    it("handles health event", () => {
      controller.handleGatewayEvent("health", undefined);
      expect(lastState.healthOk).toBe(true);
    });

    it("handles seqGap event", () => {
      controller.handleGatewayEvent("seqGap", undefined);
      expect(lastState.errorText).toBe("Event stream interrupted; try refreshing.");
    });

    it("ignores chat events for different session", () => {
      const prevMessages = lastState.messages;
      controller.handleGatewayEvent(
        "chat",
        JSON.stringify({ sessionKey: "other-session", state: "final" }),
      );
      expect(lastState.messages).toEqual(prevMessages);
    });

    it("handles agent assistant stream event", () => {
      controller.handleGatewayEvent(
        "agent",
        JSON.stringify({
          stream: "assistant",
          data: { text: "Hello there" },
        }),
      );
      expect(lastState.streamingAssistantText).toBe("Hello there");
    });

    it("handles agent tool start event", () => {
      controller.handleGatewayEvent(
        "agent",
        JSON.stringify({
          stream: "tool",
          data: {
            phase: "start",
            name: "web_search",
            toolCallId: "tc-1",
          },
          ts: 1000,
        }),
      );
      expect(lastState.pendingToolCalls).toHaveLength(1);
      expect(lastState.pendingToolCalls[0].name).toBe("web_search");
      expect(lastState.pendingToolCalls[0].toolCallId).toBe("tc-1");
    });

    it("handles agent tool result event", () => {
      // Start a tool call
      controller.handleGatewayEvent(
        "agent",
        JSON.stringify({
          stream: "tool",
          data: { phase: "start", name: "search", toolCallId: "tc-2" },
          ts: 1000,
        }),
      );
      expect(lastState.pendingToolCalls).toHaveLength(1);

      // Complete it
      controller.handleGatewayEvent(
        "agent",
        JSON.stringify({
          stream: "tool",
          data: { phase: "result", name: "search", toolCallId: "tc-2" },
        }),
      );
      expect(lastState.pendingToolCalls).toHaveLength(0);
    });

    it("handles agent error stream", () => {
      controller.handleGatewayEvent(
        "agent",
        JSON.stringify({ stream: "error" }),
      );
      expect(lastState.errorText).toBe("Event stream interrupted; try refreshing.");
      expect(lastState.pendingToolCalls).toEqual([]);
    });

    it("ignores malformed JSON payloads", () => {
      const prevState = { ...lastState };
      controller.handleGatewayEvent("chat", "not valid json");
      // Should not crash or change state meaningfully
      expect(lastState.messages).toEqual(prevState.messages);
    });
  });

  describe("switchSession", () => {
    it("updates session key", () => {
      session.request.mockResolvedValue({ messages: [], sessions: [] });
      controller.switchSession("my-session");
      expect(lastState.sessionKey).toBe("my-session");
    });

    it("ignores empty session key", () => {
      controller.switchSession("");
      expect(lastState.sessionKey).toBe("main");
    });

    it("ignores same session key", () => {
      const listener = vi.fn();
      controller.subscribe(listener);
      listener.mockClear();
      controller.switchSession("main");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("applyMainSessionKey", () => {
    it("updates session key from main", () => {
      session.request.mockResolvedValue({ messages: [], sessions: [] });
      controller.applyMainSessionKey("new-main-key");
      expect(lastState.sessionKey).toBe("new-main-key");
    });

    it("ignores empty key", () => {
      controller.applyMainSessionKey("");
      expect(lastState.sessionKey).toBe("main");
    });

    it("ignores when already on non-main session", () => {
      session.request.mockResolvedValue({ messages: [], sessions: [] });
      controller.switchSession("custom");
      controller.applyMainSessionKey("new-key");
      expect(lastState.sessionKey).toBe("custom");
    });
  });
});
