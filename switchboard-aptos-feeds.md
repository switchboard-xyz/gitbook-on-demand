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

## Outputs

Produce an `AptosFeedIntegrationPlan` including:

- identifiers and network alignment checks
- crank strategy (if requested)
- Move consumption point and validation policy (if requested)

## References

- https://docs.switchboard.xyz/docs-by-chain/aptos
- https://docs.switchboard.xyz/tooling/crossbar
