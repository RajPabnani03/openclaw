/**
 * Secure credential storage abstraction.
 * In production, uses react-native-keychain for iOS Keychain / Android Keystore.
 */

export interface SecureStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * In-memory storage for development/testing.
 */
export class InMemorySecureStorage implements SecureStorageService {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/** Storage keys used by the app. */
export const StorageKeys = {
  DEVICE_IDENTITY: "openclaw.device.identity",
  DEVICE_TOKEN_PREFIX: "openclaw.device.token.",
  GATEWAY_HOST: "openclaw.gateway.host",
  GATEWAY_PORT: "openclaw.gateway.port",
  GATEWAY_TOKEN: "openclaw.gateway.token",
  ONBOARDING_COMPLETE: "openclaw.onboarding.complete",
  THEME_MODE: "openclaw.theme.mode",
} as const;

/**
 * Build the storage key for a device token.
 */
export function deviceTokenKey(deviceId: string, role: string): string {
  return `${StorageKeys.DEVICE_TOKEN_PREFIX}${deviceId}.${role}`;
}
