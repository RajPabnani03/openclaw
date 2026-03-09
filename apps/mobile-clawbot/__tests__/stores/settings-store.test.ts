import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../../src/store/settings-store";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      themeMode: "system",
      gatewayHost: "",
      gatewayPort: 18789,
      gatewayToken: "",
      onboardingComplete: false,
      voiceWakeEnabled: false,
      notificationsEnabled: true,
    });
  });

  it("starts with default settings", () => {
    const state = useSettingsStore.getState();
    expect(state.themeMode).toBe("system");
    expect(state.gatewayPort).toBe(18789);
    expect(state.onboardingComplete).toBe(false);
    expect(state.notificationsEnabled).toBe(true);
  });

  describe("setThemeMode", () => {
    it("updates theme mode", () => {
      useSettingsStore.getState().setThemeMode("dark");
      expect(useSettingsStore.getState().themeMode).toBe("dark");
    });
  });

  describe("gateway settings", () => {
    it("sets gateway host", () => {
      useSettingsStore.getState().setGatewayHost("192.168.1.100");
      expect(useSettingsStore.getState().gatewayHost).toBe("192.168.1.100");
    });

    it("sets gateway port", () => {
      useSettingsStore.getState().setGatewayPort(8080);
      expect(useSettingsStore.getState().gatewayPort).toBe(8080);
    });

    it("sets gateway token", () => {
      useSettingsStore.getState().setGatewayToken("my-secret-token");
      expect(useSettingsStore.getState().gatewayToken).toBe("my-secret-token");
    });
  });

  describe("setOnboardingComplete", () => {
    it("marks onboarding as complete", () => {
      useSettingsStore.getState().setOnboardingComplete(true);
      expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    });
  });

  describe("feature toggles", () => {
    it("toggles voice wake", () => {
      useSettingsStore.getState().setVoiceWakeEnabled(true);
      expect(useSettingsStore.getState().voiceWakeEnabled).toBe(true);
    });

    it("toggles notifications", () => {
      useSettingsStore.getState().setNotificationsEnabled(false);
      expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
    });
  });
});
