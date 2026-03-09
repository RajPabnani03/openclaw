import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";

export interface SettingsState {
  themeMode: ThemeMode;
  gatewayHost: string;
  gatewayPort: number;
  gatewayToken: string;
  onboardingComplete: boolean;
  voiceWakeEnabled: boolean;
  notificationsEnabled: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setGatewayHost: (host: string) => void;
  setGatewayPort: (port: number) => void;
  setGatewayToken: (token: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setVoiceWakeEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: "system",
  gatewayHost: "",
  gatewayPort: 18789,
  gatewayToken: "",
  onboardingComplete: false,
  voiceWakeEnabled: false,
  notificationsEnabled: true,

  setThemeMode: (mode) => set({ themeMode: mode }),
  setGatewayHost: (host) => set({ gatewayHost: host }),
  setGatewayPort: (port) => set({ gatewayPort: port }),
  setGatewayToken: (token) => set({ gatewayToken: token }),
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
  setVoiceWakeEnabled: (enabled) => set({ voiceWakeEnabled: enabled }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
}));
