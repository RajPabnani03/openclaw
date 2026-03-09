import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { useSettingsStore } from "../store/settings-store";
import type { GatewayEndpoint } from "../types/protocol";

const Stack = createNativeStackNavigator();

interface RootNavigatorProps {
  onSendMessage: (message: string) => void;
  onAbort: () => void;
  onAttachPress: () => void;
  onConnect: (endpoint: GatewayEndpoint, token?: string) => void;
  onDisconnect: () => void;
  onSendVoiceMessage: (text: string) => void;
  onOnboardingComplete: (config: { host: string; port: number; token?: string }) => void;
  onOnboardingSkip: () => void;
}

export function RootNavigator({
  onSendMessage,
  onAbort,
  onAttachPress,
  onConnect,
  onDisconnect,
  onSendVoiceMessage,
  onOnboardingComplete,
  onOnboardingSkip,
}: RootNavigatorProps): React.JSX.Element {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingComplete ? (
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen
              onComplete={onOnboardingComplete}
              onSkip={onOnboardingSkip}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main">
          {() => (
            <TabNavigator
              onSendMessage={onSendMessage}
              onAbort={onAbort}
              onAttachPress={onAttachPress}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onSendVoiceMessage={onSendVoiceMessage}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
