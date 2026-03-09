import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { lightColors } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface OnboardingScreenProps {
  onComplete: (config: { host: string; port: number; token?: string }) => void;
  onSkip: () => void;
}

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps): React.JSX.Element {
  const colors = lightColors;
  const [step, setStep] = useState<"welcome" | "connect" | "done">("welcome");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("18789");
  const [token, setToken] = useState("");

  const handleNext = () => {
    if (step === "welcome") {
      setStep("connect");
    } else if (step === "connect") {
      const portNum = parseInt(port.trim(), 10) || 18789;
      onComplete({
        host: host.trim(),
        port: portNum,
        token: token.trim() || undefined,
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {step === "welcome" ? (
        <View style={styles.centered}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome to OpenClaw</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your AI gateway companion for mobile. Connect to your OpenClaw gateway to chat,
            use voice, and control your AI from anywhere.
          </Text>
          <View style={styles.featureList}>
            {[
              "Chat with AI assistants",
              "Voice interaction (talk mode)",
              "Camera and media sharing",
              "Multi-session support",
              "Secure gateway connection",
            ].map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={[styles.featureBullet, { color: colors.primary }]}>*</Text>
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>Get Started</Text>
          </TouchableOpacity>
        </View>
      ) : step === "connect" ? (
        <View style={styles.formSection}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Connect to Gateway</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your OpenClaw gateway address. Your gateway runs on your computer or server.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Gateway Host</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={host}
              onChangeText={setHost}
              placeholder="e.g., 192.168.1.100 or my-host.ts.net"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Port</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={port}
              onChangeText={setPort}
              placeholder="18789"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Token (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={token}
              onChangeText={setToken}
              placeholder="Shared access token"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}>Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centered: {
    alignItems: "center",
    gap: spacing.lg,
  },
  formSection: {
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 24,
  },
  featureList: {
    alignSelf: "stretch",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureBullet: {
    ...typography.body,
    fontWeight: "700",
  },
  featureText: {
    ...typography.body,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  primaryButton: {
    height: 50,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    ...typography.button,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipText: {
    ...typography.body,
  },
});
