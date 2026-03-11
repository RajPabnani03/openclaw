# Test Coverage Analysis

_Generated: 2026-03-11_

## Overview

This analysis identifies areas where OpenClaw's test coverage can be improved. The codebase enforces **70% line/function/statement and 55% branch** coverage thresholds via V8/Vitest, but many directories are excluded from those thresholds. The recommendations below focus on files that are **counted toward coverage thresholds** but lack tests, as well as high-value excluded areas worth investing in.

---

## Priority 1: Security (Critical)

The `src/security/` directory contains security-critical logic with significant gaps.

### `src/security/audit-channel.ts` (~654 lines, 0 tests)

Performs comprehensive security audits on channel configurations — DM policies, allowlists, slash command access, and dangerous name-based sender matching. Complex branching logic across Discord, Slack, Telegram, and other platforms.

**Recommended tests:**
- `collectChannelSecurityFindings()` with various channel configs (open DM, disabled DM, allowlisted DM)
- `classifyChannelWarningSeverity()` for each severity tier
- Discord name-based allowlist detection (`isDiscordMutableAllowEntry()`)
- Telegram numeric ID validation
- Multi-guild/channel access control rules
- Edge cases: empty configs, partial configs, unknown channel types

### `src/security/mutable-allowlist-detectors.ts` (~102 lines, 0 tests)

Detects sender allowlist entries relying on mutable identities (usernames, display names) vs. stable IDs. Covers 6 platforms with platform-specific ID format rules.

**Recommended tests:**
- `isDiscordMutableAllowEntry()` — mentions `<@!ID>` vs username-based entries
- `isSlackMutableAllowEntry()` — `<@USERID>` prefix/ID format
- `isGoogleChatMutableAllowEntry()` — email vs user ID
- `isMSTeamsMutableAllowEntry()` — Teams stability checks
- `isMattermostMutableAllowEntry()` — 26-char stable IDs vs usernames
- `isIrcMutableAllowEntry()` — IRC user format

### `src/security/audit-fs.ts` (~207 lines, 0 tests)

Filesystem permission inspection: detects world-writable/group-writable directories and files, handles symlink resolution and platform differences (POSIX vs Windows ACL).

**Recommended tests:**
- `modeBits()`, `isWorldWritable()`, `isGroupWritable()` — bit manipulation helpers
- `inspectPathPermissions()` with mocked `fs.stat` for various permission modes
- Symlink resolution behavior
- Error handling (ENOENT, EACCES)

### `src/security/dangerous-tools.ts` & `dangerous-config-flags.ts` (quick wins)

Small files defining security-critical sets/lists. Easy to test, high stakes if they regress.

**Recommended tests:**
- Membership assertions for `DEFAULT_GATEWAY_HTTP_TOOL_DENY` and `DANGEROUS_ACP_TOOL_NAMES`
- `collectEnabledInsecureOrDangerousFlags()` with various config combinations

---

## Priority 2: Memory & Embedding System (High)

The `src/memory/` directory has good test coverage overall, but several critical utility files that handle text splitting and model limits are untested.

### `src/memory/embedding-input-limits.ts` (~68 lines, 0 tests)

UTF-8 byte-length estimation and text splitting for embedding model input constraints. Uses binary search with UTF-8 boundary awareness.

**Recommended tests:**
- ASCII text splitting at exact byte limits
- Multi-byte UTF-8 (emoji, CJK characters) — no mid-character splits
- Surrogate pair boundary handling
- Edge cases: zero/negative limits, empty text, text shorter than limit

### `src/memory/embedding-chunk-limits.ts` (~36 lines, 0 tests)

Enforces max input token limits on memory chunks by splitting oversized chunks.

**Recommended tests:**
- Chunks under limit pass through unchanged
- Oversized chunks split correctly
- Line number metadata preserved
- Hash recalculated for split chunks

### `src/memory/embedding-model-limits.ts` (~40 lines, 0 tests)

Resolves max input token limits for embedding models with provider-specific overrides and fallbacks.

**Recommended tests:**
- Known models return correct limits (OpenAI 8192, Gemini 2048, Voyage 32000)
- Unknown models use provider-specific defaults
- Local embeddings default to conservative 2048

---

## Priority 3: Routing & Session Management (High)

### `src/routing/bindings.ts` (~114 lines, 0 tests)

Core routing logic: resolves agent-to-channel-account bindings, determines which accounts are available per channel and preferred agent binding.

**Recommended tests:**
- `listBoundAccountIds()` — deduplication, sorting, wildcard handling
- `resolveDefaultAgentBoundAccountId()` — default agent resolution
- `buildChannelAccountBindings()` — hierarchical binding map construction
- `resolvePreferredAccountId()` — preference resolution with fallbacks
- Invalid/missing bindings gracefully handled

### `src/sessions/input-provenance.ts` (~80 lines, 0 tests)

Tracks message origin (external user, inter-session, internal system). Security-relevant for session isolation.

