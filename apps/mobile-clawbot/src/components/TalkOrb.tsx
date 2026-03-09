import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import type { VoiceState } from "../services/voice-service";
import type { ColorPalette } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

interface TalkOrbProps {
  state: VoiceState;
  colors: ColorPalette;
  onPress: () => void;
  onLongPress: () => void;
}

export function TalkOrb({ state, colors, onPress, onLongPress }: TalkOrbProps): React.JSX.Element {
  const orbColor =
    state === "listening"
      ? colors.error
      : state === "processing"
        ? colors.warning
        : state === "speaking"
          ? colors.secondary
          : colors.primary;

  const label =
    state === "listening"
      ? "Listening..."
      : state === "processing"
        ? "Processing..."
        : state === "speaking"
          ? "Speaking..."
          : "Tap to talk";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.orb, { backgroundColor: orbColor }]}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <View style={[styles.innerOrb, { backgroundColor: orbColor, opacity: 0.8 }]} />
      </TouchableOpacity>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  label: {
    ...typography.body,
  },
});
