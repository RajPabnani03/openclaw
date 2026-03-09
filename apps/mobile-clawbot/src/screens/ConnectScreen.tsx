import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { GatewayCard } from "../components/GatewayCard";
import { StatusPill } from "../components/StatusPill";
import { useConnectionStore } from "../store/connection-store";
import type { GatewayEndpoint } from "../types/protocol";
import { lightColors } from "../theme/colors";
import { spacing, radii } from "../theme/spacing";
import { typography } from "../theme/typography";

interface ConnectScreenProps {
  onConnect: (endpoint: GatewayEndpoint, token?: string) => void;
  onDisconnect: () => void;
}

export function ConnectScreen({ onConnect, onDisconnect }: ConnectScreenProps): React.JSX.Element {
  const colors = lightColors;
  const [manualHost, setManualHost] = useState("");
  const [manualPort, setManualPort] = useState("18789");
  const [token, setToken] = useState("");

  const status = useConnectionStore((s) => s.status);
  const statusMessage = useConnectionStore((s) => s.statusMessage);
  const endpoint = useConnectionStore((s) => s.endpoint);
  const discoveredGateways = useConnectionStore((s) => s.discoveredGateways);

  const handleManualConnect = () => {
    const host = manualHost.trim();
    const port = parseInt(manualPort.trim(), 10);
    if (!host) {
      Alert.alert("Error", "Please enter a gateway host address");
      return;
    }
    if (isNaN(port) || port <= 0 || port > 65535) {
      Alert.alert("Error", "Please enter a valid port number (1-65535)");
      return;
    }

    const ep: GatewayEndpoint = {
      stableId: `manual|${host.toLowerCase()}|${port}`,
      name: `${host}:${port}`,
      host,
      port,
      tlsEnabled: false,
    };
    onConnect(ep, token.trim() || undefined);
  };

  const handleGatewayPress = (ep: GatewayEndpoint) => {
    onConnect(ep, token.trim() || undefined);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <StatusPill status={status} message={statusMessage} colors={colors} />
      </View>

      {status === "connected" ? (
        <View style={styles.connectedSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Connected</Text>
          <Text style={[styles.connectedInfo, { color: colors.textSecondary }]}>
            {endpoint?.name ?? "Unknown gateway"}
          </Text>
          <TouchableOpacity
            style={[styles.disconnectButton, { borderColor: colors.error }]}
            onPress={onDisconnect}
          >
            <Text style={[styles.disconnectText, { color: colors.error }]}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Discovered gateways */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Discovered Gateways</Text>
      <FlatList
        data={discoveredGateways}
        keyExtractor={(item) => item.stableId}
        renderItem={({ item }) => (
          <GatewayCard
            endpoint={item}
            colors={colors}
            isConnected={endpoint?.stableId === item.stableId && status === "connected"}
            onPress={handleGatewayPress}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Scanning for gateways on local network...
          </Text>
        }
        style={styles.gatewayList}
      />

      {/* Manual connection */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Manual Connection</Text>
      <View style={styles.manualForm}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.hostInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={manualHost}
            onChangeText={setManualHost}
            placeholder="Gateway host"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.portInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={manualPort}
            onChangeText={setManualPort}
            placeholder="Port"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <TextInput
          style={[styles.tokenInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          value={token}
          onChangeText={setToken}
          placeholder="Token (optional)"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.primary }]}
          onPress={handleManualConnect}
        >
          <Text style={[styles.connectButtonText, { color: colors.textOnPrimary }]}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  header: {
    paddingBottom: spacing.md,
  },
  connectedSection: {
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  connectedInfo: {
    ...typography.body,
  },
  disconnectButton: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  disconnectText: {
    ...typography.button,
  },
  sectionTitle: {
    ...typography.h3,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  gatewayList: {
    maxHeight: 200,
  },
  emptyText: {
    ...typography.bodySmall,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  manualForm: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  hostInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  portInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  tokenInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  connectButton: {
    height: 44,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  connectButtonText: {
    ...typography.button,
  },
});
