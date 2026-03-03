---
name: switchboard-movement-feeds
version: 1.0.3
updated: 2026-02-19
depends_on:
  - switchboard
---

# Switchboard Movement Feeds Skill

## Purpose

Use Switchboard on-demand feeds on Movement:

- crank/update feeds client-side (pull model)
- integrate verified values into Move-based application logic
- apply freshness/deviation validation policies appropriate to risk

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/aptos-sdk@0.1.5`
- `@switchboard-xyz/common@5.7.0`
- `@aptos-labs/ts-sdk@6.1.0`

## Preconditions

- `OperatorPolicy` exists (Movement network, signer custody, RPC allowlist).

## Inputs to Collect

Always collect:

- network (mainnet/testnet)
- RPC endpoint
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- feed/aggregator identifiers used by Movement integration

Collect validation thresholds only if relevant (risk-sensitive) or requested:

- `maxStaleness` (time-based freshness requirement)
- `maxDeviationBps` (sanity bound vs last value/expected value)
- `minResponses` / `minSampleSize` (how many oracle responses/signatures you require per update)

## Invariants

- Pull-based: client must crank/update feeds to keep data fresh.
- Ensure update occurs before read/use within the same flow recommended by Movement docs.

## Playbook (high-level)

1. Discover feed identifiers for the target network.
2. Crank/update feed using the Movement SDK flow.
3. In Move, read latest value + timestamp and enforce staleness/deviation as needed.
4. Define failure mode: pause/guard high-risk actions when stale or deviating.

## Minimal Example

~~~move
use aptos_framework::aptos_coin::AptosCoin;
use aptos_framework::object::{Self, Object};
use on_demand::aggregator::{Self, Aggregator, CurrentResult};
use on_demand::update_action;

public entry fun read_feed(account: &signer, update_data: vector<vector<u8>>) {
    update_action::run<AptosCoin>(account, update_data);
    let feed: Object<Aggregator> = object::address_to_object<Aggregator>(@0xSomeFeedAddress);
    let current: CurrentResult = aggregator::current_result(feed);
    let _price = aggregator::result(&current);
}
~~~

## References

- https://docs.switchboard.xyz/docs-by-chain/movement
- https://docs.switchboard.xyz/tooling/crossbar
