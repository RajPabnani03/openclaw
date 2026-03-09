import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../../src/store/chat-store";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      sessionKey: "main",
      messages: [],
      healthOk: false,
      thinkingLevel: "off",
      pendingRunCount: 0,
      pendingToolCalls: [],
      sessions: [],
      errorText: undefined,
      streamingAssistantText: undefined,
      sessionId: undefined,
    });
  });

  it("starts with default state", () => {
    const state = useChatStore.getState();
    expect(state.sessionKey).toBe("main");
    expect(state.messages).toEqual([]);
    expect(state.healthOk).toBe(false);
    expect(state.thinkingLevel).toBe("off");
  });

  describe("setMessages", () => {
    it("replaces messages array", () => {
      const msgs = [
        { id: "1", role: "user" as const, content: [{ type: "text", text: "hi" }] },
      ];
      useChatStore.getState().setMessages(msgs);
      expect(useChatStore.getState().messages).toEqual(msgs);
    });
  });

  describe("addMessage", () => {
    it("appends a message", () => {
      const msg = { id: "1", role: "user" as const, content: [{ type: "text", text: "hi" }] };
      useChatStore.getState().addMessage(msg);
      expect(useChatStore.getState().messages).toHaveLength(1);
      useChatStore.getState().addMessage({ ...msg, id: "2" });
      expect(useChatStore.getState().messages).toHaveLength(2);
    });
  });

  describe("setThinkingLevel", () => {
    it("updates thinking level", () => {
      useChatStore.getState().setThinkingLevel("high");
      expect(useChatStore.getState().thinkingLevel).toBe("high");
    });
  });

  describe("setHealthOk", () => {
    it("updates health status", () => {
      useChatStore.getState().setHealthOk(true);
      expect(useChatStore.getState().healthOk).toBe(true);
    });
  });

  describe("setErrorText", () => {
    it("sets error text", () => {
      useChatStore.getState().setErrorText("Something broke");
      expect(useChatStore.getState().errorText).toBe("Something broke");
    });

    it("clears error text", () => {
      useChatStore.getState().setErrorText("error");
      useChatStore.getState().setErrorText(undefined);
      expect(useChatStore.getState().errorText).toBeUndefined();
    });
  });

  describe("updateFromControllerState", () => {
    it("batch-updates all chat state", () => {
      useChatStore.getState().updateFromControllerState({
        sessionKey: "session-2",
        messages: [{ id: "m1", role: "assistant", content: [{ type: "text", text: "hi" }] }],
        healthOk: true,
        thinkingLevel: "medium",
        pendingRunCount: 1,
        pendingToolCalls: [],
        sessions: [{ key: "session-2", updatedAtMs: 1000 }],
      });

      const state = useChatStore.getState();
      expect(state.sessionKey).toBe("session-2");
      expect(state.messages).toHaveLength(1);
      expect(state.healthOk).toBe(true);
      expect(state.thinkingLevel).toBe("medium");
      expect(state.pendingRunCount).toBe(1);
      expect(state.sessions).toHaveLength(1);
    });
  });
});
