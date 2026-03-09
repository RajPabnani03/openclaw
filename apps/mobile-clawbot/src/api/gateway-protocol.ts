import type { Frame, ResponseFrame, EventFrame } from "../types/protocol";

/**
 * Parse a raw WebSocket text frame into a typed Frame object.
 * Returns null if the frame is malformed.
 */
export function parseFrame(raw: string): Frame | null {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null) return null;

    switch (obj.type) {
      case "res":
        return parseResponseFrame(obj);
      case "event":
        return parseEventFrame(obj);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function parseResponseFrame(obj: Record<string, unknown>): ResponseFrame | null {
  const id = typeof obj.id === "string" ? obj.id : null;
  if (!id) return null;

  return {
    type: "res",
    id,
    ok: obj.ok === true,
    payload: obj.payload,
    error: parseRpcError(obj.error),
  };
}

function parseEventFrame(obj: Record<string, unknown>): EventFrame | null {
  const event = typeof obj.event === "string" ? obj.event : null;
  if (!event) return null;

  return {
    type: "event",
    event,
    payload: obj.payload,
    payloadJSON: typeof obj.payloadJSON === "string" ? obj.payloadJSON : undefined,
  };
}

function parseRpcError(raw: unknown): { code: string; message: string } | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  return {
    code: typeof obj.code === "string" ? obj.code : "UNAVAILABLE",
    message: typeof obj.message === "string" ? obj.message : "request failed",
  };
}

/**
 * Build the connect.challenge nonce from an event payload.
 */
export function extractConnectNonce(payload: unknown): string | null {
  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.nonce === "string") return obj.nonce.trim() || null;
  }
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed === "object" && parsed !== null && typeof parsed.nonce === "string") {
        return parsed.nonce.trim() || null;
      }
    } catch {
      // not JSON
    }
  }
  return null;
}

/**
 * Build the signed device auth payload string for connect handshake.
 */
export function buildDeviceAuthPayload(opts: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string;
  nonce: string;
}): string {
  return [
    "v2",
    opts.deviceId,
    opts.clientId,
    opts.clientMode,
    opts.role,
    opts.scopes.join(","),
    String(opts.signedAtMs),
    opts.token ?? "",
    opts.nonce,
  ].join("|");
}

/**
 * Build the full connect params object for the gateway handshake.
 */
export function buildConnectParams(opts: {
  protocolVersion: number;
  client: {
    id: string;
    displayName?: string;
    version: string;
    platform: string;
    mode: string;
    instanceId?: string;
    deviceFamily?: string;
    modelIdentifier?: string;
  };
  role: string;
  scopes: string[];
  caps: string[];
  commands: string[];
  permissions: Record<string, boolean>;
  auth?: { token?: string; password?: string };
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
  locale: string;
  userAgent?: string;
}): Record<string, unknown> {
  const params: Record<string, unknown> = {
    minProtocol: opts.protocolVersion,
    maxProtocol: opts.protocolVersion,
    client: opts.client,
    role: opts.role,
    locale: opts.locale,
  };

  if (opts.scopes.length > 0) params.scopes = opts.scopes;
  if (opts.caps.length > 0) params.caps = opts.caps;
  if (opts.commands.length > 0) params.commands = opts.commands;
  if (Object.keys(opts.permissions).length > 0) params.permissions = opts.permissions;
  if (opts.auth) params.auth = opts.auth;
  if (opts.device) params.device = opts.device;
  if (opts.userAgent) params.userAgent = opts.userAgent;

  return params;
}
