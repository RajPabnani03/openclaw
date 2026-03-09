import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySecureStorage, StorageKeys, deviceTokenKey } from "../../src/services/secure-storage";

describe("InMemorySecureStorage", () => {
  let storage: InMemorySecureStorage;

  beforeEach(() => {
    storage = new InMemorySecureStorage();
  });

  it("returns null for missing keys", async () => {
    const result = await storage.getItem("missing");
    expect(result).toBeNull();
  });

  it("stores and retrieves values", async () => {
    await storage.setItem("key", "value");
    const result = await storage.getItem("key");
    expect(result).toBe("value");
  });

  it("overwrites existing values", async () => {
    await storage.setItem("key", "first");
    await storage.setItem("key", "second");
    const result = await storage.getItem("key");
    expect(result).toBe("second");
  });

  it("removes values", async () => {
    await storage.setItem("key", "value");
    await storage.removeItem("key");
    const result = await storage.getItem("key");
    expect(result).toBeNull();
  });

  it("handles removing non-existent keys", async () => {
    await storage.removeItem("nonexistent");
    // Should not throw
  });
});

describe("StorageKeys", () => {
  it("has expected key constants", () => {
    expect(StorageKeys.DEVICE_IDENTITY).toBe("openclaw.device.identity");
    expect(StorageKeys.GATEWAY_HOST).toBe("openclaw.gateway.host");
    expect(StorageKeys.GATEWAY_PORT).toBe("openclaw.gateway.port");
    expect(StorageKeys.GATEWAY_TOKEN).toBe("openclaw.gateway.token");
    expect(StorageKeys.ONBOARDING_COMPLETE).toBe("openclaw.onboarding.complete");
    expect(StorageKeys.THEME_MODE).toBe("openclaw.theme.mode");
  });
});

describe("deviceTokenKey", () => {
  it("builds the correct key", () => {
    const key = deviceTokenKey("device-123", "node");
    expect(key).toBe("openclaw.device.token.device-123.node");
  });

  it("handles different roles", () => {
    const admin = deviceTokenKey("d1", "admin");
    const node = deviceTokenKey("d1", "node");
    expect(admin).not.toBe(node);
    expect(admin).toContain("admin");
    expect(node).toContain("node");
  });
});
