---
name: switchboard
version: 1.0.2
updated: 2026-02-18
---

# Switchboard Skill

## Purpose

Provide a compact “front door” for all Switchboard work:

- Enforce security/permissions and secret-handling rules consistently
- Normalize terms and identifiers (feed IDs, queues, update payloads)
- Route requests to the correct specialized Switchboard skill(s)
- Produce consistent, integration-ready outputs

## Scope

This skill covers:

- Capturing and enforcing an `OperatorPolicy`
- Interpreting intent (feeds vs Surge vs randomness vs Crossbar vs X402)
- Selecting and sequencing specialized skills
- Standard output format for plans and execution steps

Out of scope (handled by specialized skills):

- Chain-specific transaction composition details
- Chain-specific on-chain verifier/consumer code
- Crossbar deployment configuration details

## Subskills

- [Switchboard Solana/SVM Feeds Skill](../switchboard-solana-svm-feeds.md)
- [Switchboard EVM Feeds Skill](../switchboard-evm-feeds.md)
- [Switchboard Sui Feeds Skill](../switchboard-sui-feeds.md)
- [Switchboard Aptos Feeds Skill](../switchboard-aptos-feeds.md)
- [Switchboard Iota Feeds Skill](../switchboard-iota-feeds.md)
- [Switchboard Movement Feeds Skill](../switchboard-movement-feeds.md)
- [Switchboard Feed Design Skill](../switchboard-feed-design.md)
- [Switchboard Crossbar Ops Skill](../switchboard-crossbar-ops.md)
- [Switchboard Surge Skill](../switchboard-surge.md)
- [Switchboard Randomness Skill](../switchboard-randomness.md)
- [Switchboard X402 Micropayments Skill](../switchboard-x402.md)

## Hard Rules: Security & Permissions Contract

### MUST establish `OperatorPolicy` before any of the following

You MUST have an explicit `OperatorPolicy` before you:

- sign transactions (any chain)
- move funds / pay fees
- deploy contracts/programs/packages
- write to on-chain state
- store/persist secrets (private keys, JWTs, API keys)

If missing, ask one compact question set and store answers as `OperatorPolicy`.

### OperatorPolicy (required)

Capture these fields (ask if missing):

1. **Target chain(s)**: Solana/SVM, EVM (chain IDs), Sui, Aptos, Iota, Movement
2. **Network per chain**: mainnet/testnet/devnet (and any custom cluster name)
3. **Autonomy mode**
   - `read_only` (no keys)
   - `plan_only` (no signing; provide exact steps)
   - `execute_with_approval` (propose each tx and wait for approval)
   - `full_autonomy` (execute within constraints)
4. **Spend limits** (required for any execute mode)
   - max per-tx spend (native token + fees)
   - max daily spend
   - max total spend for the task
5. **Allow/Deny lists**
   - allowlist/denylist of program IDs (Solana/SVM), contract addresses (EVM), package IDs (Move/Sui)
   - allowlist/denylist of RPC endpoints and Crossbar URLs
6. **Key custody & handling**
   - where keys come from (file path, keystore, env var, remote signer)
   - whether keys may be persisted (default: NO)
   - whether mainnet signing is allowed (explicit YES required)
7. **Data validation defaults** (overrideable per request)
   - `minResponses` / `minSampleSize`
   - `maxVariance` / `maxDeviationBps`
   - `maxStaleness` / `maxAgeSeconds` / chain-equivalent

### Secret handling (mandatory)

- NEVER print secrets, private keys, seed phrases, API tokens, Pinata JWTs, or full `.env` contents.
- If referencing a secret, use placeholder names (e.g., `$PINATA_JWT_KEY`, `$API_KEY`).
- Prefer encrypted keystores / secret managers.
- Never recommend `export PRIVATE_KEY=...` in shell history.

## Core Concepts and Terms

### Pull-based oracle model

- Data is fetched off-chain and then submitted on-chain for verification and use.
- For safety-critical logic, update and read should be atomic (same tx / same entry call), where the chain supports it.

### Feed identifiers (normalized)

Use these names consistently:

- **`feedId`**: 32-byte identifier (commonly `0x` + 64 hex chars).
- **`feedDefinition`**: job pipelines (`OracleJob[]`) describing how to compute values.
- **`queueId`**: oracle subnet/queue identifier (chain-specific type).
- **`updatePayload`**: chain-specific proof/data used for on-chain verification.

Note: Some SDKs/docs say “feed hash” for the same 32-byte `feedId`. Treat the 32-byte identifier as `feedId` unless explicitly dealing with content-addressed feed definition storage.

### Variable overrides (security invariant)

- Variable overrides (`${VAR}`) are for secrets only (API keys, auth tokens, payment headers).
- Do not use overrides for URLs, JSON paths, IDs, multipliers, selectors, or anything that changes data selection logic.

## Routing Logic

### Step 1: classify the request

Determine intent:

- Feeds
- Custom feed design
- Crossbar
- Surge streaming
- Randomness
- X402 micropayments

Determine chain:

- Solana/SVM
- EVM
- Sui
- Aptos
- Iota
- Movement

### Step 2: route to specialized skills

Chain routing:

- Solana/SVM feeds → `switchboard-solana-svm-feeds`
- EVM feeds → `switchboard-evm-feeds`
- Sui feeds → `switchboard-sui-feeds`
- Aptos feeds → `switchboard-aptos-feeds`
- Iota feeds → `switchboard-iota-feeds`
- Movement feeds → `switchboard-movement-feeds`

Feature routing:

- Feed design → `switchboard-feed-design`
- Simulation/store/self-host → `switchboard-crossbar-ops`
- Streaming (Surge) → `switchboard-surge`
- Randomness → `switchboard-randomness`
- X402 micropayments → `switchboard-x402`

### Step 3: common multi-skill sequences

- “I need a new feed”
  - `switchboard-feed-design` → `switchboard-crossbar-ops` → chain feed skill
- “Integrate an existing feed”
  - chain feed skill → optional `switchboard-crossbar-ops` (simulate)
- “Use Surge prices on-chain”
  - `switchboard-surge` → chain feed skill (settlement path)
- “Use randomness”
  - `switchboard-randomness` → (optional) chain skill for integration

## Standard Output Format

When producing artifacts, use these headings:

1. Summary
2. Assumptions
3. OperatorPolicy
4. Plan
5. Execution Steps (only if allowed)
6. Rollback / Recovery
7. Risks & Mitigations
8. Next Actions

## References

- https://docs.switchboard.xyz/
- https://docs.switchboard.xyz/tooling/crossbar
- https://docs.switchboard.xyz/custom-feeds/task-types
- https://docs.switchboard.xyz/custom-feeds/advanced-feed-configuration/data-feed-variable-overrides
