# Mobile Clawbot App Architecture

## Overview

The Mobile Clawbot App is a cross-platform React Native application that connects
to the OpenClaw gateway to provide AI-powered chat, voice interaction, and device
capability invocation from mobile devices.

## Architecture Diagram

```
+------------------------------------------------------------------+
|                     Mobile Clawbot App                            |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+  |
|  |   Screens        |  |   Components     |  |   Navigation    |  |
|  |  - Chat          |  |  - ChatBubble    |  |  - TabNavigator |  |
|  |  - Connect       |  |  - ChatComposer  |  |  - RootStack    |  |
|  |  - Settings      |  |  - GatewayCard   |  |  - Onboarding   |  |
|  |  - Onboarding    |  |  - StatusPill    |  +-----------------+  |
|  |  - Voice         |  |  - ToolCallCard  |                      |
|  |  - Canvas        |  |  - MarkdownView  |                      |
|  +--------+---------+  +--------+---------+                      |
|           |                      |                                |
|  +--------v----------------------v---------+                      |
|  |              State Store                |                      |
|  |  - connectionStore (Zustand)            |                      |
|  |  - chatStore                            |                      |
|  |  - settingsStore                        |                      |
|  +--------+--------------------------------+                      |
|           |                                                       |
|  +--------v--------------------------------+                      |
|  |           Service Layer                 |                      |
|  |  - GatewaySession (WebSocket RPC)       |                      |
|  |  - GatewayDiscovery (mDNS/Bonjour)      |                      |
|  |  - ChatController                       |                      |
|  |  - VoiceService                         |                      |
|  |  - MediaCaptureService                  |                      |
|  |  - SecureStorageService                 |                      |
|  +--------+--------------------------------+                      |
|           |                                                       |
|  +--------v--------------------------------+                      |
|  |         Protocol Layer                  |                      |
|  |  - WebSocket JSON-RPC (protocol v3)     |                      |
|  |  - Challenge-response auth              |                      |
|  |  - Device identity (Ed25519 keypair)    |                      |
|  |  - TLS certificate pinning              |                      |
|  +--------+--------------------------------+                      |
|           |                                                       |
+-----------v-------------------------------------------------------+
            |
   +--------v--------+
   | OpenClaw Gateway |
   | (WebSocket API)  |
   +-----------------+
```

## Key Design Decisions

### 1. Protocol Compatibility
- Implements Gateway Protocol v3 (same as native iOS/Android apps)
- JSON-RPC over WebSocket with req/res/event frame types
- Challenge-response authentication with device identity keypair
- Compatible with existing gateway without modifications

### 2. State Management
- Zustand for lightweight reactive state
- Separate stores for connection, chat, and settings concerns
- StateFlow-equivalent pattern using Zustand subscriptions

### 3. Navigation
- Tab-based navigation (Chat, Voice, Canvas, Settings)
- Stack navigator for onboarding flow
- Deep link support via `openclaw://` scheme

### 4. Chat Architecture
- Mirrors the Android ChatController pattern
- Optimistic message insertion for responsiveness
- Streaming assistant text via gateway events
- Tool call tracking with pending state
- Session management (list, switch, create)

### 5. Gateway Discovery
- mDNS/Bonjour service browsing for `_openclaw-gw._tcp`
- Manual endpoint configuration fallback
- QR code scanning for quick gateway setup
- TLS fingerprint verification

### 6. Security
- Device identity stored in platform secure storage
- Ed25519 keypair for device authentication signatures
- Token-based auth with device token persistence
- TLS certificate pinning support

## Module Breakdown

### `/src/api/` - Protocol Layer
- `gateway-session.ts` - WebSocket connection, RPC, event handling
- `gateway-protocol.ts` - Frame types, protocol constants
- `device-identity.ts` - Ed25519 keypair generation and signing

### `/src/services/` - Service Layer
- `chat-controller.ts` - Chat state machine (send, stream, abort)
- `gateway-discovery.ts` - mDNS/Bonjour gateway browsing
- `voice-service.ts` - Voice wake and talk mode
- `media-service.ts` - Camera/photo capture for attachments
- `secure-storage.ts` - Keychain/Keystore credential storage

### `/src/store/` - State Management
- `connection-store.ts` - Gateway connection state
- `chat-store.ts` - Messages, sessions, streaming state
- `settings-store.ts` - User preferences, gateway config

### `/src/screens/` - Screen Components
- `ChatScreen.tsx` - Main chat interface
- `ConnectScreen.tsx` - Gateway discovery and connection
- `SettingsScreen.tsx` - App and gateway settings
- `OnboardingScreen.tsx` - First-run setup wizard
- `VoiceScreen.tsx` - Voice interaction orb
- `CanvasScreen.tsx` - A2UI canvas WebView

### `/src/components/` - Reusable UI
- `ChatBubble.tsx` - Message bubble with markdown rendering
- `ChatComposer.tsx` - Text input with attachment support
- `GatewayCard.tsx` - Discovered gateway list item
- `StatusPill.tsx` - Connection status indicator
- `ToolCallCard.tsx` - Active tool call display
- `MarkdownView.tsx` - Markdown-to-native renderer
- `TalkOrb.tsx` - Voice interaction orb animation

### `/src/theme/` - Design System
- `colors.ts` - Color palette (light/dark)
- `typography.ts` - Font styles
- `spacing.ts` - Layout constants

## Testing Strategy

- Unit tests for protocol layer (frame parsing, auth flow)
- Unit tests for service layer (chat controller state machine)
- Component tests for UI components (snapshot + interaction)
- Integration tests for gateway connection flow
- All tests use Vitest + React Native Testing Library
