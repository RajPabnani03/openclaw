import { useRef, useCallback, useEffect } from "react";
import { GatewaySession } from "../api/gateway-session";
import type { GatewaySessionCallbacks } from "../api/gateway-session";
import { generateDeviceIdentity } from "../api/device-identity";
import { ChatController } from "../services/chat-controller";
import { useConnectionStore } from "../store/connection-store";
import { useChatStore } from "../store/chat-store";
import type { GatewayEndpoint } from "../types/protocol";
import type { ThinkingLevel } from "../types/chat";

/**
 * Hook that wires together the GatewaySession, ChatController, and stores.
 * Provides connect/disconnect/sendMessage callbacks for the UI.
 */
export function useGatewayConnection() {
  const sessionRef = useRef<GatewaySession | null>(null);
  const chatRef = useRef<ChatController | null>(null);

  const setConnected = useConnectionStore((s) => s.setConnected);
  const setDisconnected = useConnectionStore((s) => s.setDisconnected);
  const setEndpoint = useConnectionStore((s) => s.setEndpoint);
  const updateChat = useChatStore((s) => s.updateFromControllerState);

  // Initialize session and chat controller
  useEffect(() => {
    const identity = generateDeviceIdentity();

    const callbacks: GatewaySessionCallbacks = {
      onConnected: (serverName, remoteAddress, mainSessionKey) => {
        setConnected(serverName, remoteAddress);
        if (mainSessionKey && chatRef.current) {
          chatRef.current.applyMainSessionKey(mainSessionKey);
        }
        chatRef.current?.load("main");
      },
      onDisconnected: (message) => {
        setDisconnected(message);
        chatRef.current?.onDisconnected(message);
      },
      onEvent: (event, payloadJson) => {
        chatRef.current?.handleGatewayEvent(event, payloadJson);
      },
    };

    const session = new GatewaySession(identity, callbacks);
    sessionRef.current = session;

    const chat = new ChatController(session);
    chatRef.current = chat;

    // Bridge chat controller state to Zustand store
    chat.subscribe((state) => {
      updateChat(state);
    });

    return () => {
      session.disconnect();
    };
  }, [setConnected, setDisconnected, updateChat]);

  const connect = useCallback(
    (endpoint: GatewayEndpoint, token?: string) => {
      setEndpoint(endpoint);
      sessionRef.current?.connect(endpoint, token);
    },
    [setEndpoint],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
    setEndpoint(null);
  }, [setEndpoint]);

  const sendMessage = useCallback((message: string) => {
    const thinkingLevel = useChatStore.getState().thinkingLevel;
    chatRef.current?.sendMessage(message, thinkingLevel);
  }, []);

  const sendVoiceMessage = useCallback((text: string) => {
    chatRef.current?.sendMessage(text, "low");
  }, []);

  const abort = useCallback(() => {
    chatRef.current?.abort();
  }, []);

  const setThinkingLevel = useCallback((level: ThinkingLevel) => {
    chatRef.current?.setThinkingLevel(level);
  }, []);

  const switchSession = useCallback((sessionKey: string) => {
    chatRef.current?.switchSession(sessionKey);
  }, []);

  const refresh = useCallback(() => {
    chatRef.current?.refresh();
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    sendVoiceMessage,
    abort,
    setThinkingLevel,
    switchSession,
    refresh,
  };
}
