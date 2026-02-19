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

## References

- https://docs.switchboard.xyz/docs-by-chain/movement
- https://docs.switchboard.xyz/tooling/crossbar
