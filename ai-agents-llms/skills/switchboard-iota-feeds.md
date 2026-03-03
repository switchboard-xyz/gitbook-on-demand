---
name: switchboard-iota-feeds
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard Iota Feeds Skill

## Purpose

Use Switchboard on-demand feeds on Iota:

- store job definitions and create aggregators
- crank updates using Iota transactions (pull model)
- consume results in Move with freshness/deviation checks

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/iota-sdk@0.0.3`
- `@switchboard-xyz/common@5.7.0`
- `@iota/iota-sdk@1.11.0`

## Preconditions

- `OperatorPolicy` exists (Iota network, signer custody, RPC allowlist).

## Inputs to Collect

- network (mainnet/testnet)
- RPC endpoint
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- aggregator/feed object IDs
- safety policy (staleness/deviation/min responses) only if risk-sensitive

## Invariants

- Pull-based: updates must be executed client-side.
- Transaction ordering matters: update before consume.

## Playbook (high-level)

1. Resolve Switchboard state/queue for the network.
2. Store jobs (if creating a new feed) and initialize aggregator.
3. Fetch update transaction/actions and execute them.
4. Call consumer Move function after update actions.
5. Enforce staleness/deviation in Move.

## Minimal Example

~~~ts
import { Aggregator, SwitchboardClient } from "@switchboard-xyz/iota-sdk";
import { Transaction } from "@iota/iota-sdk/transactions";

const sb = new SwitchboardClient(iotaClient);
const aggregator = new Aggregator(sb, aggregatorId);

const tx = new Transaction();
await aggregator.fetchUpdateTx(tx);
await iotaClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
~~~

## References

- https://docs.switchboard.xyz/docs-by-chain/iota
- https://docs.switchboard.xyz/tooling/crossbar
