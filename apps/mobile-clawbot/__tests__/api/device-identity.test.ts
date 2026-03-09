import { describe, it, expect } from "vitest";
import {
  generateDeviceIdentity,
  base64UrlEncode,
  base64UrlDecode,
  signPayload,
} from "../../src/api/device-identity";

describe("generateDeviceIdentity", () => {
  it("generates a unique device ID", () => {
    const id1 = generateDeviceIdentity();
    const id2 = generateDeviceIdentity();
    expect(id1.deviceId).toBeTruthy();
    expect(id2.deviceId).toBeTruthy();
    expect(id1.deviceId).not.toBe(id2.deviceId);
  });

  it("returns a valid UUID format device ID", () => {
    const identity = generateDeviceIdentity();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(identity.deviceId).toMatch(uuidRegex);
  });

  it("returns string public and secret keys", () => {
    const identity = generateDeviceIdentity();
    expect(typeof identity.publicKey).toBe("string");
    expect(typeof identity.secretKey).toBe("string");
  });
});

describe("base64UrlEncode", () => {
  it("encodes bytes to base64url", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = base64UrlEncode(bytes);
    expect(result).toBe("SGVsbG8");
  });

  it("replaces + with - and / with _", () => {
    // Bytes that produce + and / in standard base64
    const bytes = new Uint8Array([251, 239, 190]);
    const result = base64UrlEncode(bytes);
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("handles empty input", () => {
    const result = base64UrlEncode(new Uint8Array(0));
    expect(result).toBe("");
  });
});

describe("base64UrlDecode", () => {
  it("decodes base64url to bytes", () => {
    const result = base64UrlDecode("SGVsbG8");
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
  });

  it("handles padding correctly", () => {
    // "Hi" = "SGk" without padding
    const result = base64UrlDecode("SGk");
    expect(Array.from(result)).toEqual([72, 105]);
  });

  it("round-trips with encode", () => {
    const original = new Uint8Array([0, 1, 2, 255, 128, 64]);
    const encoded = base64UrlEncode(original);
    const decoded = base64UrlDecode(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });
});

describe("signPayload", () => {
  it("returns null in the placeholder implementation", () => {
    const identity = generateDeviceIdentity();
    const result = signPayload("test payload", identity);
    expect(result).toBeNull();
  });
});
