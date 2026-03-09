import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ConnectionStatus } from "../store/connection-store";
import type { ColorPalette } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface StatusPillProps {
  status: ConnectionStatus;
  message: string;
  colors: ColorPalette;
}

export function StatusPill({ status, message, colors }: StatusPillProps): React.JSX.Element {
  const dotColor =
    status === "connected"
      ? colors.statusConnected
      : status === "connecting"
        ? colors.statusConnecting
        : colors.statusDisconnected;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.caption,
  },
});
