---
name: switchboard-solana-svm-feeds
version: 1.0.3
updated: 2026-02-19
depends_on:
  - switchboard
---

# Switchboard Solana/SVM Feeds Skill

## Purpose

Integrate Switchboard on-demand feeds into Solana/SVM transactions and programs:

- Compose transactions that verify/update and then consume feed values correctly
- Implement on-chain verification patterns (Anchor/Rust) when your program consumes feeds
- Support “cranking” patterns to keep canonical quote accounts warm (push-like behavior)

This skill is about integration correctness, not designing new feed definitions (handled by `switchboard-feed-design`).

## Preconditions

- `OperatorPolicy` exists (network, RPC allowlist, autonomy/spend limits).

## Inputs to Collect

- `network`: mainnet-beta / devnet / custom
- `rpcUrl` (optional override)
- `crossbarUrl` (public or self-hosted)
- `feedId` list (32-byte `0x...` hex)
- consumer program ID / instruction shape (if integrating)
- validation targets: max staleness (slots), max deviation, min responses

## Solana/SVM Integration Invariants

- Consumer instruction must occur after Switchboard verification/update instructions in the same transaction.
- Use deterministic/canonical accounts; do not accept arbitrary “quote accounts” without canonical checks.
- Variable overrides are secrets-only (never selectors/URLs/paths/IDs/multipliers).

## Playbook

### 1) Resolve queue and canonical accounts

- Load the correct oracle queue for the network (default unless user specifies).
- Derive or verify canonical quote storage addresses as required by the SDK/program pattern.
- If your program accepts a quote account, enforce that it is canonical for the queue + feedId.

### 2) Update + consume in one transaction (TypeScript skeleton)

Goal: fetch Switchboard-managed update instructions, then call the consumer instruction.

~~~ts
import * as sb from "@switchboard-xyz/on-demand";

const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);

const crossbar = new sb.Crossbar({
  rpcUrl: connection.rpcEndpoint,
  // NOTE: exact constructor args can differ by SDK version; treat as placeholder.
});

// Managed update instructions (must be BEFORE your consumer ix)
const updateIxs = await queue.fetchManagedUpdateIxs(crossbar, [feedId], {
  numSignatures: 1,
  instructionIdx: 0,       // must match sig-verify ix index in the final tx
  variableOverrides: {},   // secrets only
  payer: keypair.publicKey,
});

// Your program instruction that reads verified data
const consumerIx = await buildYourConsumerIx(/* programId, accounts, args */);

const tx = await sb.asV0Tx({
  connection,
  ixs: [...updateIxs, consumerIx],
  signers: [keypair],
});

await connection.sendTransaction(tx);
~~~

Indexing rule:
- If you insert pre-instructions (compute budget, setup ixs), you must adjust `instructionIdx`.

### 3) On-chain verification (Rust/Anchor pattern)

Use the on-demand verifier and enforce staleness:

~~~rust
use switchboard_on_demand::QuoteVerifier;

let quote = QuoteVerifier::new()
    .queue(&ctx.accounts.queue)
    .slothash_sysvar(&ctx.accounts.slothashes)
    .ix_sysvar(&ctx.accounts.instructions)
    .clock_slot(Clock::get()?.slot)
    .max_age(50)
    .verify_instruction_at(0)?;

for feed in quote.feeds() {
    // feed.value(), feed.decimals(), feed.hex_id(), etc.
}
~~~

Also enforce, when applicable:

- canonical quote address constraints
- deviation checks vs stored “last good” value for high-risk logic

### 4) Cranking pattern (push-like / heartbeat imitation)

Use this when you want other transactions/users to read the **most recently cranked** value from the canonical quote account without providing updates every time.

Tradeoffs:
- Pros: readers can do cheaper reads; UI dashboards can stay warm.
- Cons: loses atomic update+use guarantees; must enforce staleness at read-time.

Minimal crank loop: send a transaction that contains only the managed update instructions.

~~~ts
async function crankOnce(feedId: string) {
  const updateIxs = await queue.fetchManagedUpdateIxs(crossbar, [feedId], {
    numSignatures: 1,
    instructionIdx: 0,
    payer: keypair.publicKey,
    variableOverrides: {},
  });

  const tx = await sb.asV0Tx({
    connection,
    ixs: [...updateIxs],
    signers: [keypair],
  });

  return connection.sendTransaction(tx);
}

// Example: crank every 10 seconds (tune to your needs/costs)
setInterval(() => crankOnce(feedId).catch(console.error), 10_000);
~~~

Operational guidance:
- Run cranks from a dedicated wallet with explicit spend limits.
- Monitor failures and staleness; treat missed cranks as “feed stale” for consumers.

## Outputs

Produce a `SolanaFeedIntegrationPlan` including:

- network + RPC/Crossbar URL
- feedId(s) and queue resolution method
- exact instruction ordering (list)
- consumer instruction shape (accounts/args) if integrating
- optional safety policy (staleness/deviation/signatures) if requested
- crank plan (if requested): cadence, cost bounds, monitoring

## Troubleshooting Checklist

- Signature verification index mismatch → re-check `instructionIdx` vs final tx instruction order
- Missing sysvars → include SlotHashes + Instructions sysvars in accounts
- Non-canonical quote account → derive canonical address; reject non-canonical inputs
- Compute limits → add compute budget ixs; reduce feeds/oracles per tx

## References

- https://docs.switchboard.xyz/docs-by-chain/solana-svm
- https://docs.switchboard.xyz/docs-by-chain/solana-svm/price-feeds
- https://docs.switchboard.xyz/tooling/crossbar
