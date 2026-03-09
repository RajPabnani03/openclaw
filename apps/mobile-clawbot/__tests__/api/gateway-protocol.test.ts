import { describe, it, expect } from "vitest";
import {
  parseFrame,
  extractConnectNonce,
  buildDeviceAuthPayload,
  buildConnectParams,
} from "../../src/api/gateway-protocol";

describe("parseFrame", () => {
  it("parses a successful response frame", () => {
    const raw = JSON.stringify({
      type: "res",
      id: "abc-123",
      ok: true,
      payload: { data: "hello" },
    });
    const frame = parseFrame(raw);
    expect(frame).toEqual({
      type: "res",
      id: "abc-123",
      ok: true,
      payload: { data: "hello" },
      error: undefined,
    });
  });

  it("parses an error response frame", () => {
    const raw = JSON.stringify({
      type: "res",
      id: "abc-123",
      ok: false,
      error: { code: "FORBIDDEN", message: "Access denied" },
    });
    const frame = parseFrame(raw);
    expect(frame).toEqual({
      type: "res",
      id: "abc-123",
      ok: false,
      payload: undefined,
      error: { code: "FORBIDDEN", message: "Access denied" },
    });
  });

  it("parses an event frame with payload", () => {
    const raw = JSON.stringify({
      type: "event",
      event: "chat",
      payload: { state: "delta", message: {} },
    });
    const frame = parseFrame(raw);
    expect(frame).toEqual({
      type: "event",
      event: "chat",
      payload: { state: "delta", message: {} },
      payloadJSON: undefined,
    });
  });

  it("parses an event frame with payloadJSON", () => {
    const raw = JSON.stringify({
      type: "event",
      event: "health",
      payloadJSON: '{"ok":true}',
    });
    const frame = parseFrame(raw);
    expect(frame).toEqual({
      type: "event",
      event: "health",
      payload: undefined,
      payloadJSON: '{"ok":true}',
    });
  });

  it("returns null for malformed JSON", () => {
    expect(parseFrame("not json")).toBeNull();
  });

  it("returns null for missing type", () => {
    expect(parseFrame(JSON.stringify({ id: "1", ok: true }))).toBeNull();
  });

  it("returns null for unknown type", () => {
    expect(parseFrame(JSON.stringify({ type: "unknown", id: "1" }))).toBeNull();
  });

  it("returns null for response without id", () => {
    expect(parseFrame(JSON.stringify({ type: "res", ok: true }))).toBeNull();
  });

  it("returns null for event without event name", () => {
    expect(parseFrame(JSON.stringify({ type: "event" }))).toBeNull();
  });

  it("returns null for non-object values", () => {
    expect(parseFrame(JSON.stringify("string"))).toBeNull();
    expect(parseFrame(JSON.stringify(42))).toBeNull();
    expect(parseFrame(JSON.stringify(null))).toBeNull();
  });
});

describe("extractConnectNonce", () => {
  it("extracts nonce from object payload", () => {
    const result = extractConnectNonce({ nonce: "abc123" });
    expect(result).toBe("abc123");
  });

  it("extracts nonce from JSON string payload", () => {
    const result = extractConnectNonce('{"nonce":"xyz789"}');
    expect(result).toBe("xyz789");
  });

  it("returns null for missing nonce", () => {
    expect(extractConnectNonce({ other: "value" })).toBeNull();
  });

  it("returns null for empty nonce", () => {
    expect(extractConnectNonce({ nonce: "" })).toBeNull();
  });

  it("trims whitespace from nonce", () => {
    expect(extractConnectNonce({ nonce: "  abc  " })).toBe("abc");
  });

  it("returns null for null payload", () => {
    expect(extractConnectNonce(null)).toBeNull();
  });

  it("returns null for non-JSON string", () => {
    expect(extractConnectNonce("not json")).toBeNull();
  });

  it("returns null for number payload", () => {
    expect(extractConnectNonce(42)).toBeNull();
  });
});

describe("buildDeviceAuthPayload", () => {
  it("builds the correct v2 payload string", () => {
    const result = buildDeviceAuthPayload({
      deviceId: "device-1",
      clientId: "client-1",
      clientMode: "node",
      role: "node",
      scopes: ["chat", "node"],
      signedAtMs: 1700000000000,
      token: "my-token",
      nonce: "nonce-abc",
    });
    expect(result).toBe("v2|device-1|client-1|node|node|chat,node|1700000000000|my-token|nonce-abc");
  });

  it("handles empty token", () => {
    const result = buildDeviceAuthPayload({
      deviceId: "d",
      clientId: "c",
      clientMode: "node",
      role: "node",
      scopes: [],
      signedAtMs: 0,
      nonce: "n",
    });
    expect(result).toBe("v2|d|c|node|node||0||n");
  });

  it("handles single scope", () => {
    const result = buildDeviceAuthPayload({
      deviceId: "d",
      clientId: "c",
      clientMode: "node",
      role: "admin",
      scopes: ["all"],
      signedAtMs: 123,
      token: "t",
      nonce: "n",
    });
    expect(result).toContain("|all|");
  });
});

describe("buildConnectParams", () => {
  it("builds minimal connect params", () => {
    const result = buildConnectParams({
      protocolVersion: 3,
      client: {
        id: "device-1",
        version: "1.0.0",
        platform: "mobile",
        mode: "node",
      },
      role: "node",
      scopes: [],
      caps: [],
      commands: [],
      permissions: {},
      locale: "en-US",
    });

    expect(result.minProtocol).toBe(3);
    expect(result.maxProtocol).toBe(3);
    expect(result.role).toBe("node");
    expect(result.locale).toBe("en-US");
    expect(result.client).toEqual({
      id: "device-1",
      version: "1.0.0",
      platform: "mobile",
      mode: "node",
    });
    expect(result.scopes).toBeUndefined();
    expect(result.auth).toBeUndefined();
    expect(result.device).toBeUndefined();
  });

  it("includes optional fields when provided", () => {
    const result = buildConnectParams({
      protocolVersion: 3,
      client: {
        id: "d",
        version: "1.0",
        platform: "ios",
        mode: "node",
        displayName: "My Phone",
        deviceFamily: "iPhone",
      },
      role: "node",
      scopes: ["chat"],
      caps: ["chat.subscribe"],
      commands: ["status"],
      permissions: { camera: true },
      auth: { token: "abc" },
      device: {
        id: "d",
        publicKey: "pk",
        signature: "sig",
        signedAt: 123,
        nonce: "n",
      },
      locale: "en-US",
      userAgent: "OpenClaw/1.0",
    });

    expect(result.scopes).toEqual(["chat"]);
    expect(result.caps).toEqual(["chat.subscribe"]);
    expect(result.commands).toEqual(["status"]);
    expect(result.permissions).toEqual({ camera: true });
    expect(result.auth).toEqual({ token: "abc" });
    expect(result.device).toEqual({
      id: "d",
      publicKey: "pk",
      signature: "sig",
      signedAt: 123,
      nonce: "n",
    });
    expect(result.userAgent).toBe("OpenClaw/1.0");
  });
});
