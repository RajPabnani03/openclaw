import { v4 as uuidv4 } from "uuid";
import type {
  GatewayEndpoint,
  GatewayConnectOptions,
  InvokeRequest,
  InvokeResult,
  RpcError,
} from "../types/protocol";
import { GATEWAY_PROTOCOL_VERSION } from "../types/protocol";
import {
  parseFrame,
  extractConnectNonce,
  buildDeviceAuthPayload,
  buildConnectParams,
} from "./gateway-protocol";
import type { DeviceIdentity } from "./device-identity";
import { signPayload } from "./device-identity";

/** Pending RPC response waiting for resolution. */
interface PendingRequest {
  resolve: (value: RpcResponse) => void;
  reject: (error: Error) => void;
}

interface RpcResponse {
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: RpcError;
}

export interface GatewaySessionCallbacks {
  onConnected: (serverName?: string, remoteAddress?: string, mainSessionKey?: string) => void;
  onDisconnected: (message: string) => void;
  onEvent: (event: string, payloadJson?: string) => void;
  onInvoke?: (request: InvokeRequest) => Promise<InvokeResult>;
}

interface ConnectionTarget {
  endpoint: GatewayEndpoint;
  token?: string;
  password?: string;
  options: GatewayConnectOptions;
}

/**
 * Manages a WebSocket connection to the OpenClaw gateway.
 * Implements protocol v3 with JSON-RPC request/response and event streaming.
 *
 * Mirrors the Android GatewaySession implementation for protocol compatibility.
 */
export class GatewaySession {
  private callbacks: GatewaySessionCallbacks;
  private identity: DeviceIdentity;
  private storedToken?: string;

  private desired: ConnectionTarget | null = null;
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private connectNonceResolve: ((nonce: string) => void) | null = null;
  private running = false;
  private attempt = 0;
  private canvasHostUrl: string | null = null;
  private mainSessionKey: string | null = null;

  constructor(
    identity: DeviceIdentity,
    callbacks: GatewaySessionCallbacks,
    storedToken?: string,
  ) {
    this.identity = identity;
    this.callbacks = callbacks;
    this.storedToken = storedToken;
  }

  /** Start connecting to the given gateway endpoint. */
  connect(
    endpoint: GatewayEndpoint,
    token?: string,
    password?: string,
    options?: Partial<GatewayConnectOptions>,
  ): void {
    const fullOptions: GatewayConnectOptions = {
      role: "node",
      scopes: ["chat", "node"],
      caps: ["chat.subscribe", "agent.stream"],
      commands: [],
      permissions: { camera: true, location: false },
      client: {
        id: this.identity.deviceId,
        version: "2026.2.25",
        platform: "mobile-clawbot",
        mode: "node",
        deviceFamily: "mobile",
      },
      ...options,
    };

    this.desired = { endpoint, token, password, options: fullOptions };
    if (!this.running) {
      this.running = true;
      this.attempt = 0;
      this.runLoop();
    }
  }

  /** Disconnect from the gateway. */
  disconnect(): void {
    this.desired = null;
    this.running = false;
    this.closeWebSocket();
    this.canvasHostUrl = null;
    this.mainSessionKey = null;
    this.failAllPending();
    this.callbacks.onDisconnected("Offline");
  }

  /** Force a reconnection. */
  reconnect(): void {
    this.closeWebSocket();
  }

  /** Get the current canvas host URL. */
  getCanvasHostUrl(): string | null {
    return this.canvasHostUrl;
  }

  /** Get the current main session key. */
  getMainSessionKey(): string | null {
    return this.mainSessionKey;
  }

