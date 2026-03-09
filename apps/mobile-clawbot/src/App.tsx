import React, { useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./navigation/RootNavigator";
import { useGatewayConnection } from "./hooks/useGatewayConnection";
import { useSettingsStore } from "./store/settings-store";
import type { GatewayEndpoint } from "./types/protocol";

/**
 * Root application component.
 * Wires together navigation, gateway connection, and state management.
 */
export function App(): React.JSX.Element {
  const {
    connect,
    disconnect,
    sendMessage,
    sendVoiceMessage,
    abort,
  } = useGatewayConnection();

  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);
  const setGatewayHost = useSettingsStore((s) => s.setGatewayHost);
  const setGatewayPort = useSettingsStore((s) => s.setGatewayPort);
  const setGatewayToken = useSettingsStore((s) => s.setGatewayToken);

  const handleConnect = useCallback(
    (endpoint: GatewayEndpoint, token?: string) => {
      connect(endpoint, token);
    },
    [connect],
  );

  const handleOnboardingComplete = useCallback(
    (config: { host: string; port: number; token?: string }) => {
      setGatewayHost(config.host);
      setGatewayPort(config.port);
      if (config.token) setGatewayToken(config.token);
      setOnboardingComplete(true);

      // Auto-connect with the provided config
      if (config.host) {
        const endpoint: GatewayEndpoint = {
          stableId: `manual|${config.host.toLowerCase()}|${config.port}`,
          name: `${config.host}:${config.port}`,
          host: config.host,
          port: config.port,
          tlsEnabled: false,
        };
        connect(endpoint, config.token);
      }
    },
    [connect, setGatewayHost, setGatewayPort, setGatewayToken, setOnboardingComplete],
  );

  const handleOnboardingSkip = useCallback(() => {
    setOnboardingComplete(true);
  }, [setOnboardingComplete]);

  const handleAttachPress = useCallback(() => {
    // In production, open media picker action sheet
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator
          onSendMessage={sendMessage}
          onAbort={abort}
          onAttachPress={handleAttachPress}
          onConnect={handleConnect}
          onDisconnect={disconnect}
          onSendVoiceMessage={sendVoiceMessage}
          onOnboardingComplete={handleOnboardingComplete}
          onOnboardingSkip={handleOnboardingSkip}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
