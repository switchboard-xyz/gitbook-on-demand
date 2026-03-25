---
name: switchboard-crossbar-ops
version: 1.0.4
updated: 2026-03-25
depends_on:
  - switchboard
---

# Switchboard Crossbar Ops Skill

## Purpose

Operate and use Crossbar for:

- Simulating feeds (QA before deployment)
- Storing/pinning feed definitions and obtaining a `feedId`
- Running the v2 feed-hash flow for current EVM custom feeds
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
  - EVM custom feeds / Feed Builder: v2 `encoded` payload wrapped into `bytes[]`
  - EVM legacy aggregators: `bytes[]` updates from `/updates/evm/...`
  - Randomness: encoded settlement payloads (chain-specific)

### 4) EVM route selection

- Feed Builder/custom feed on EVM:
  - `GET /v2/fetch/{feed_id}`
  - `GET /v2/simulate/{feedHashes}`
  - `GET /v2/update/{feedHashes}?chain=evm&network=mainnet|testnet&use_timestamp=true`
- Legacy aggregator-based EVM integration:
  - `GET /simulate/evm/{network}/{aggregator_ids}`
  - `GET /updates/evm/{chainId}/{aggregatorIds}`
- Do not send a Feed Builder `bytes32` feed ID to `/updates/evm/...` as the default path. Use the v2 route first.

### 5) REST endpoint quick reference

| Endpoint | Method | Description | Example |
| --- | --- | --- | --- |
| `/store` | `POST` | Store a v1 feed definition | `curl -X POST "$CROSSBAR/store" -d '{"queue":"...","jobs":[...]}'` |
| `/fetch/{hash}` | `GET` | Fetch a stored v1 feed definition | `curl "$CROSSBAR/fetch/$FEED_HASH"` |
| `/v2/fetch/{feed_id}` | `GET` | Fetch a stored v2 feed definition | `curl "$CROSSBAR/v2/fetch/$FEED_ID"` |
| `/simulate/jobs` | `POST` | Simulate raw `OracleJob[]` from request body | `curl -X POST "$CROSSBAR/simulate/jobs" -d '{"jobs":[...]}'` |
| `/simulate/{feedHashes}` | `GET` | Simulate one or more stored feed hashes | `curl "$CROSSBAR/simulate/$FEED_HASH"` |
| `/v2/simulate/{feedHashes}` | `GET` | Simulate one or more v2 feed hashes | `curl "$CROSSBAR/v2/simulate/$FEED_ID?network=testnet"` |
| `/v2/update/{feedHashes}` | `GET` | Build v2 chain-specific update payloads | `curl "$CROSSBAR/v2/update/$FEED_ID?chain=evm&network=testnet&use_timestamp=true"` |
| `/updates/solana/{network}/{feedPubkeys}` | `GET` | Build Solana pull update instructions | `curl "$CROSSBAR/updates/solana/devnet/$FEED_PUBKEY?payer=$PAYER"` |
| `/updates/evm/{chainId}/{aggregatorIds}` | `GET` | Build legacy EVM encoded update bytes | `curl "$CROSSBAR/updates/evm/1116/$AGGREGATOR_ID"` |
| `/updates/aptos/{network}/{aggregatorAddresses}` | `GET` | Build Aptos update payloads | `curl "$CROSSBAR/updates/aptos/testnet/$AGGREGATOR_ID"` |
| `/updates/sui/{network}/{aggregatorAddresses}` | `GET` | Build Sui update payloads | `curl "$CROSSBAR/updates/sui/mainnet/$AGGREGATOR_ID"` |
| `/updates/iota/{network}/{aggregatorAddresses}` | `GET` | Build Iota update payloads | `curl "$CROSSBAR/updates/iota/mainnet/$AGGREGATOR_ID"` |
| `/randomness/evm` | `POST` | Fetch EVM randomness settlement payload | `curl -X POST "$CROSSBAR/randomness/evm" -d '{...}'` |

### 6) Payload snapshots

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

`GET /v2/update/{feedHashes}?chain=evm&network=testnet&use_timestamp=true` response:

~~~json
{
  "medianResponses": [
    {
      "value": "123450000000000000000",
      "feedHash": "0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c",
      "numOracles": 3
    }
  ],
  "oracleResponses": [],
  "timestamp": 1730000000,
  "slot": 0,
  "recentHash": "0xabc123...",
  "encoded": "0x8f6f2b7c..."
}
~~~

For EVM consumers, wrap `encoded` into a one-element `bytes[]` when calling `getFee` or `updateFeeds`.

`GET /updates/evm/{chainId}/{aggregatorIds}` legacy response:

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

### 7) Operational guardrails

- Do not log full `.env`.
- Treat Crossbar as sensitive infra (rate limits, credentials, API keys).
- Use caching appropriately; monitor error rates and response latency.
- For Monad and current custom-feed integrations, prefer the v2 feed-hash flow even if legacy EVM routes are still available.

## Minimal Example

~~~bash
CROSSBAR="https://crossbar.switchboard.xyz"
FEED_ID="0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812"
AGGREGATOR_ID="0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c"

# Simulate a direct OracleJob payload
curl -s -X POST "$CROSSBAR/simulate/jobs" \
  -H "content-type: application/json" \
  -d '{"jobs":[{"tasks":[{"valueTask":{"value":42}}]}]}' | jq .

# Fetch a Monad-compatible v2 EVM payload for one feed
curl -s "$CROSSBAR/v2/update/$FEED_ID?chain=evm&network=testnet&use_timestamp=true" | jq .

# Legacy EVM aggregator route, only for older integrations
curl -s "$CROSSBAR/updates/evm/1116/$AGGREGATOR_ID" | jq .
~~~

## Troubleshooting Checklist

- IPFS store fails → verify IPFS credentials and outbound access
- simulation intermittent errors → endpoints unstable; add source diversity/fallbacks
- update fetch fails → network mismatch, RPC unreachable, queue mismatch
- `ORACLE_UNAVAILABLE` on `/v2/update` after successful `/v2/fetch` and `/v2/simulate` → treat as managed oracle/gateway availability, not a missing permission
- EVM custom feed not resolving → confirm you are using `/v2/fetch`, `/v2/simulate`, and `/v2/update`, not the legacy aggregator route
- rate limits → self-host + caching + reduce polling

## References

- https://docs.switchboard.xyz/tooling/crossbar
- https://docs.switchboard.xyz/tooling/crossbar/run-crossbar-with-docker-compose
