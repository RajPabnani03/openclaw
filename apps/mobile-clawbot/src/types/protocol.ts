/** Gateway protocol version matching native iOS/Android apps. */
export const GATEWAY_PROTOCOL_VERSION = 3;

/** WebSocket JSON-RPC frame types. */
export type FrameType = "req" | "res" | "event";

/** Outgoing request frame. */
export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

/** Incoming response frame. */
export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: RpcError;
}

/** Incoming event frame. */
export interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
  payloadJSON?: string;
}

export type Frame = RequestFrame | ResponseFrame | EventFrame;

export interface RpcError {
  code: string;
  message: string;
}

/** Client info sent during the connect handshake. */
export interface GatewayClientInfo {
  id: string;
  displayName?: string;
  version: string;
  platform: string;
  mode: string;
  instanceId?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
}

/** Options for connecting to the gateway. */
export interface GatewayConnectOptions {
  role: string;
  scopes: string[];
  caps: string[];
  commands: string[];
  permissions: Record<string, boolean>;
  client: GatewayClientInfo;
  userAgent?: string;
}

/** A discovered or manually configured gateway endpoint. */
export interface GatewayEndpoint {
  stableId: string;
  name: string;
  host: string;
  port: number;
  lanHost?: string;
  tailnetDns?: string;
  gatewayPort?: number;
  canvasPort?: number;
  tlsEnabled: boolean;
  tlsFingerprintSha256?: string;
}

/** Node invoke request from the gateway. */
export interface InvokeRequest {
  id: string;
  nodeId: string;
  command: string;
  paramsJson?: string;
  timeoutMs?: number;
}

/** Node invoke result sent back to the gateway. */
export interface InvokeResult {
  ok: boolean;
  payloadJson?: string;
  error?: RpcError;
}
