import { create } from "zustand";
import type { GatewayEndpoint } from "../types/protocol";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface ConnectionState {
  status: ConnectionStatus;
  statusMessage: string;
  endpoint: GatewayEndpoint | null;
  serverName?: string;
  remoteAddress?: string;
  discoveredGateways: GatewayEndpoint[];

  setStatus: (status: ConnectionStatus, message?: string) => void;
  setEndpoint: (endpoint: GatewayEndpoint | null) => void;
  setConnected: (serverName?: string, remoteAddress?: string) => void;
  setDisconnected: (message: string) => void;
  setDiscoveredGateways: (gateways: GatewayEndpoint[]) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "disconnected",
  statusMessage: "Not connected",
  endpoint: null,
  discoveredGateways: [],

  setStatus: (status, message) =>
    set({
      status,
      statusMessage: message ?? (status === "connected" ? "Connected" : "Not connected"),
    }),

  setEndpoint: (endpoint) => set({ endpoint }),

  setConnected: (serverName, remoteAddress) =>
    set({
      status: "connected",
      statusMessage: serverName ? `Connected to ${serverName}` : "Connected",
      serverName,
      remoteAddress,
    }),

  setDisconnected: (message) =>
    set({
      status: message.includes("Connecting") || message.includes("Reconnecting")
        ? "connecting"
        : "disconnected",
      statusMessage: message,
      serverName: undefined,
      remoteAddress: undefined,
    }),

  setDiscoveredGateways: (gateways) => set({ discoveredGateways: gateways }),
}));
