import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusPill } from "../components/StatusPill";
import { useConnectionStore } from "../store/connection-store";
import { lightColors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

/**
 * Canvas screen for A2UI (Agent-to-UI) WebView.
 * In production, renders a WebView pointing to the gateway's canvas host URL.
 */
export function CanvasScreen(): React.JSX.Element {
  const colors = lightColors;
  const connectionStatus = useConnectionStore((s) => s.status);
  const connectionMessage = useConnectionStore((s) => s.statusMessage);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusBar}>
        <StatusPill status={connectionStatus} message={connectionMessage} colors={colors} />
      </View>

      <View style={styles.content}>
        {connectionStatus === "connected" ? (
          <View style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.placeholderTitle, { color: colors.textSecondary }]}>Canvas</Text>
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
              A2UI canvas will render here via WebView when the gateway provides a canvas host URL.
            </Text>
          </View>
        ) : (
          <View style={styles.disconnected}>
            <Text style={[styles.disconnectedText, { color: colors.textTertiary }]}>
              Connect to a gateway to use Canvas
            </Text>
          </View>
        )}
      </View>
    </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  placeholderTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    textAlign: "center",
  },
  disconnected: {
    padding: spacing.xl,
  },
  disconnectedText: {
    ...typography.body,
    textAlign: "center",
  },
});