  /**
   * Send an RPC request to the gateway and wait for the response.
   * Throws on timeout or gateway error.
   */
  async request(method: string, params?: Record<string, unknown>, timeoutMs = 15_000): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("not connected");
    }

    const id = uuidv4();
    const frame = JSON.stringify({
      type: "req",
      id,
      method,
      ...(params ? { params } : {}),
    });

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("request timeout"));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (res) => {
          clearTimeout(timer);
          this.pending.delete(id);
          if (res.ok) {
            resolve(res.payload);
          } else {
            const err = res.error;
            reject(new Error(`${err?.code ?? "UNAVAILABLE"}: ${err?.message ?? "request failed"}`));
          }
        },
        reject: (err) => {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        },
      });

      this.ws?.send(frame);
    });
  }

  /** Send a node event to the gateway. */
  async sendNodeEvent(event: string, payloadJson?: string): Promise<boolean> {
    try {
      const params: Record<string, unknown> = { event };
      if (payloadJson) {
        try {
          params.payload = JSON.parse(payloadJson);
        } catch {
          params.payloadJSON = payloadJson;
        }
      } else {
        params.payloadJSON = null;
      }
      await this.request("node.event", params, 8_000);
      return true;
    } catch {
      return false;
    }
  }

  // --- Private ---

  private async runLoop(): Promise<void> {
    while (this.running) {
      const target = this.desired;
      if (!target) {
        await sleep(250);
        continue;
      }

      try {
        const statusMsg = this.attempt === 0 ? "Connecting\u2026" : "Reconnecting\u2026";
        this.callbacks.onDisconnected(statusMsg);
        await this.connectOnce(target);
        this.attempt = 0;
      } catch (err) {
        this.attempt += 1;
        const message = err instanceof Error ? err.message : "Connection failed";
        this.callbacks.onDisconnected(`Gateway error: ${message}`);
        const sleepMs = Math.min(8_000, Math.floor(350 * Math.pow(1.7, this.attempt)));
        await sleep(sleepMs);
      }
    }
  }

  private connectOnce(target: ConnectionTarget): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { endpoint } = target;
      const scheme = endpoint.tlsEnabled ? "wss" : "ws";
      const url = `${scheme}://${endpoint.host}:${endpoint.port}`;

      const ws = new WebSocket(url);
      this.ws = ws;

      let connected = false;

      ws.onopen = () => {
        this.waitForConnectNonce()
          .then((nonce) => this.sendConnect(ws, nonce, target))
          .then(() => {
            connected = true;
          })
          .catch((err) => {
            ws.close();
            reject(err);
          });
      };

      ws.onmessage = (ev) => {
        const data = typeof ev.data === "string" ? ev.data : "";
        this.handleMessage(data);
      };

      ws.onerror = () => {
        if (!connected) {
          reject(new Error("WebSocket error"));
        }
      };

      ws.onclose = (ev) => {
        this.failAllPending();
        this.canvasHostUrl = null;
        this.mainSessionKey = null;
        if (connected) {
          this.callbacks.onDisconnected(`Gateway closed: ${ev.reason || "connection lost"}`);
          resolve();
        } else {
          reject(new Error(`Gateway closed: ${ev.reason || "connection refused"}`));
        }
      };
    });
  }

  private waitForConnectNonce(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.connectNonceResolve = null;
        reject(new Error("connect challenge timeout"));
      }, 2_000);

      this.connectNonceResolve = (nonce: string) => {
        clearTimeout(timer);
        this.connectNonceResolve = null;
        resolve(nonce);
      };
    });
  }

  private async sendConnect(
    ws: WebSocket,
    nonce: string,
    target: ConnectionTarget,
  ): Promise<void> {
    const { options, token, password } = target;
    const authToken = this.storedToken || token?.trim() || "";

    const signedAtMs = Date.now();
    const authPayload = buildDeviceAuthPayload({
      deviceId: this.identity.deviceId,
      clientId: options.client.id,
      clientMode: options.client.mode,
      role: options.role,
      scopes: options.scopes,
      signedAtMs,
      token: authToken || undefined,
      nonce,
    });

    const signature = signPayload(authPayload, this.identity);

    const device =
      signature && this.identity.publicKey
        ? {
            id: this.identity.deviceId,
            publicKey: this.identity.publicKey,
            signature,
            signedAt: signedAtMs,
            nonce,
          }
        : undefined;

    const auth = authToken
      ? { token: authToken }
      : password?.trim()
        ? { password: password.trim() }
        : undefined;

    const connectParams = buildConnectParams({
      protocolVersion: GATEWAY_PROTOCOL_VERSION,
      client: options.client,
      role: options.role,
      scopes: options.scopes,
      caps: options.caps,
      commands: options.commands,
      permissions: options.permissions,
      auth,
      device,
      locale: "en-US",
      userAgent: options.userAgent,
    });

    const res = (await this.requestVia(ws, "connect", connectParams, 8_000)) as RpcResponse;
    if (!res.ok) {
      throw new Error(res.error?.message ?? "connect failed");
    }

    this.handleConnectSuccess(res.payload, target);
  }

  private requestVia(
    ws: WebSocket,
    method: string,
    params: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<RpcResponse> {
    const id = uuidv4();
    const frame = JSON.stringify({ type: "req", id, method, params });

    return new Promise<RpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("request timeout"));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (res) => {
          clearTimeout(timer);
          this.pending.delete(id);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        },
      });

      ws.send(frame);
    });
  }

  private handleConnectSuccess(payload: unknown, target: ConnectionTarget): void {
    if (typeof payload !== "object" || payload === null) {
      throw new Error("connect failed: missing payload");
    }

    const obj = payload as Record<string, unknown>;
    const server = obj.server as Record<string, unknown> | undefined;
    const serverName = typeof server?.host === "string" ? server.host : undefined;
    const authObj = obj.auth as Record<string, unknown> | undefined;
    const deviceToken = typeof authObj?.deviceToken === "string" ? authObj.deviceToken : undefined;

    if (deviceToken) {
      this.storedToken = deviceToken;
    }

    const rawCanvas = typeof obj.canvasHostUrl === "string" ? obj.canvasHostUrl : undefined;
    this.canvasHostUrl = rawCanvas ?? null;

    const snapshot = obj.snapshot as Record<string, unknown> | undefined;
    const sessionDefaults = snapshot?.sessionDefaults as Record<string, unknown> | undefined;
    this.mainSessionKey =
      typeof sessionDefaults?.mainSessionKey === "string" ? sessionDefaults.mainSessionKey : null;

    const remoteAddress = `${target.endpoint.host}:${target.endpoint.port}`;
    this.callbacks.onConnected(serverName, remoteAddress, this.mainSessionKey ?? undefined);
  }

  private handleMessage(text: string): void {
    const frame = parseFrame(text);
    if (!frame) return;

    switch (frame.type) {
      case "res": {
        const waiter = this.pending.get(frame.id);
        if (waiter) {
          this.pending.delete(frame.id);
          waiter.resolve({
            id: frame.id,
            ok: frame.ok,
            payload: frame.payload,
            error: frame.error,
          });
        }
        break;
      }
      case "event": {
        if (frame.event === "connect.challenge") {
          const nonce = extractConnectNonce(frame.payload ?? frame.payloadJSON);
          if (nonce && this.connectNonceResolve) {
            this.connectNonceResolve(nonce);
          }
          return;
        }

        if (frame.event === "node.invoke.request" && this.callbacks.onInvoke) {
          this.handleInvokeEvent(frame.payload ?? frame.payloadJSON);
          return;
        }

        const payloadJson =
          frame.payload !== undefined
            ? JSON.stringify(frame.payload)
            : frame.payloadJSON;
        this.callbacks.onEvent(frame.event, payloadJson);
        break;
      }
    }
  }

  private async handleInvokeEvent(payload: unknown): Promise<void> {
    if (!this.callbacks.onInvoke) return;

    let obj: Record<string, unknown>;
    if (typeof payload === "string") {
      try {
        obj = JSON.parse(payload);
      } catch {
        return;
      }
    } else if (typeof payload === "object" && payload !== null) {
      obj = payload as Record<string, unknown>;
    } else {
      return;
    }

    const id = typeof obj.id === "string" ? obj.id : null;
    const nodeId = typeof obj.nodeId === "string" ? obj.nodeId : null;
    const command = typeof obj.command === "string" ? obj.command : null;
    if (!id || !nodeId || !command) return;

    const params =
      typeof obj.paramsJSON === "string"
        ? obj.paramsJSON
        : obj.params !== undefined && obj.params !== null
          ? JSON.stringify(obj.params)
          : undefined;
    const timeoutMs = typeof obj.timeoutMs === "number" ? obj.timeoutMs : undefined;

    let result: InvokeResult;
    try {
      result = await this.callbacks.onInvoke({ id, nodeId, command, paramsJson: params, timeoutMs });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "invoke failed";
      result = { ok: false, error: { code: "UNAVAILABLE", message: msg } };
    }

    await this.sendInvokeResult(id, nodeId, result);
  }

  private async sendInvokeResult(id: string, nodeId: string, result: InvokeResult): Promise<void> {
    const params: Record<string, unknown> = {
      id,
      nodeId,
      ok: result.ok,
    };

    if (result.payloadJson) {
      try {
        params.payload = JSON.parse(result.payloadJson);
      } catch {
        params.payloadJSON = result.payloadJson;
      }
    }

    if (result.error) {
      params.error = { code: result.error.code, message: result.error.message };
    }

    try {
      await this.request("node.invoke.result", params);
    } catch {
      // best-effort
    }
  }

  private closeWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.close(1000, "bye");
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private failAllPending(): void {
    for (const [, waiter] of this.pending) {
      waiter.reject(new Error("connection closed"));
    }
    this.pending.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
