import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { GatewayEndpoint } from "../types/protocol";
import type { ColorPalette } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface GatewayCardProps {
  endpoint: GatewayEndpoint;
  colors: ColorPalette;
  isConnected: boolean;
  onPress: (endpoint: GatewayEndpoint) => void;
}

export function GatewayCard({
  endpoint,
  colors,
  isConnected,
  onPress,
}: GatewayCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isConnected ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={() => onPress(endpoint)}
      accessibilityLabel={`Connect to ${endpoint.name}`}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {endpoint.name}
        </Text>
        <Text style={[styles.address, { color: colors.textSecondary }]}>
          {endpoint.host}:{endpoint.port}
        </Text>
        {endpoint.tlsEnabled ? (
          <View style={[styles.badge, { backgroundColor: colors.secondary + "20" }]}>
            <Text style={[styles.badgeText, { color: colors.secondary }]}>TLS</Text>
          </View>
        ) : null}
      </View>
      {isConnected ? (
        <View style={[styles.connectedDot, { backgroundColor: colors.statusConnected }]} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.body,
    fontWeight: "600",
  },
  address: {
    ...typography.caption,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
