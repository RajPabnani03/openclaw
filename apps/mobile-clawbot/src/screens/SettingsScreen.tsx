import React from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSettingsStore } from "../store/settings-store";
import { useConnectionStore } from "../store/connection-store";
import { useChatStore } from "../store/chat-store";
import { lightColors } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { ThinkingLevel } from "../types/chat";
import type { ThemeMode } from "../store/settings-store";

interface SettingsScreenProps {
  appVersion: string;
}

export function SettingsScreen({ appVersion }: SettingsScreenProps): React.JSX.Element {
  const colors = lightColors;

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const voiceWakeEnabled = useSettingsStore((s) => s.voiceWakeEnabled);
  const setVoiceWakeEnabled = useSettingsStore((s) => s.setVoiceWakeEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  const connectionStatus = useConnectionStore((s) => s.status);
  const serverName = useConnectionStore((s) => s.serverName);
  const remoteAddress = useConnectionStore((s) => s.remoteAddress);

  const thinkingLevel = useChatStore((s) => s.thinkingLevel);
  const sessionKey = useChatStore((s) => s.sessionKey);
  const sessions = useChatStore((s) => s.sessions);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  const thinkingOptions: { label: string; value: ThinkingLevel }[] = [
    { label: "Off", value: "off" },
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Connection info */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Connection</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <SettingRow label="Status" value={connectionStatus} colors={colors} />
        {serverName ? <SettingRow label="Server" value={serverName} colors={colors} /> : null}
        {remoteAddress ? <SettingRow label="Address" value={remoteAddress} colors={colors} /> : null}
      </View>

      {/* Chat settings */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Chat</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <SettingRow label="Session" value={sessionKey} colors={colors} />
        <SettingRow label="Sessions" value={String(sessions.length)} colors={colors} />
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Thinking</Text>
          <View style={styles.optionButtons}>
            {thinkingOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: thinkingLevel === opt.value ? colors.primary : colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    {
                      color: thinkingLevel === opt.value ? colors.textOnPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Theme</Text>
          <View style={styles.optionButtons}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: themeMode === opt.value ? colors.primary : colors.surfaceSecondary,
                  },
                ]}
                onPress={() => setThemeMode(opt.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    {
                      color: themeMode === opt.value ? colors.textOnPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Features */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Features</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Voice Wake</Text>
          <Switch value={voiceWakeEnabled} onValueChange={setVoiceWakeEnabled} />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </View>

      {/* About */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <SettingRow label="Version" value={appVersion} colors={colors} />
        <SettingRow label="Protocol" value="v3" colors={colors} />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof lightColors;
}): React.JSX.Element {
  return (
    <View style={settingRowStyles.row}>
      <Text style={[settingRowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[settingRowStyles.value, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
  },
  value: {
    ...typography.bodySmall,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  optionRow: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  optionLabel: {
    ...typography.bodySmall,
  },
  optionButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  optionButtonText: {
    ...typography.caption,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    ...typography.body,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
