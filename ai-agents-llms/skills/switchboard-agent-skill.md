---
name: switchboard
version: 1.0.3
updated: 2026-03-03
---

# Switchboard Skill

## Purpose

Provide a compact “front door” for all Switchboard work:

- Enforce security/permissions and secret-handling rules consistently
- Normalize terms and identifiers (feed IDs, queues, update payloads)
- Route requests to the correct specialized Switchboard skill(s)
- Produce consistent, integration-ready outputs

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/on-demand@3.9.0`
- `@switchboard-xyz/common@5.7.0`
- `@switchboard-xyz/on-demand-solidity@1.1.0`
- `@switchboard-xyz/sui-sdk@0.1.14`
- `@switchboard-xyz/aptos-sdk@0.1.5`
- `@switchboard-xyz/iota-sdk@0.0.3`
- `switchboard-on-demand = "0.11.3"`
- `switchboard-protos = "0.2.4"`

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

- [Switchboard Solana/SVM Feeds Skill](switchboard-solana-svm-feeds.md)
- [Switchboard EVM Feeds Skill](switchboard-evm-feeds.md)
- [Switchboard Sui Feeds Skill](switchboard-sui-feeds.md)
- [Switchboard Aptos Feeds Skill](switchboard-aptos-feeds.md)
- [Switchboard Iota Feeds Skill](switchboard-iota-feeds.md)
- [Switchboard Movement Feeds Skill](switchboard-movement-feeds.md)
- [Switchboard Feed Design Skill](switchboard-feed-design.md)
- [Switchboard Crossbar Ops Skill](switchboard-crossbar-ops.md)
- [Switchboard Surge Skill](switchboard-surge.md)
- [Switchboard Randomness Skill](switchboard-randomness.md)
- [Switchboard X402 Micropayments Skill](switchboard-x402.md)

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
   Ask whether the user would like to set:
   - max per-tx spend (native token + fees)
   - max daily spend
   - max total spend for the task
5. **Allow/Deny lists**
  Ask whether the user would like to set:
   - allowlist/denylist of program IDs (Solana/SVM), contract addresses (EVM), package IDs (Move/Sui)
   - allowlist/denylist of RPC endpoints
6. **Key custody & handling**
   - where keys come from (file path, keystore, env var, remote signer)
   - whether keys may be persisted (default: NO)
   - whether mainnet signing is allowed (explicit YES required)
7. **Data validation defaults** (overrideable per request)
   - `minResponses` / `minSampleSize`
   - `maxVariance` / `maxDeviationBps`
   - `maxStaleness` / `maxAgeSeconds` / chain-equivalent

### Data Validation Default Presets

Use these as baseline defaults when capturing `OperatorPolicy`, then override per request if needed:

| Preset | minResponses / minSampleSize | maxDeviationBps | maxVariance (Aptos/Movement/Iota) | maxAgeSeconds | Solana maxStaleness (approx slots) | Sui maxAgeMs | Use case |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Devnet | 1 | 1000 | 1000000000 | 300 | 750 | 300000 | prototyping / non-critical |
| Standard (default) | 2 | 500 | 1000000000 | 60 | 150 | 60000 | general production |
| High-risk | 3 | 200 | 1000000000 | 30 | 75 | 30000 | liquidation / settlement / payouts |

Preset selection rules:
- `devnet` network -> default to `Devnet`.
- mainnet/testnet -> default to `Standard`.
- safety-critical financial logic -> escalate to `High-risk`.

### OperatorPolicy devnet defaults

For quick devnet experimentation, prefill `OperatorPolicy` with these defaults and then ask only for missing high-impact constraints (for example allow/deny lists or custom RPCs):

~~~yaml
OperatorPolicy (devnet defaults):
  network: devnet
  autonomy: execute_with_approval
  spend_limits: 1 SOL/tx, 10 SOL/day
  key_custody: file path ($HOME/.config/solana/id.json)
  persist_keys: no
  mainnet_signing: no
  minResponses: 1
  minSampleSize: 1
  maxDeviationBps: 1000
  maxVariance: 1000000000
  maxAgeSeconds: 300
  maxStalenessSlots: 750
  maxAgeMs: 300000
~~~

Notes:
- These are starter defaults, not a bypass of required policy capture.
- For non-Solana chains, keep the same safety posture and translate native token/key custody fields to chain-appropriate values.
- Solana slot values are approximate mappings for documentation convenience (~400ms/slot).
- `maxVariance` is chain-native and kept at `1e9` baseline unless explicitly overridden.

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

## Minimal Example

Route one request to the right subskill and emit the standard output sections:

~~~json
{
  "request": "Use BTC/USD on Solana with atomic update+use",
  "classifiedIntent": "feeds",
  "chain": "solana-svm",
  "selectedSkills": ["switchboard-solana-svm-feeds"],
  "outputSections": [
    "Summary",
    "Assumptions",
    "OperatorPolicy",
    "Plan",
    "Execution Steps",
    "Rollback / Recovery",
    "Risks & Mitigations",
    "Next Actions"
  ]
}
~~~

## Getting Started: First Solana Feed in 5 Minutes (Devnet)

Objective: create a minimal BTC/USD feed definition, store it in Crossbar, and then update+read it on Solana in one transaction.

Flow map: `switchboard-feed-design -> switchboard-crossbar-ops -> switchboard-solana-svm-feeds`

### Step 1: Define a minimal single-source BTC/USD job

Use one source for fastest first success. This is a devnet quickstart baseline.

### Step 2: Store the job in Crossbar and capture feed identifier

### Step 3: Simulate once to validate result shape

~~~bash
set -euo pipefail

CROSSBAR="https://crossbar.switchboard.xyz"

cat > /tmp/btc-usd-job.json <<'JSON'
{
  "jobs": [
    {
      "tasks": [
        {
          "httpTask": {
            "url": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
            "method": "METHOD_GET"
          }
        },
        {
          "jsonParseTask": {
            "path": "$.price"
          }
        },
        {
          "multiplyTask": {
            "big": "100000000"
          }
        }
      ]
    }
  ]
}
JSON

# Store the definition
curl -sS -X POST "$CROSSBAR/store" \
  -H "content-type: application/json" \
  -d @/tmp/btc-usd-job.json \
  | tee /tmp/store-response.json | jq .

# Extract identifier across common response shapes (feedId/feedHash)
FEED_ID="$(jq -r '.feedId // .feedHash // .result.feedId // .result.feedHash // .data.feedId // .data.feedHash // empty' /tmp/store-response.json)"
if [ -z "$FEED_ID" ]; then
  echo "Could not find feed identifier in /store response" >&2
  exit 1
fi
echo "Feed identifier: $FEED_ID"

# Validate once with simulation
curl -sS "$CROSSBAR/simulate/$FEED_ID" | jq .
~~~

### Step 4: Run minimal Solana update+read transaction

~~~ts
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";

async function main() {
  // Assumes Solana CLI/devnet + wallet env are already configured.
  const { connection, keypair, queue, crossbar, program } = await sb.AnchorUtils.loadEnv();
  const feedId = process.env.FEED_ID!;
  if (!feedId) throw new Error("Set FEED_ID from the /store response");

  // Canonical quote PDA for this queue + feed.
  const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);

  const updateIxs = await queue.fetchManagedUpdateIxs(crossbar, [feedId], {
    numSignatures: 1,
    instructionIdx: 0,
    payer: keypair.publicKey,
    variableOverrides: {},
  });

  // Placeholder consumer read instruction (for example, readOracleData in your Anchor program).
  const consumerIx = await program.methods
    .readOracleData()
    .accounts({ quoteAccount })
    .instruction();

  // Atomic ordering rule: Switchboard update instructions first, then consumer instruction.
  const tx = await sb.asV0Tx({
    connection,
    ixs: [...updateIxs, consumerIx],
    signers: [keypair],
  });

  const sim = await connection.simulateTransaction(tx);
  if (sim.value.err) throw new Error(JSON.stringify(sim.value.err));
  const sig = await connection.sendTransaction(tx);
  console.log("tx:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
~~~

### Step 5: Confirm output and next hardening step

Success criteria:
- `/simulate/{id}` returns numeric results.
- The transaction simulates and sends successfully.
- Program logs show the feed was read from the canonical quote account.

Next hardening step:
- Replace the single-source job with a multi-source median template and tighten validation defaults (`minResponses`, staleness, and deviation limits) per your `OperatorPolicy`.

> **Caution:** Crossbar/docs may use `feedHash` and some SDK flows say `feedId` for the same 32-byte identifier. In this quickstart, use the identifier returned by `/store` as the `feedId` input to update calls. This is a devnet-first flow; for production, use multi-source jobs and stricter policy constraints.

Quick links:
- [Switchboard Feed Design Skill](switchboard-feed-design.md)
- [Switchboard Crossbar Ops Skill](switchboard-crossbar-ops.md)
- [Switchboard Solana/SVM Feeds Skill](switchboard-solana-svm-feeds.md)
- [Basic Price Feed Tutorial](../../docs-by-chain/solana-svm/price-feeds/basic-price-feed.md)

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
