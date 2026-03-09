export type {
  Frame,
  RequestFrame,
  ResponseFrame,
  EventFrame,
  RpcError,
  GatewayClientInfo,
  GatewayConnectOptions,
  GatewayEndpoint,
  InvokeRequest,
  InvokeResult,
} from "./protocol";

export { GATEWAY_PROTOCOL_VERSION } from "./protocol";

export type {
  ChatMessage,
  ChatMessageContent,
  ChatPendingToolCall,
  ChatSessionEntry,
  ChatHistory,
  OutgoingAttachment,
  ThinkingLevel,
} from "./chat";
