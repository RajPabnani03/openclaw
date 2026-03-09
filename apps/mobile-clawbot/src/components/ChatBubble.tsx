import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ChatMessage } from "../types/chat";
import type { ColorPalette } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface ChatBubbleProps {
  message: ChatMessage;
  colors: ColorPalette;
}

export function ChatBubble({ message, colors }: ChatBubbleProps): React.JSX.Element {
  const isUser = message.role === "user";
  const bubbleBg = isUser ? colors.userBubble : colors.assistantBubble;
  const textColor = isUser ? colors.userBubbleText : colors.assistantBubbleText;

  const textContent = message.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("\n");

  const hasAttachments = message.content.some((c) => c.type !== "text");

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {textContent ? (
          <Text style={[styles.text, { color: textColor }]}>{textContent}</Text>
        ) : null}
        {hasAttachments ? (
          <View style={styles.attachmentRow}>
            {message.content
              .filter((c) => c.type !== "text")
              .map((c, i) => (
                <View key={i} style={[styles.attachmentBadge, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>
                    {c.fileName || c.mimeType || c.type}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}
        {message.timestampMs ? (
          <Text style={[styles.timestamp, { color: isUser ? colors.textOnPrimary : colors.textTertiary }]}>
            {formatTime(message.timestampMs)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function formatTime(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  bubbleUser: {
    borderBottomRightRadius: radii.sm,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: radii.sm,
  },
  text: {
    ...typography.body,
  },
  timestamp: {
    ...typography.caption,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  attachmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  attachmentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  attachmentText: {
    ...typography.caption,
  },
});
