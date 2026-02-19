---
name: switchboard-crossbar-ops
version: 1.0.3
updated: 2026-02-19
depends_on:
  - switchboard
---

# Switchboard Crossbar Ops Skill

## Purpose

Operate and use Crossbar for:

- Simulating feeds (QA before deployment)
- Storing/pinning feed definitions and obtaining a `feedId`
- Fetching chain-specific update payloads (instructions/bytes)
- Running reliable high-throughput bot and UI backends

## Defaults

- Default `crossbarUrl`: `https://crossbar.switchboard.xyz` (public instance for quick testing)
- Recommend self-hosting Crossbar for frequent simulations/updates to avoid disruptions.

## Preconditions

- `OperatorPolicy` exists.
- If storing jobs/self-hosting: confirm secret handling policy for IPFS credentials.

## Inputs to Collect

Always collect:

- `crossbarUrl` (default public instance unless user requests self-host)
- chain RPC endpoints (allowlisted)

Only collect if needed:

- IPFS config (Pinata JWT or Kubo URL) if storing definitions
- expected throughput (simulation volume, update frequency)

## Playbook

### 1) Public vs self-hosted

- Public Crossbar: dev/testing, low volume.
- Self-host: production, higher volume, strict endpoint policies, frequent simulation.

### 2) Self-host (Docker Compose) — high-level steps

1. create `docker-compose.yml`
2. create `.env` with RPC + IPFS credentials (never print secrets)
3. run `docker-compose up -d`
4. verify health on configured ports

Common defaults:
- HTTP port: 8080
- WebSocket port: 8081

### 3) Core operations

- Store definitions → return a 32-byte feed identifier (`feedId`)
- Simulate feeds → obtain sample values/errors for QA
- Fetch update payloads:
  - Solana: instruction bundles
  - EVM: `bytes[]` updates
  - Randomness: encoded settlement payloads (chain-specific)

### 4) Operational guardrails

- Do not log full `.env`.
- Treat Crossbar as sensitive infra (rate limits, credentials, API keys).
- Use caching appropriately; monitor error rates and response latency.

## Troubleshooting Checklist

- IPFS store fails → verify IPFS credentials and outbound access
- simulation intermittent errors → endpoints unstable; add source diversity/fallbacks
- update fetch fails → network mismatch, RPC unreachable, queue mismatch
- rate limits → self-host + caching + reduce polling

## References

- https://docs.switchboard.xyz/tooling/crossbar
- https://docs.switchboard.xyz/tooling/crossbar/run-crossbar-with-docker-compose
