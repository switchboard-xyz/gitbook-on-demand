---
name: switchboard-sui-feeds
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard Sui Feeds Skill

## Purpose

Integrate Switchboard on-demand feeds into Sui Move contracts using the Quote Verifier pattern:

- Fetch oracle quotes off-chain and attach to a Sui transaction
- Verify quotes on-chain against the correct oracle queue
- Enforce freshness/deviation constraints in Move
- Support “cranking” patterns to keep on-chain consumer state warm (push-like behavior)

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/sui-sdk@0.1.14`
- `@switchboard-xyz/on-demand@3.9.0`
- `@mysten/sui@1.38.0`

## Preconditions

- `OperatorPolicy` exists (Sui network, RPC allowlist, signer custody).

## Inputs to Collect

Always collect:

- `network`: mainnet / testnet
- `rpcUrl`
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- Switchboard deployment package ID (resolve from official docs)
- consumer package ID + consumer object ID
- `feedId` list (32-byte hex)
- `numOracles`

Collect safety policy only if relevant (risk-sensitive logic) or requested:

- `maxAgeMs`
- `maxDeviationBps`

## Sui Integration Invariants

- Verify quotes against the queue from `SwitchboardClient.fetchState()`.
- Verify before use; apply explicit staleness/deviation checks.

## Minimal Example

~~~ts
const tx = new Transaction();
const quotes = await Quote.fetchUpdateQuote(sb, tx, {
  feedHashes: [feedId],
  numOracles,
});

tx.moveCall({
  target: `${consumerPackageId}::module::update_price`,
  arguments: [tx.object(consumerObjectId), quotes, tx.pure.vector("u8", feedIdBytes), tx.object("0x6")],
});

await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
~~~

## Playbook

### 1) Resolve queue and feeds

- Fetch Switchboard state to identify `oracleQueueId`.
- Confirm feed IDs exist for the chosen network.

### 2) Transaction flow (TypeScript skeleton)

~~~ts
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SwitchboardClient, Quote } from "@switchboard-xyz/sui-sdk";

const crossbarUrl = process.env.CROSSBAR_URL ?? "https://crossbar.switchboard.xyz";

const suiClient = new SuiClient({ url: rpcUrl });
const sb = new SwitchboardClient(suiClient);
const state = await sb.fetchState();

const tx = new Transaction();

const quotes = await Quote.fetchUpdateQuote(sb, tx, {
  feedHashes: [feedId],
  numOracles,
});

tx.moveCall({
  target: `${consumerPackageId}::module::update_price`,
  arguments: [
    tx.object(consumerObjectId),
    quotes,
    tx.pure.vector("u8", feedIdBytes),
    tx.object("0x6"), // Clock
  ],
});
~~~

### 3) Cranking pattern (push-like / heartbeat imitation)

Use this when you want the consumer object to hold a “recently verified” value so other txs can read it cheaply without attaching quotes every time.

Tradeoffs:
- Pros: cheaper reads for many consumers; simpler UI.
- Cons: consumer must enforce staleness; values can go stale between cranks.

Crank loop concept:
- Periodically execute the `update_price` (or your equivalent) Move entry function with fresh quotes.

~~~ts
async function crankOnce() {
  const tx = new Transaction();

  const quotes = await Quote.fetchUpdateQuote(sb, tx, {
    feedHashes: [feedId],
    numOracles,
  });

  tx.moveCall({
    target: `${consumerPackageId}::module::update_price`,
    arguments: [
      tx.object(consumerObjectId),
      quotes,
      tx.pure.vector("u8", feedIdBytes),
      tx.object("0x6"),
    ],
  });

  // signAndExecuteTransaction must follow OperatorPolicy rules
  return suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
}

// Example cadence (tune to requirements/cost)
setInterval(() => crankOnce().catch(console.error), 15_000);
~~~

## Outputs

Produce a `SuiFeedIntegrationPlan` including:

- network/RPC/Crossbar URL
- Switchboard package resolution method + queue ID resolution
- consumer object update/read strategy:
  - atomic quote+use, or
  - cranked storage + staleness checks
- optional safety policy if requested

## Troubleshooting Checklist

- feed not found in quotes → ensure requested feedId included in `fetchUpdateQuote`
- quote expired → fetch again; adjust max age only for non-critical flows
- wrong queue/network → verify package IDs and network match

## References

- https://docs.switchboard.xyz/docs-by-chain/sui
- https://docs.switchboard.xyz/docs-by-chain/sui/price-feeds
- https://docs.switchboard.xyz/tooling/crossbar
