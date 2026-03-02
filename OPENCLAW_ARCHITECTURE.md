# OpenClaw — Architecture & Latest Updates

> **Fork:** `RajPabnani03/openclaw` · **Upstream:** `openclaw/openclaw` · **Version:** `2026.2.25` · **License:** MIT  
> Generated: 2026-03-02

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Release State](#2-current-release-state)
3. [Latest Changes (2026.2.25 — Unreleased)](#3-latest-changes-20262025--unreleased)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Source Tree Breakdown](#5-source-tree-breakdown)
6. [Channel Integrations](#6-channel-integrations)
7. [Agent & AI Layer](#7-agent--ai-layer)
8. [Extension System](#8-extension-system)
9. [Native Apps (iOS / macOS / Android)](#9-native-apps-ios--macos--android)
10. [Security Model](#10-security-model)
11. [Open PRs from Fork (PR_STATUS)](#11-open-prs-from-fork-pr_status)
12. [Vision & Priorities](#12-vision--priorities)
13. [Redesign Recommendations](#13-redesign-recommendations)
14. [Next Steps for Moving Forward](#14-next-steps-for-moving-forward)

---

## 1. Project Overview

**OpenClaw** is a self-hosted, multi-channel, personal AI assistant gateway. It runs on your own devices, connects to messaging platforms you already use, and routes every conversation through a pluggable AI agent runtime.

| Attribute | Value |
|-----------|-------|
| Primary language | TypeScript (monorepo via pnpm workspaces) |
| Runtime | Node ≥ 22, Bun (optional) |
| Package manager | `pnpm` |
| Build tool | `tsdown` + custom scripts |
| Deploy targets | macOS (launchd), Linux (systemd), Docker, Fly.io, Render |
| Website | https://openclaw.ai |
| Docs | https://docs.openclaw.ai |

**Evolution:** Warelay → Clawdbot → Moltbot → **OpenClaw** (identifier namespace now `ai.openclaw`)

---

## 2. Current Release State

```
Stable:  2026.2.24   (npm dist-tag: latest)
Beta:    2026.2.25   (npm dist-tag: beta / unreleased)
Dev:     main branch (npm dist-tag: dev)
```

The fork `RajPabnani03/openclaw` tracks upstream `openclaw/openclaw` and has 11 open PRs (all CI-green) targeting upstream.

---

## 3. Latest Changes (2026.2.25 — Unreleased)

### New Features
| Area | Change |
|------|--------|
| **Android / Chat** | Native GFM markdown renderer in chat UI; improved text streaming delivery |
| **Android / Onboarding** | QR scanning promoted to first-class onboarding step |
| **Canvas** | Narrow-screen A2UI layout overrides added |
| **Branding** | All `bot.molt` / `ai.openclaw` identifiers unified across docs, launchd labels, bundle IDs, CLI fixtures |

### Security Fixes
| Area | Detail |
|------|--------|
| Nextcloud Talk | Reject unsigned webhooks *before* full body read; group allowlist isolated from DM pairing store |
| IRC | Pairing-store approvals kept DM-only, out of group allowlist |
| Microsoft Teams | Group allowlist and command auth isolated from DM pairing-store entries |
| LINE | Cap unsigned webhook body reads before auth/signature handling |

### Bug Fixes
| Area | Detail |
|------|--------|
| Agents / Model fallback | Fallback chain traversal hardened; `model_cooldown` errors classified as `rate_limit` |
| Followups / Routing | Same-channel fallback allowed when explicit origin routing fails |
| Telegram / Spoilers | Correct `\|\|spoiler\|\|` pair detection; unmatched `\|\|` left as literal |
| Hooks / Metadata | `guildId` + `channelName` now included in `message_received` for plugin + internal paths |
| Discord / Component auth | Guild component interactions now evaluated through command-gating authorizers |
| Discord / Typing | Stuck typing indicators fixed — keepalive callbacks sealed after idle/cleanup |
| Slack / Media fallback | File-only messages delivered even when all Slack media downloads fail |
| Tests / Low-memory | `vmForks` disabled by default on hosts `<64 GiB RAM`; worker count capped at 4 |

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                            │
│  macOS App  │  iOS App  │  Android App  │  Terminal (TUI/CLI)  │
└──────┬──────┴─────┬─────┴───────┬───────┴───────────┬──────────┘
       │            │             │                   │
       └────────────┴─────────────┴───────────────────┘
                              │ WebSocket / HTTP
                    ┌─────────▼──────────┐
                    │     Gateway         │  ← Node.js server (port 18789)
                    │  src/gateway/       │    Auth, routing, session mgmt
                    └─────────┬──────────┘
          ┌──────────┬────────┴─────────┬──────────────┐
          │          │                  │              │
   ┌──────▼───┐ ┌────▼────┐   ┌────────▼───┐  ┌──────▼──────┐
   │ Channels │ │ Agents  │   │  Plugins /  │  │  WebChat UI │
   │(src/     │ │(src/    │   │  Extensions │  │  (ui/)      │
   │ channels)│ │ agents) │   │(extensions/)│  └─────────────┘
   └──────────┘ └────┬────┘   └─────────────┘
                     │
          ┌──────────▼──────────────┐
          │      AI Providers        │
          │  Anthropic · OpenAI      │
          │  Google · Bedrock        │
          │  Groq · DashScope        │
          │  GitHub Copilot · Qwen   │
          │  + OpenRouter passthrough│
          └─────────────────────────┘
```

**Gateway** is the control plane — it does not hold conversation intelligence itself; it orchestrates the agent runtime, route messages to/from channels, and enforces security policy.

---

## 5. Source Tree Breakdown

```
openclaw/
├── src/                        Core TypeScript source
│   ├── gateway/                HTTP/WS server, auth, boot, canvas, calls
│   ├── agents/                 Agent runtime, session manager, model fallback,
│   │                           memory, tool execution, compaction, pi-embedded-runner
│   ├── channels/               Channel abstraction (registry, ACK, typing, allowlists)
│   │   ├── web/                WebChat channel adapter
│   │   └── telegram/           Telegram-specific channel helpers
│   ├── providers/              AI provider adapters (Copilot, Google, Qwen, etc.)
│   ├── slack/                  Slack integration
│   ├── discord/                Discord integration + voice (DAVE)
│   ├── telegram/               Telegram bot dispatch
│   ├── whatsapp/               WhatsApp integration
│   ├── signal/                 Signal integration
│   ├── imessage/               iMessage integration
│   ├── line/                   LINE integration
│   ├── security/               Exec approval, SSRF policy, sandbox hardening
│   ├── canvas-host/            A2UI canvas renderer (narrow-screen support added in .25)
│   ├── tui/                    Terminal UI (TUI) — model/session selector
│   ├── cli/                    CLI commands + onboarding wizard
│   ├── config/                 Config read/write, validation, schema
│   ├── sessions/               Session store, routing, transcript
│   ├── memory/                 Memory plugin slot + embedding readiness
│   ├── routing/                Followup routing, cross-channel isolation
│   ├── hooks/                  Inbound metadata, message_received events
│   ├── auto-reply/             Auto-reply, heartbeat, cron sessions
│   ├── cron/                   Cron-based scheduled agent runs
│   ├── media/                  Media store, download, cleanup
│   ├── logging/                Subsystem logger (replacing raw console calls)
│   ├── plugins/                Plugin registry + ACP client
│   ├── plugin-sdk/             Public plugin API (npm-distributed)
│   └── web/                    Internal web utilities
│
├── extensions/                 First-party extension packages (each is its own module)
│   ├── discord/                Discord voice, DAVE E2EE
│   ├── slack/                  Slack extended features
│   ├── telegram/               Telegram extended
│   ├── whatsapp/               WhatsApp extended
│   ├── signal/ · matrix/       Signal, Matrix adapters
│   ├── msteams/ · googlechat/  Teams, Google Chat
│   ├── irc/ · mattermost/      IRC, Mattermost
│   ├── bluebubbles/            BlueBubbles (macOS iMessage bridge)
│   ├── zalo/ · zalouser/       Zalo, Zalo Personal
│   ├── line/ · feishu/         LINE, Feishu
│   ├── nostr/ · tlon/          Nostr, Tlon
│   ├── twitch/                 Twitch chat
│   ├── talk-voice/             Voice call abstraction
│   ├── memory-core/            Core memory plugin
│   ├── memory-lancedb/         LanceDB-backed memory
│   ├── diagnostics-otel/       OpenTelemetry export (secrets redacted in .24+)
│   ├── lobster/                Lobster companion integration
│   └── shared/                 Shared extension utilities
│
├── apps/                       Native companion apps
│   ├── android/                Kotlin / Jetpack Compose (AGP 9 as of .25)
│   ├── ios/                    Swift / SwiftUI
│   ├── macos/                  macOS native app (launchd service)
│   └── shared/                 Shared app code
│
├── packages/
│   ├── clawdbot/               Legacy Clawdbot package shim
│   └── moltbot/                Legacy Moltbot package shim
│
├── ui/                         WebChat Control UI (Vite + TypeScript SPA)
│   └── src/ui/                 App components, chat renderer, settings, polling
│
├── skills/                     Bundled skill scripts (ClawHub-first policy)
│   └── coding-agent/ canvas/ github/ discord/ …
│
├── docs/                       Mintlify documentation source
├── scripts/                    Build helpers, plugin SDK entry generation
├── test/ · vitest.*.config.ts  Test infrastructure (unit/e2e/gateway/live/extensions)
├── docker-compose.yml          Docker deployment
├── fly.toml · render.yaml      Cloud deployment configs
└── pnpm-workspace.yaml         Monorepo workspace config
```

---

## 6. Channel Integrations

### Built-in Core Channels
| Channel | Notes |
|---------|-------|
| WhatsApp | Group policy `allowFrom`, direct + group |
| Telegram | Polling + webhook, spoiler fix in .25 |
| Slack | Multi-account, group policy inheritance fixed in .24 |
| Discord | Voice (DAVE E2EE), component auth fixed in .25 |
| Signal | Client error sanitization (PR #5 in fork) |
| iMessage | BlueBubbles bridge, direct integration |
| Microsoft Teams | Group allowlist isolation fixed in .25 |
| Google Chat | Extension-based |
| LINE | Webhook body cap fix in .25 |
| WebChat | Built-in HTTP chat UI |

### Extension Channels
Matrix · IRC · Mattermost · Nextcloud Talk · Feishu · Zalo · Zalo Personal · Nostr · Tlon · Twitch · Synology Chat

---

## 7. Agent & AI Layer

```
src/agents/
├── pi-embedded-runner/      Lightweight in-process agent runner
│   └── session-manager-cache.ts   (LRU eviction added — PR #8 in fork)
├── skills-install-download.ts     (partial file cleanup on failure — PR #10)
├── session-slug.ts                (crypto.randomInt — PR #2 in fork)
└── …
```

### Model Fallback Chain (as of 2026.2.25)
- Configured via `agents.defaults.models` allowlist refs
- `model_cooldown` / `cooling down` → classified as `rate_limit`, triggers failover
- HTTP 502/503/504 → failover-eligible transient timeouts
- Explicit per-run `agentId` preferred over session-key parsing for followup fallback
- `agents.defaults.model.fallbacks` inherited in Overview when no per-agent entry exists

### Supported Providers
Anthropic · OpenAI · Google Gemini · AWS Bedrock · Groq · DashScope/Qwen · GitHub Copilot · OpenRouter (passthrough) · Moonshot/Kimi · ZAI/GLM · Bedrock Nova/Mistral

### Memory
Single active memory plugin slot. Options: `memory-core` (default) · `memory-lancedb`. `openclaw doctor` now probes gateway-side memory embedding readiness directly.

---

## 8. Extension System

Extensions are standalone npm packages loaded at runtime. Key design rules:

- Core stays lean — optional capability → extension
- Extensions published to `clawhub.ai` (ClawHub) first, not added to core by default
- Plugin API via `openclaw/plugin-sdk` (npm-distributed, generated DTS)
- MCP support via `mcporter` bridge (decoupled from core runtime)
- ACP client auto-approval now scoped to trusted core tool IDs + active working directory

---

## 9. Native Apps (iOS / macOS / Android)

| Platform | Stack | Latest Changes (2026.2.25) |
|----------|-------|---------------------------|
| Android | Kotlin / Jetpack Compose, AGP 9 | QR onboarding first-class; five-tab shell (Connect/Chat/Voice/Screen/Settings); GFM chat markdown; streaming fix; canvas webview; TLS gateway URL normalization |
| iOS | Swift / SwiftUI | `ai.openclaw` bundle-ID migration |
| macOS | Swift / launchd | `ai.openclaw` launchd label migration |

Android build commands:
```bash
pnpm android:run     # installs + launches on connected device
pnpm android:test    # unit tests via Gradle
```

---

## 10. Security Model

**Philosophy:** strong defaults, explicit opt-in knobs for high-power workflows. Personal-use assistant trust model — not designed for multi-user shared instances by default.

| Mechanism | Detail |
|-----------|--------|
| Sandbox | `sandbox.mode="all"` for multi-user; Docker network namespace-join blocked by default |
| FS isolation | Tool filesystem access scoped to active working directory |
| Webhook auth | Unsigned body reads capped before auth check (LINE, Nextcloud Talk) |
| Group allowlists | Isolated from DM pairing-store entries across all channels |
| Exec approval | Obfuscated commands detected + require explicit approval |
| ACP | `read` auto-approval scoped to working directory; untrusted `toolCall.kind` ignored |
| Config | Prototype-key traversal blocked; sensitive `env.*` keys redacted in `config.get` |
| OTEL | API keys/tokens redacted from log bodies, attributes, and span fields before export |
| RPC errors | Signal + iMessage client errors sanitized before surface (PR #5 in fork) |
| Session slugs | `crypto.randomInt` for slug generation (PR #2 in fork) |
| ReDoS | User-controlled regex patterns guarded (PR #1 in fork) |

---

## 11. Open PRs from Fork (PR_STATUS)

All 11 PRs target upstream `openclaw/openclaw`. All are CI-green.

| PR | Branch | Change | Status |
|----|--------|--------|--------|
| #23670 | `security/redos-safe-regex` | ReDoS protection for user-controlled regex | CI Pass |
| #23671 | `security/session-slug-crypto-random` | `crypto.randomInt` for session slugs | CI Pass |
| #23672 | `fix/json-parse-crash-guard` | Guard `JSON.parse` of external process output | CI Pass |
| #23669 | `refactor/console-to-subsystem-logger` | Migrate `console.*` to subsystem logger | CI Pass |
| #23724 | `fix/sanitize-rpc-error-messages` | Sanitize RPC errors in Signal + iMessage | CI Pass |
| #23726 | `fix/download-stream-cleanup` | Destroy write streams on download errors | CI Pass |
| #23728 | `fix/telegram-status-reaction-cleanup` | Clear done-reaction when `removeAckAfterReply` | CI Pass |
| #23744 | `fix/session-cache-eviction` | LRU max-size eviction for session manager cache | CI Pass ✓ |
| #23745 | `fix/fetch-missing-timeout` | Timeout for unguarded `fetch` in browser subsystem | CI Pass ✓ |
| #24141 | `fix/skills-download-partial-cleanup` | Cleanup partial file on skill download failure | CI Pass ✓ |
| #24142 | `fix/extension-relay-stop-cleanup` | Flush pending extension timers on relay stop | CI Pass ✓ |

**Files touched by fork PRs** (no overlap):
`src/infra/exec-approval-forwarder.ts` · `src/discord/monitor/exec-approvals.ts` · `src/agents/session-slug.ts` · `src/infra/bonjour-discovery.ts` · `src/infra/outbound/delivery-queue.ts` · `src/infra/tailscale.ts` · `src/node-host/runner.ts` · `src/signal/client.ts` · `src/imessage/client.ts` · `src/media/store.ts` · `src/commands/signal-install.ts` · `src/telegram/bot-message-dispatch.ts` · `src/agents/pi-embedded-runner/session-manager-cache.ts` · `src/cli/nodes-camera.ts` · `src/browser/pw-session.ts` · `src/agents/skills-install-download.ts` · `src/browser/extension-relay.ts`

---

## 12. Vision & Priorities

From `VISION.md`:

**Current focus (in order):**
1. Security and safe defaults
2. Bug fixes and stability
3. Setup reliability and first-run UX

**Next priorities:**
1. Supporting all major model providers
2. Major messaging channel improvements + high-demand additions
3. Performance and test infrastructure
4. Better computer-use and agent harness capabilities
5. Ergonomics across CLI and web frontend
6. Companion apps on macOS, iOS, Android, Windows, and Linux

**What will not be merged:**
- PRs bundling multiple unrelated fixes
- PRs over ~5,000 changed lines (exceptional only)
- Large batches of tiny PRs

---

## 13. Redesign Recommendations

Based on the architecture analysis, here are the areas most ripe for targeted improvement:

### 13.1 Android App (Active area — `.25` focus)
The Android app just received a major UX overhaul (five-tab shell, QR onboarding, GFM markdown). The most impactful next steps:
- **Canvas WebView** — `src/canvas-host/` narrow-screen overrides are new; test edge cases with different Android screen densities
- **Voice tab** — `talk-voice` extension wired; verify Talk/ElevenLabs config metadata surfaces correctly in the new Settings tab
- **Offline/reconnect UX** — `gate canvas restore on node connectivity` logic should be end-to-end tested on flaky networks

### 13.2 Routing & Followup Isolation
The `.24`/`.25` releases contain heavy routing fixes. The current routing code in `src/routing/` is complex:
- Cross-channel reply isolation is now enforced at the gateway planner level
- Session-key-based fallback is still present as a secondary path — this could be simplified
- Recommend auditing `src/routing/` + `src/gateway/` for remaining stale-route-bleed edge cases

### 13.3 Model Fallback Resilience
`src/agents/` fallback chain logic has been patched iteratively. Recommended redesign:
- Centralize all fallback state into a single `FallbackContext` object rather than spreading it across session-key parsing + agent-level overrides + embedded runner preflight
- Add observability hooks (OTEL spans) per fallback hop for debuggability

### 13.4 WebChat UI (`ui/`)
The Control UI is a Vite SPA — it has not received major redesign attention recently. Areas to consider:
- The `app-render.ts` / `app-settings.ts` split is large — could benefit from a component library (e.g., Radix UI + Tailwind)
- Polling (`app-polling.ts`) is still pull-based — a WebSocket-first push model would reduce latency

### 13.5 Extension Discovery & Loading
Currently extensions are loaded by package name. A redesign toward a manifest-based registry (like VS Code extensions) would improve:
- Hot-reload without gateway restart
- Permission declaration per extension
- UI-based extension management in WebChat

### 13.6 Test Infrastructure
The test suite has multiple vitest configs (`unit`, `e2e`, `gateway`, `live`, `extensions`). Consolidate:
- `vmForks` is now conditionally disabled on low-memory hosts — codify a canonical `test:local` command
- Live tests (`vitest.live.config.ts`) require real credentials; add a `--mock` flag path

---

## 14. Next Steps for Moving Forward

### Immediate (this sprint)
- [ ] Rebase fork PRs #23670–#24142 onto latest upstream `main` (upstream has been moving fast in `.25`)
- [ ] Verify `ai.openclaw` identifier migration is complete — check for any remaining `bot.molt` references in the fork
- [ ] Test Android QR onboarding flow end-to-end on a physical device

### Short-term
- [ ] Identify which channel to prioritize next (high-demand additions per VISION: Windows, Linux companion apps)
- [ ] Audit `src/routing/` for any remaining cross-channel bleed paths after `.24`/`.25` fixes
- [ ] Explore Talk/ElevenLabs voice config surfacing in Android Settings tab

### Medium-term
- [ ] WebChat UI redesign — evaluate Radix UI / shadcn/ui for component library
- [ ] Model fallback centralization — `FallbackContext` refactor in `src/agents/`
- [ ] Extension manifest/registry system design
- [ ] Memory plugin convergence — pick a single recommended default path per VISION

### Upstream Contribution
- Monitor PR merge status at `openclaw/openclaw` — all 11 fork PRs are CI-green and awaiting review
- New PRs should follow the one-PR-one-issue rule and stay under 5,000 changed lines
- New skills → ClawHub first (`clawhub.ai`), not core

---

*This document was generated from the live state of `RajPabnani03/openclaw` as of 2026-03-02. Re-run analysis after next upstream sync.*
