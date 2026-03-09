import { create } from "zustand";
import type {
  ChatMessage,
  ChatPendingToolCall,
  ChatSessionEntry,
  ThinkingLevel,
} from "../types/chat";

export interface ChatState {
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

  setSessionKey: (key: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setErrorText: (text?: string) => void;
  setHealthOk: (ok: boolean) => void;
  setThinkingLevel: (level: ThinkingLevel) => void;
  setPendingRunCount: (count: number) => void;
  setStreamingAssistantText: (text?: string) => void;
  setPendingToolCalls: (calls: ChatPendingToolCall[]) => void;
  setSessions: (sessions: ChatSessionEntry[]) => void;
  setSessionId: (id?: string) => void;
  updateFromControllerState: (state: {
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
  }) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessionKey: "main",
  messages: [],
  healthOk: false,
  thinkingLevel: "off",
  pendingRunCount: 0,
  pendingToolCalls: [],
  sessions: [],

  setSessionKey: (key) => set({ sessionKey: key }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setErrorText: (text) => set({ errorText: text }),
  setHealthOk: (ok) => set({ healthOk: ok }),
  setThinkingLevel: (level) => set({ thinkingLevel: level }),
  setPendingRunCount: (count) => set({ pendingRunCount: count }),
  setStreamingAssistantText: (text) => set({ streamingAssistantText: text }),
  setPendingToolCalls: (calls) => set({ pendingToolCalls: calls }),
  setSessions: (sessions) => set({ sessions }),
  setSessionId: (id) => set({ sessionId: id }),
  updateFromControllerState: (state) => set(state),
}));
