import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TalkOrb } from "../components/TalkOrb";
import { StatusPill } from "../components/StatusPill";
import { useConnectionStore } from "../store/connection-store";
import type { VoiceState } from "../services/voice-service";
import { lightColors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

interface VoiceScreenProps {
  onSendVoiceMessage: (text: string) => void;
}

export function VoiceScreen({ onSendVoiceMessage }: VoiceScreenProps): React.JSX.Element {
  const colors = lightColors;
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");

  const connectionStatus = useConnectionStore((s) => s.status);
  const connectionMessage = useConnectionStore((s) => s.statusMessage);

  const handleOrbPress = useCallback(() => {
    if (voiceState === "idle") {
      setVoiceState("listening");
      setTranscript("");
    } else if (voiceState === "listening") {
      setVoiceState("processing");
      // In production, send the transcript
      if (transcript.trim()) {
        onSendVoiceMessage(transcript.trim());
      }
      setTimeout(() => setVoiceState("idle"), 1000);
    } else {
      setVoiceState("idle");
    }
  }, [voiceState, transcript, onSendVoiceMessage]);

  const handleOrbLongPress = useCallback(() => {
    setVoiceState("listening");
    setTranscript("");
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusBar}>
        <StatusPill status={connectionStatus} message={connectionMessage} colors={colors} />
      </View>

      <View style={styles.content}>
        <TalkOrb
          state={voiceState}
          colors={colors}
          onPress={handleOrbPress}
          onLongPress={handleOrbLongPress}
        />

        {transcript ? (
          <View style={[styles.transcriptBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.transcriptText, { color: colors.textPrimary }]}>{transcript}</Text>
          </View>
        ) : null}

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {connectionStatus !== "connected"
            ? "Connect to a gateway to use voice"
            : "Tap the orb to start talking"}
        </Text>
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
    gap: spacing.xl,
  },
  transcriptBox: {
    padding: spacing.lg,
    borderRadius: 12,
    width: "100%",
  },
  transcriptText: {
    ...typography.body,
    textAlign: "center",
  },
  hint: {
    ...typography.bodySmall,
    textAlign: "center",
  },
});
