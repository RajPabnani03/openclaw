import { describe, it, expect, vi, beforeEach } from "vitest";
import { GatewayDiscoveryService } from "../../src/services/gateway-discovery";

describe("GatewayDiscoveryService", () => {
  let discovery: GatewayDiscoveryService;

  beforeEach(() => {
    discovery = new GatewayDiscoveryService();
  });

  describe("addManualEndpoint", () => {
    it("adds a manual endpoint and returns it", () => {
      const ep = discovery.addManualEndpoint("192.168.1.100", 18789);
      expect(ep.host).toBe("192.168.1.100");
      expect(ep.port).toBe(18789);
      expect(ep.stableId).toBe("manual|192.168.1.100|18789");
      expect(ep.name).toBe("192.168.1.100:18789");
      expect(ep.tlsEnabled).toBe(false);
    });

    it("appears in getGateways", () => {
      discovery.addManualEndpoint("host1", 1000);
      const gateways = discovery.getGateways();
      expect(gateways).toHaveLength(1);
      expect(gateways[0].host).toBe("host1");
    });

    it("notifies subscribers", () => {
      const listener = vi.fn();
      discovery.subscribe(listener);
      listener.mockClear();

      discovery.addManualEndpoint("host2", 2000);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ host: "host2" })]),
      );
    });

    it("normalizes host to lowercase in stableId", () => {
      const ep = discovery.addManualEndpoint("MyHost.Local", 8080);
      expect(ep.stableId).toBe("manual|myhost.local|8080");
    });
  });

  describe("removeEndpoint", () => {
    it("removes an endpoint by stableId", () => {
      const ep = discovery.addManualEndpoint("host", 1000);
      expect(discovery.getGateways()).toHaveLength(1);
      discovery.removeEndpoint(ep.stableId);
      expect(discovery.getGateways()).toHaveLength(0);
    });

    it("does nothing for unknown stableId", () => {
      discovery.addManualEndpoint("host", 1000);
      discovery.removeEndpoint("nonexistent");
      expect(discovery.getGateways()).toHaveLength(1);
    });

    it("notifies subscribers on removal", () => {
      const ep = discovery.addManualEndpoint("host", 1000);
      const listener = vi.fn();
      discovery.subscribe(listener);
      listener.mockClear();

      discovery.removeEndpoint(ep.stableId);
      expect(listener).toHaveBeenCalledWith([]);
    });
  });

  describe("subscribe", () => {
    it("calls listener immediately with current list", () => {
      discovery.addManualEndpoint("host", 1000);
      const listener = vi.fn();
      discovery.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toHaveLength(1);
    });

    it("returns unsubscribe function", () => {
      const listener = vi.fn();
      const unsub = discovery.subscribe(listener);
      listener.mockClear();
      unsub();
      discovery.addManualEndpoint("host", 1000);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("onServiceResolved", () => {
    it("adds a discovered endpoint", () => {
      discovery.onServiceResolved("my-gateway", "10.0.0.1", 18789, {
        displayName: "Home Gateway",
        lanHost: "gateway.local",
        gatewayTls: "1",
      });

      const gateways = discovery.getGateways();
      expect(gateways).toHaveLength(1);
      expect(gateways[0].name).toBe("Home Gateway");
      expect(gateways[0].host).toBe("10.0.0.1");
      expect(gateways[0].port).toBe(18789);
      expect(gateways[0].lanHost).toBe("gateway.local");
      expect(gateways[0].tlsEnabled).toBe(true);
    });

    it("uses service name as display name fallback", () => {
      discovery.onServiceResolved("fallback-name", "1.2.3.4", 80, {});
      const gateways = discovery.getGateways();
      expect(gateways[0].name).toBe("fallback-name");
    });

    it("parses numeric TXT values", () => {
      discovery.onServiceResolved("gw", "1.2.3.4", 80, {
        gatewayPort: "18789",
        canvasPort: "18790",
      });
      const gateways = discovery.getGateways();
      expect(gateways[0].gatewayPort).toBe(18789);
      expect(gateways[0].canvasPort).toBe(18790);
    });
  });

  describe("onServiceLost", () => {
    it("removes a discovered endpoint", () => {
      discovery.onServiceResolved("my-gw", "1.2.3.4", 80, {});
      expect(discovery.getGateways()).toHaveLength(1);
      discovery.onServiceLost("my-gw");
      expect(discovery.getGateways()).toHaveLength(0);
    });
  });

  describe("sorting", () => {
    it("sorts gateways alphabetically by name", () => {
      discovery.addManualEndpoint("zebra", 1);
      discovery.addManualEndpoint("alpha", 2);
      discovery.addManualEndpoint("middle", 3);
      const names = discovery.getGateways().map((g) => g.name);
      expect(names).toEqual(["alpha:2", "middle:3", "zebra:1"]);
    });
  });
});
