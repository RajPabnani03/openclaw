import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ChatPendingToolCall } from "../types/chat";
import type { ColorPalette } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface ToolCallCardProps {
  toolCall: ChatPendingToolCall;
  colors: ColorPalette;
}

export function ToolCallCard({ toolCall, colors }: ToolCallCardProps): React.JSX.Element {
  const elapsed = Math.floor((Date.now() - toolCall.startedAtMs) / 1000);
  const elapsedText = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={[styles.spinner, { borderColor: colors.primary }]} />
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {toolCall.name}
        </Text>
        <Text style={[styles.elapsed, { color: colors.textTertiary }]}>{elapsedText}</Text>
      </View>
      {toolCall.args && Object.keys(toolCall.args).length > 0 ? (
        <Text style={[styles.args, { color: colors.textSecondary }]} numberOfLines={2}>
          {formatArgs(toolCall.args)}
        </Text>
      ) : null}
    </View>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      const valueStr = typeof value === "string" ? value : JSON.stringify(value);
      const truncated = valueStr.length > 60 ? `${valueStr.slice(0, 57)}...` : valueStr;
      return `${key}: ${truncated}`;
    })
    .join(", ");
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  spinner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderTopColor: "transparent",
  },
  name: {
    ...typography.bodySmall,
    fontWeight: "600",
    flex: 1,
  },
  elapsed: {
    ...typography.caption,
  },
  args: {
    ...typography.caption,
    fontFamily: "monospace",
    marginTop: spacing.xs,
  },
});
