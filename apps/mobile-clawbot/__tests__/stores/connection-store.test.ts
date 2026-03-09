import { describe, it, expect, beforeEach } from "vitest";
import { useConnectionStore } from "../../src/store/connection-store";

describe("connectionStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useConnectionStore.setState({
      status: "disconnected",
      statusMessage: "Not connected",
      endpoint: null,
      discoveredGateways: [],
      serverName: undefined,
      remoteAddress: undefined,
    });
  });

  it("starts disconnected", () => {
    const state = useConnectionStore.getState();
    expect(state.status).toBe("disconnected");
    expect(state.statusMessage).toBe("Not connected");
    expect(state.endpoint).toBeNull();
  });

  describe("setConnected", () => {
    it("sets connected status", () => {
      useConnectionStore.getState().setConnected("my-server", "1.2.3.4:18789");
      const state = useConnectionStore.getState();
      expect(state.status).toBe("connected");
      expect(state.serverName).toBe("my-server");
      expect(state.remoteAddress).toBe("1.2.3.4:18789");
      expect(state.statusMessage).toBe("Connected to my-server");
    });

    it("uses generic message without server name", () => {
      useConnectionStore.getState().setConnected();
      expect(useConnectionStore.getState().statusMessage).toBe("Connected");
    });
  });

  describe("setDisconnected", () => {
    it("sets disconnected status", () => {
      useConnectionStore.getState().setDisconnected("Connection lost");
      const state = useConnectionStore.getState();
      expect(state.status).toBe("disconnected");
      expect(state.statusMessage).toBe("Connection lost");
      expect(state.serverName).toBeUndefined();
    });

    it("detects connecting status from message", () => {
      useConnectionStore.getState().setDisconnected("Connecting\u2026");
      expect(useConnectionStore.getState().status).toBe("connecting");
    });

    it("detects reconnecting status from message", () => {
      useConnectionStore.getState().setDisconnected("Reconnecting\u2026");
      expect(useConnectionStore.getState().status).toBe("connecting");
    });
  });

  describe("setEndpoint", () => {
    it("sets the endpoint", () => {
      const ep = { stableId: "test", name: "Test", host: "1.2.3.4", port: 80, tlsEnabled: false };
      useConnectionStore.getState().setEndpoint(ep);
      expect(useConnectionStore.getState().endpoint).toEqual(ep);
    });

    it("clears the endpoint", () => {
      useConnectionStore.getState().setEndpoint(null);
      expect(useConnectionStore.getState().endpoint).toBeNull();
    });
  });

  describe("setDiscoveredGateways", () => {
    it("sets the gateway list", () => {
      const gateways = [
        { stableId: "a", name: "A", host: "1.1.1.1", port: 80, tlsEnabled: false },
        { stableId: "b", name: "B", host: "2.2.2.2", port: 80, tlsEnabled: true },
      ];
      useConnectionStore.getState().setDiscoveredGateways(gateways);
      expect(useConnectionStore.getState().discoveredGateways).toHaveLength(2);
    });
  });
});
