import React, { useRef, useEffect, useCallback } from "react";
import { View, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { ChatBubble } from "../components/ChatBubble";
import { ChatComposer } from "../components/ChatComposer";
import { ToolCallCard } from "../components/ToolCallCard";
import { StatusPill } from "../components/StatusPill";
import { useChatStore } from "../store/chat-store";
import { useConnectionStore } from "../store/connection-store";
import type { ChatMessage } from "../types/chat";
import { lightColors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

interface ChatScreenProps {
  onSendMessage: (message: string) => void;
  onAbort: () => void;
  onAttachPress: () => void;
}

export function ChatScreen({ onSendMessage, onAbort, onAttachPress }: ChatScreenProps): React.JSX.Element {
  const colors = lightColors;
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const messages = useChatStore((s) => s.messages);
  const streamingText = useChatStore((s) => s.streamingAssistantText);
  const pendingToolCalls = useChatStore((s) => s.pendingToolCalls);
  const errorText = useChatStore((s) => s.errorText);
  const healthOk = useChatStore((s) => s.healthOk);
  const pendingRunCount = useChatStore((s) => s.pendingRunCount);
  const connectionStatus = useConnectionStore((s) => s.status);
  const connectionMessage = useConnectionStore((s) => s.statusMessage);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamingText]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} colors={colors} />,
    [colors],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const isProcessing = pendingRunCount > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.statusBar}>
        <StatusPill status={connectionStatus} message={connectionMessage} colors={colors} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>OpenClaw</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {connectionStatus === "connected"
                ? "Send a message to get started"
                : "Connect to a gateway to begin"}
            </Text>
          </View>
        }
      />

      {/* Streaming assistant text */}
      {streamingText ? (
        <View style={[styles.streamingContainer, { backgroundColor: colors.assistantBubble }]}>
          <Text style={[styles.streamingText, { color: colors.assistantBubbleText }]}>
            {streamingText}
          </Text>
        </View>
      ) : null}

      {/* Pending tool calls */}
      {pendingToolCalls.map((tc) => (
        <ToolCallCard key={tc.toolCallId} toolCall={tc} colors={colors} />
      ))}

      {/* Error banner */}
      {errorText ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + "15" }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{errorText}</Text>
        </View>
      ) : null}

      <ChatComposer
        colors={colors}
        disabled={!healthOk || connectionStatus !== "connected"}
        isProcessing={isProcessing}
        onSend={onSendMessage}
        onAbort={onAbort}
        onAttachPress={onAttachPress}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  messageList: {
    paddingVertical: spacing.sm,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: "center",
  },
  streamingContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
  },
  streamingText: {
    ...typography.body,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
  },
  errorText: {
    ...typography.bodySmall,
  },
});
