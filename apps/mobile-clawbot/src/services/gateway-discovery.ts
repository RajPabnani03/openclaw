import type { GatewayEndpoint } from "../types/protocol";

export type DiscoveryListener = (gateways: GatewayEndpoint[]) => void;

/**
 * Discovers OpenClaw gateways on the local network via mDNS/Bonjour.
 * Uses the `_openclaw-gw._tcp` service type.
 *
 * In a real React Native build, this uses react-native-zeroconf.
 * This module provides the interface and manual endpoint support.
 */
export class GatewayDiscoveryService {
  private listeners = new Set<DiscoveryListener>();
  private gateways = new Map<string, GatewayEndpoint>();
  private scanning = false;

  /** Subscribe to gateway list changes. Returns unsubscribe function. */
  subscribe(listener: DiscoveryListener): () => void {
    this.listeners.add(listener);
    listener([...this.gateways.values()]);
    return () => this.listeners.delete(listener);
  }

  /** Start scanning for gateways on the local network. */
  startScan(): void {
    if (this.scanning) return;
    this.scanning = true;

    // In production, initialize react-native-zeroconf:
    // const zeroconf = new Zeroconf();
    // zeroconf.scan('openclaw-gw', 'tcp', 'local.');
    // zeroconf.on('resolved', (service) => { ... });
    // zeroconf.on('remove', (name) => { ... });
  }

  /** Stop scanning. */
  stopScan(): void {
    this.scanning = false;
    // zeroconf.stop();
  }

  /** Add a manually configured gateway endpoint. */
  addManualEndpoint(host: string, port: number): GatewayEndpoint {
    const endpoint: GatewayEndpoint = {
      stableId: `manual|${host.toLowerCase()}|${port}`,
      name: `${host}:${port}`,
      host,
      port,
      tlsEnabled: false,
    };
    this.gateways.set(endpoint.stableId, endpoint);
    this.publish();
    return endpoint;
  }

  /** Remove a gateway endpoint by stable ID. */
  removeEndpoint(stableId: string): void {
    this.gateways.delete(stableId);
    this.publish();
  }

  /** Get the current list of discovered gateways. */
  getGateways(): GatewayEndpoint[] {
    return [...this.gateways.values()].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }

  /** Called by the mDNS layer when a service is resolved. */
  onServiceResolved(
    serviceName: string,
    host: string,
    port: number,
    txtRecord: Record<string, string>,
  ): void {
    const displayName = txtRecord.displayName || serviceName;
    const stableId = `_openclaw-gw._tcp.|local.|${serviceName}`;

    const endpoint: GatewayEndpoint = {
      stableId,
      name: displayName,
      host,
      port,
      lanHost: txtRecord.lanHost,
      tailnetDns: txtRecord.tailnetDns,
      gatewayPort: txtRecord.gatewayPort ? parseInt(txtRecord.gatewayPort, 10) : undefined,
      canvasPort: txtRecord.canvasPort ? parseInt(txtRecord.canvasPort, 10) : undefined,
      tlsEnabled: txtRecord.gatewayTls === "1" || txtRecord.gatewayTls === "true",
      tlsFingerprintSha256: txtRecord.gatewayTlsSha256,
    };

    this.gateways.set(stableId, endpoint);
    this.publish();
  }

  /** Called by the mDNS layer when a service is lost. */
  onServiceLost(serviceName: string): void {
    const stableId = `_openclaw-gw._tcp.|local.|${serviceName}`;
    this.gateways.delete(stableId);
    this.publish();
  }

  private publish(): void {
    const list = this.getGateways();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}
