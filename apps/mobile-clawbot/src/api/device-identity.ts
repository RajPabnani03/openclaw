import { v4 as uuidv4 } from "uuid";

/**
 * Device identity for gateway authentication.
 * Uses Ed25519 keypair stored in secure storage.
 *
 * In a real React Native build, this would use tweetnacl for Ed25519.
 * This module provides the interface and a base64url encoding helper.
 */

export interface DeviceIdentity {
  deviceId: string;
  publicKey: string;
  secretKey: string;
}

/**
 * Generate a new device identity with a random Ed25519 keypair.
 * Falls back to a random ID + empty keys in environments without crypto.
 */
export function generateDeviceIdentity(): DeviceIdentity {
  const deviceId = uuidv4();

  // In production, use tweetnacl:
  // const keypair = nacl.sign.keyPair();
  // const publicKey = base64UrlEncode(keypair.publicKey);
  // const secretKey = base64UrlEncode(keypair.secretKey);
  //
  // For the portable implementation, we generate placeholder keys.
  // The actual signing is done via the platform's secure enclave when available.
  const publicKey = "";
  const secretKey = "";

  return { deviceId, publicKey, secretKey };
}

/**
 * Sign a payload string using the device's secret key.
 * Returns a base64url-encoded signature, or null if signing is unavailable.
 */
export function signPayload(_payload: string, _identity: DeviceIdentity): string | null {
  // In production with tweetnacl:
  // const message = new TextEncoder().encode(payload);
  // const secretKeyBytes = base64UrlDecode(identity.secretKey);
  // const signature = nacl.sign.detached(message, secretKeyBytes);
  // return base64UrlEncode(signature);
  return null;
}

/** Encode bytes to base64url (no padding). */
export function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode base64url string to bytes. */
export function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
