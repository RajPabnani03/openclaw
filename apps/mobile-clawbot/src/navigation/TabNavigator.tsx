import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ChatScreen } from "../screens/ChatScreen";
import { ConnectScreen } from "../screens/ConnectScreen";
import { VoiceScreen } from "../screens/VoiceScreen";
import { CanvasScreen } from "../screens/CanvasScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import type { GatewayEndpoint } from "../types/protocol";
import { lightColors } from "../theme/colors";

const Tab = createBottomTabNavigator();

interface TabNavigatorProps {
  onSendMessage: (message: string) => void;
  onAbort: () => void;
  onAttachPress: () => void;
  onConnect: (endpoint: GatewayEndpoint, token?: string) => void;
  onDisconnect: () => void;
  onSendVoiceMessage: (text: string) => void;
}

export function TabNavigator({
  onSendMessage,
  onAbort,
  onAttachPress,
  onConnect,
  onDisconnect,
  onSendVoiceMessage,
}: TabNavigatorProps): React.JSX.Element {
  const colors = lightColors;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Tab.Screen name="Chat" options={{ tabBarLabel: "Chat" }}>
        {() => (
          <ChatScreen
            onSendMessage={onSendMessage}
            onAbort={onAbort}
            onAttachPress={onAttachPress}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Voice" options={{ tabBarLabel: "Voice" }}>
        {() => <VoiceScreen onSendVoiceMessage={onSendVoiceMessage} />}
      </Tab.Screen>
      <Tab.Screen name="Canvas" options={{ tabBarLabel: "Canvas" }}>
        {() => <CanvasScreen />}
      </Tab.Screen>
      <Tab.Screen name="Connect" options={{ tabBarLabel: "Connect" }}>
        {() => <ConnectScreen onConnect={onConnect} onDisconnect={onDisconnect} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ tabBarLabel: "Settings" }}>
        {() => <SettingsScreen appVersion="2026.2.25" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
