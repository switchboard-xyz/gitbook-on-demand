---
name: switchboard-aptos-feeds
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard Aptos Feeds Skill

## Purpose

Use Switchboard on-demand feeds on Aptos:

- crank/update feeds client-side (pull model)
- consume verified results in Move
- enforce freshness/deviation policies in app logic

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/aptos-sdk@0.1.5`
- `@switchboard-xyz/common@5.7.0`
- `@aptos-labs/ts-sdk@6.1.0`

## Preconditions

- `OperatorPolicy` exists (Aptos network, signer custody, RPC allowlist).

## Inputs to Collect

- network (mainnet/testnet)
- RPC endpoint
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- aggregator/feed identifiers (addresses/object IDs)
- safety policy (staleness/deviation/min responses) only if risk-sensitive

## Invariants

- Pull-based: client must crank/update feeds to keep data fresh.
- Ensure update action is executed before reading within the same flow (where applicable).

## Playbook (high-level)

- Off-chain:
  - fetch/update payload(s) for the feed/aggregator
  - submit transaction to run the update action (or include it in the same entry call if supported)
- On-chain:
  - read current result + timestamp
  - enforce staleness and deviation vs last stored value

## Minimal Example

~~~move
use aptos_framework::aptos_coin::AptosCoin;
use aptos_framework::object::{Self, Object};
use switchboard::aggregator::{Self, Aggregator, CurrentResult};
use switchboard::update_action;

public entry fun read_feed(account: &signer, update_data: vector<vector<u8>>) {
    update_action::run<AptosCoin>(account, update_data);
    let feed: Object<Aggregator> = object::address_to_object<Aggregator>(@0xSomeFeedAddress);
    let current: CurrentResult = aggregator::current_result(feed);
    let _price = aggregator::result(&current);
}
~~~

## Outputs

Produce an `AptosFeedIntegrationPlan` including:

- identifiers and network alignment checks
- crank strategy (if requested)
- Move consumption point and validation policy (if requested)

## References

- https://docs.switchboard.xyz/docs-by-chain/aptos
- https://docs.switchboard.xyz/tooling/crossbar