**Recommended tests:**
- `normalizeInputProvenance()` — validation, blank field normalization
- `applyInputProvenanceToUserMessage()` — idempotency, non-user message no-op
- `isInterSessionInputProvenance()` — type classification

### `src/sessions/model-overrides.ts` (~77 lines, 0 tests)

Applies model/provider/auth-profile overrides to session entries with change tracking.

**Recommended tests:**
- Override to default clears provider/model fields
- Override to non-default sets both fields
- Returns `{updated: true}` only when actual changes occur
- Stale fallback notices cleared on update

---

## Priority 4: Shared Utilities (Medium)

### `src/shared/chat-content.ts` (~43 lines, 0 tests)

Extracts text from chat content objects (string or array-of-blocks format).

**Recommended tests:**
- String content extraction
- Array of blocks filtered to text-only
- Custom sanitizer/normalizer application
- Empty/null content handling

### `src/shared/text-chunking.ts` (~35 lines, 0 tests)

Break-aware text chunking for memory embeddings.

**Recommended tests:**
- Empty text → empty array
- Text under limit → single chunk
- Break on resolver-suggested boundary
- Hard limit fallback when resolver returns invalid index
- Whitespace trimming between chunks

### `src/shared/usage-aggregates.ts` (~64 lines, 0 tests)

Builds usage aggregate output structures (by channel, latency stats, daily rollups).

**Recommended tests:**
- `byChannel` sorted by totalCost descending
- Latency average calculation (watch for div-by-zero)
- POSITIVE_INFINITY min converted to 0
- Date sorting (chronological)

### `src/shared/device-auth.ts` (~31 lines, 0 tests)

Normalizes device auth token roles and scopes.

**Recommended tests:**
- Scope deduplication and sorting
- Empty scope filtering
- Non-array scopes → empty array

---

## Priority 5: Markdown Processing (Medium)

### `src/markdown/code-spans.ts` (~106 lines, 0 tests)

Builds index of inline code spans and fence blocks. Stateful parser that tracks state across multiple lines.

**Recommended tests:**
- Single and multi-backtick inline code detection
- Fence blocks excluded from inline span index
- Unbalanced backtick handling
- Stateful parsing across multiple invocations (streaming)
- `isInside()` correctly identifies positions within spans

### `src/markdown/fences.ts` (~60 lines, 0 tests)

Parses Markdown code fence blocks per CommonMark spec.

**Recommended tests:**
- Triple backtick and tilde recognition
- Indentation limits (0-3 spaces valid)
- Closing fence marker matching (char + length rules)
- Nested fence handling

### `src/markdown/tables.ts` (~43 lines, 0 tests)

Converts Markdown tables between rendering modes.

**Recommended tests:**
- Mode "off" passthrough
- Valid table conversion round-trip
- Links inside tables preserved
- Empty/null input handling

---

## Priority 6: Extensions (Medium-Low)

11 of 38 extensions have **zero test files**: copilot-proxy, device-pair, memory-core, minimax-portal-auth, open-prose, phone-control, qwen-portal-auth, shared, signal, talk-voice, test-utils.

Extensions with weak coverage:
- `extensions/zalo` — 3 tests / 17 source files (0.18x)
- `extensions/zalouser` — 3 tests / 13 source files (0.23x)
- `extensions/mattermost` — 6 tests / 21 source files (0.29x)

Note: Extensions are excluded from coverage thresholds, so this is lower priority unless specific extensions are actively developed.

---

## Summary

| Priority | Area | Untested Files | Impact |
|----------|------|---------------|--------|
| P1 | `src/security/` | 5 files (~1,031 lines) | Security-critical; authorization, allowlists, filesystem permissions |
| P2 | `src/memory/` | 4 files (~176 lines) | Data integrity; embedding splits, model limits, error handling |
| P3 | `src/routing/` + `src/sessions/` | 5 files (~384 lines) | Core routing, session isolation, provenance tracking |
| P4 | `src/shared/` | 5 files (~219 lines) | Widely-used utilities; content extraction, chunking, auth normalization |
| P5 | `src/markdown/` | 3 files (~209 lines) | Parsing correctness; code span detection, fence parsing, table conversion |
| P6 | `extensions/` | 11 extensions with 0 tests | Extension reliability |

**Highest ROI quick wins** (small files, pure functions, easy to test):
1. `security/dangerous-tools.ts` — 3-5 tests, trivial assertions
2. `security/dangerous-config-flags.ts` — 5-8 tests
3. `memory/embedding-model-limits.ts` — 8-12 tests
4. `shared/device-auth.ts` — 4-6 tests
5. `sessions/level-overrides.ts` — 6-10 tests

**Highest ROI deep investments** (complex logic, high stakes):
1. `security/audit-channel.ts` — 654 lines of security audit logic, 0 tests
2. `security/mutable-allowlist-detectors.ts` — 6 platform-specific validators, 0 tests
3. `memory/embedding-input-limits.ts` — binary search with UTF-8 boundaries
4. `routing/bindings.ts` — core routing resolution logic
5. `markdown/code-spans.ts` — stateful parser
