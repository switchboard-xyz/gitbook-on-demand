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

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/common@5.7.0`
- `@switchboard-xyz/cli@3.5.12` (optional for CLI workflows)

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

### 4) REST endpoint quick reference

| Endpoint | Method | Description | Example |
| --- | --- | --- | --- |
| `/store` | `POST` | Store a v1 feed definition | `curl -X POST "$CROSSBAR/store" -d '{"queue":"...","jobs":[...]}'` |
| `/fetch/{hash}` | `GET` | Fetch a stored v1 feed definition | `curl "$CROSSBAR/fetch/$FEED_HASH"` |
| `/simulate/jobs` | `POST` | Simulate raw `OracleJob[]` from request body | `curl -X POST "$CROSSBAR/simulate/jobs" -d '{"jobs":[...]}'` |
| `/simulate/{feedHashes}` | `GET` | Simulate one or more stored feed hashes | `curl "$CROSSBAR/simulate/$FEED_HASH"` |
| `/updates/solana/{network}/{feedPubkeys}` | `GET` | Build Solana pull update instructions | `curl "$CROSSBAR/updates/solana/devnet/$FEED_PUBKEY?payer=$PAYER"` |
| `/updates/evm/{chainId}/{aggregatorIds}` | `GET` | Build EVM encoded update bytes | `curl "$CROSSBAR/updates/evm/1116/$FEED_ID"` |
| `/updates/aptos/{network}/{aggregatorAddresses}` | `GET` | Build Aptos update payloads | `curl "$CROSSBAR/updates/aptos/testnet/$AGGREGATOR_ID"` |
| `/updates/sui/{network}/{aggregatorAddresses}` | `GET` | Build Sui update payloads | `curl "$CROSSBAR/updates/sui/mainnet/$AGGREGATOR_ID"` |
| `/updates/iota/{network}/{aggregatorAddresses}` | `GET` | Build Iota update payloads | `curl "$CROSSBAR/updates/iota/mainnet/$AGGREGATOR_ID"` |
| `/randomness/evm` | `POST` | Fetch EVM randomness settlement payload | `curl -X POST "$CROSSBAR/randomness/evm" -d '{...}'` |

### 5) Payload snapshots

`POST /simulate/jobs` request:

~~~json
{
  "jobs": [
    {
      "tasks": [
        { "valueTask": { "value": 42 } }
      ]
    }
  ],
  "network": "mainnet"
}
~~~

`POST /simulate/jobs` response:

~~~json
{
  "feedHash": "direct",
  "results": ["42"],
  "error": null
}
~~~

`GET /updates/evm/{chainId}/{aggregatorIds}` response:

~~~json
{
  "results": [
    {
      "result": "123450000000000000000"
    }
  ],
  "failures": [],
  "encoded": [
    "0x8f6f2b7c..."
  ]
}
~~~

### 6) Operational guardrails

- Do not log full `.env`.
- Treat Crossbar as sensitive infra (rate limits, credentials, API keys).
- Use caching appropriately; monitor error rates and response latency.

## Minimal Example

~~~bash
CROSSBAR="https://crossbar.switchboard.xyz"

# Simulate a direct OracleJob payload
curl -s -X POST "$CROSSBAR/simulate/jobs" \
  -H "content-type: application/json" \
  -d '{"jobs":[{"tasks":[{"valueTask":{"value":42}}]}]}' | jq .

# Fetch EVM encoded update bytes for one feed
curl -s "$CROSSBAR/updates/evm/1116/0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c" | jq .
~~~

## Troubleshooting Checklist

- IPFS store fails → verify IPFS credentials and outbound access
- simulation intermittent errors → endpoints unstable; add source diversity/fallbacks
- update fetch fails → network mismatch, RPC unreachable, queue mismatch
- rate limits → self-host + caching + reduce polling

## References

- https://docs.switchboard.xyz/tooling/crossbar
- https://docs.switchboard.xyz/tooling/crossbar/run-crossbar-with-docker-compose
