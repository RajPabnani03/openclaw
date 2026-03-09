import React, { useState, useCallback } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import type { ColorPalette } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface ChatComposerProps {
  colors: ColorPalette;
  disabled: boolean;
  isProcessing: boolean;
  onSend: (message: string) => void;
  onAbort: () => void;
  onAttachPress: () => void;
}

export function ChatComposer({
  colors,
  disabled,
  isProcessing,
  onSend,
  onAbort,
  onAttachPress,
}: ChatComposerProps): React.JSX.Element {
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }, [text, onSend]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <TouchableOpacity
        onPress={onAttachPress}
        style={[styles.attachButton, { backgroundColor: colors.surfaceSecondary }]}
        accessibilityLabel="Attach file"
      >
        <Text style={[styles.attachIcon, { color: colors.textSecondary }]}>+</Text>
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.textPrimary,
            borderColor: colors.border,
          },
        ]}
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        placeholderTextColor={colors.textTertiary}
        multiline
        maxLength={10_000}
        editable={!disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        blurOnSubmit
      />

      {isProcessing ? (
        <TouchableOpacity
          onPress={onAbort}
          style={[styles.sendButton, { backgroundColor: colors.error }]}
          accessibilityLabel="Stop"
        >
          <Text style={[styles.sendIcon, { color: colors.textOnPrimary }]}>Stop</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleSend}
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? colors.primary : colors.surfaceSecondary },
          ]}
          disabled={!canSend}
          accessibilityLabel="Send message"
        >
          <Text
            style={[
              styles.sendIcon,
              { color: canSend ? colors.textOnPrimary : colors.textTertiary },
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  attachIcon: {
    fontSize: 22,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  sendButton: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendIcon: {
    ...typography.button,
    fontSize: 14,
  },
});
