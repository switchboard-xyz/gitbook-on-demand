# Crossbar API Endpoints

This page documents the HTTP and WebSocket endpoints exposed by Crossbar.

Base URL examples:

- Public: `https://crossbar.switchboard.xyz`
- Local: `http://localhost:8080`

For machine-readable schema and live testing:

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /api-docs/openapi.json`

## Core Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/version` | Service version info |
| `GET` | `/test` | Basic test endpoint |
| `GET` | `/protos/job_schemas.proto` | Oracle job protobuf schema |
| `POST` | `/store` | Store v1 feed definition |
| `GET` | `/fetch/{hash}` | Fetch v1 feed definition |
| `POST` | `/v2/store` | Store v2 feed definition |
| `GET` | `/v2/fetch/{feed_id}` | Fetch v2 feed definition |
| `GET` | `/v2/update/{feedHashes}` | Build v2 multi-feed update payload |
| `ANY` | `/rpc/{network}` | RPC passthrough/proxy endpoint |
| `GET` | `/debug/cid/{hash}` | CID conversion/debug |
| `GET` | `/debug/bnb` | Binance debug endpoint |

## EVM Route Selection

Use different Crossbar routes depending on whether you are integrating a current Feed Builder/custom feed or an older aggregator-based EVM integration.

| Use case | Use these routes | Identifier | Notes |
| --- | --- | --- | --- |
| Feed Builder/custom feed on EVM | `/v2/fetch/{feed_id}`, `/v2/simulate/{feedHashes}`, `/v2/update/{feedHashes}` | deterministic `bytes32` feed ID / feed hash | Recommended flow for Monad and current custom-feed integrations. Use `chain=evm`, `network=mainnet|testnet`, and usually `use_timestamp=true` on `/v2/update`. |
| Legacy aggregator-based EVM integration | `/simulate/evm/{network}/{aggregator_ids}`, `/updates/evm/{chainId}/{aggregatorIds}` | legacy aggregator ID | Compatibility flow for older EVM integrations. Do not use this as the primary path for Feed Builder custom feeds. |

## Simulation Endpoints

### Generic

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/simulate` | Simulate jobs from request body |
| `POST` | `/simulate/jobs` | Alias for `/simulate` |
| `GET` | `/simulate/{feedHashes}` | Simulate comma-separated feed hashes |

### Chain-specific

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/simulate/solana` | Simulate Solana feeds |
| `GET` | `/simulate/solana/{network}/{feedpubkeys}` | Simulate Solana feed pubkeys |
| `POST` | `/simulate/eclipse` | Simulate Eclipse feeds |
| `GET` | `/simulate/eclipse/{network}/{feedpubkeys}` | Simulate Eclipse feed pubkeys |
| `POST` | `/simulate/evm` | Simulate EVM aggregators |
| `GET` | `/simulate/evm/{network}/{aggregator_ids}` | Simulate EVM aggregator IDs |
| `POST` | `/simulate/aptos` | Simulate Aptos feeds |
| `GET` | `/simulate/aptos/{network}/{feedhashes}` | Simulate Aptos feed hashes |
| `POST` | `/simulate/sui` | Simulate Sui feeds |
| `POST` | `/simulate/sui/feeds` | Alias for Sui simulation |
| `GET` | `/simulate/sui/{network}/{feedids}` | Simulate Sui feed IDs |
| `POST` | `/simulate/iota` | Simulate Iota feeds |
| `GET` | `/simulate/iota/{network}/{feedids}` | Simulate Iota feed IDs |

### V2 simulation

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/v2/simulate` | Simulate v2 feed input payload |
| `GET` | `/v2/simulate/{feedHashes}` | Simulate v2 feed hashes |
| `POST` | `/v2/simulate/proto` | Simulate base64-encoded `OracleFeed` proto |

### Backward-compatible API prefix

Crossbar also exposes simulation routes under `/api/simulate` for compatibility.  
Example: `POST /api/simulate`, `GET /api/simulate/{feedHashes}`.

## Update Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/updates/solana/{network}/{feedPubkeys}` | Solana update instructions and oracle responses |
| `GET` | `/updates/eclipse/{network}/{feedPubkeys}` | Eclipse update instructions and oracle responses |
| `GET` | `/updates/evm/{chainId}/{aggregatorIds}` | EVM encoded updates |
| `GET` | `/updates/evm/fetch_update_data/{chain_id}/{feed_ids}` | EVM update-data variant |
| `GET` | `/updates/aptos/{network}/{aggregatorAddresses}` | Aptos aggregator updates |
| `GET` | `/updates/sui/{network}/{aggregatorAddresses}` | Sui aggregator updates |
| `GET` | `/updates/iota/{network}/{aggregatorAddresses}` | Iota aggregator updates |

## Gateway Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/gateways?network=mainnet|devnet|testnet` | Discover gateway URLs |
| `POST` | `/gateways/fetch_signatures` | Fetch signatures (single feed/job request) |
| `POST` | `/gateways/fetch_signatures_consensus` | Fetch consensus signatures |

## Oracle and Guardian Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/oracles` | List Solana oracles |
| `GET` | `/oracles/sui` | List Sui oracles |
| `GET` | `/oracles/aptos` | List Aptos oracles |
| `POST` | `/oracles/fetch_signatures` | Fetch oracle signatures |
| `GET` | `/guardians` | List guardians |

## Randomness Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/randomness/evm` | Fetch EVM randomness result payload |

## Stream (Surge) Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/stream/ws` | WebSocket stream endpoint |
| `GET` | `/stream/surge_feeds` | List available Surge feeds |
| `POST` | `/stream/request_session` | Create Surge stream session token |
| `GET` | `/stream/socket_metrics` | Stream/socket metrics |
| `GET` | `/stream/debug_binance` | Binance stream debug info |

Legacy Surge endpoints are also exposed when Surge is enabled:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/surge/stream` | Legacy Surge WebSocket endpoint |
| `POST` | `/v1/surge/session` | Legacy Surge session endpoint |

## Flamegraph Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/flamegraph` | Flamegraph status/info |
| `POST` | `/flamegraph/start` | Start profiling |
| `POST` | `/flamegraph/stop` | Stop profiling |
| `GET` | `/flamegraph/ui` | Flamegraph UI |

## Detailed Request/Response Reference

Use this section for implementation-level request and response shapes. The tables above remain the quick index.

### Simulation

#### `POST /simulate/jobs`

Purpose: simulate raw `OracleJob[]` directly (without fetching feed definitions from IPFS).

Request body:

```json
{
  "jobs": [
    {
      "tasks": [
        { "valueTask": { "value": 42 } }
      ]
    }
  ],
  "includeReceipts": true,
  "variableOverrides": {
    "API_KEY": "..."
  },
  "network": "mainnet"
}
```

Response (`200`):

```json
{
  "feedHash": "direct",
  "results": ["42"],
  "receipts": ["..."],
  "error": null
}
```

Notes:

- `jobs` also accepts base64-encoded protobuf entries.
- `variableOverrides` is optional.
- `network` defaults to `mainnet` when omitted.

#### `POST /simulate/solana`

Purpose: simulate one or more Solana feed pubkeys by loading on-chain feed state, resolving feed hash, loading jobs from IPFS, and running jobs.

Request body:

```json
{
  "feeds": [
    "6dJY6fNn7q7eYxw8fPqfF7XULg1Wm3v3GJm6M6hQ8B9X"
  ],
  "network": "mainnet-beta",
  "includeReceipts": false
}
```

Response (`200`): array of per-feed simulation results.

```json
[
  {
    "feed": "6dJY6fNn7q7eYxw8fPqfF7XULg1Wm3v3GJm6M6hQ8B9X",
    "feedHash": "617c43b30c588de5e620fa4c7b932e103301b9a160e2c24be69dbe0357e45797",
    "results": ["1.2345", "1.2351", "1.2339"],
    "receipts": null,
    "result": "1.2345",
    "stdev": "0.00049",
    "variance": "0.00024",
    "error": null
  }
]
```

Notes:

- `network` accepts values such as `mainnet-beta`, `devnet`, `testnet`.
- `mainnet` is normalized to `mainnet-beta`.

#### `GET /simulate/{feedHashes}`

Purpose: simulate one or more feed hashes directly from IPFS definitions.

Path:

- `feedHashes`: comma-separated feed hashes

Query:

- `includeReceipts` (`bool`, optional)

Response (`200`): array

```json
[
  {
    "feedHash": "617c43b30c588de5e620fa4c7b932e103301b9a160e2c24be69dbe0357e45797",
    "results": ["1.2345", "1.2351"],
    "receipts": null,
    "error": null
  }
]
```

#### `POST /v2/simulate`

Purpose: simulate v2 feed hashes with optional network and variable overrides.

Request body:

```json
{
  "feedHashes": [
    "617c43b30c588de5e620fa4c7b932e103301b9a160e2c24be69dbe0357e45797"
  ],
  "includeReceipts": false,
  "variableOverrides": {
    "API_KEY": "..."
  },
  "network": "mainnet"
}
```

Response (`200`):

```json
{
  "feeds": [
    {
      "feedHash": "617c43b30c588de5e620fa4c7b932e103301b9a160e2c24be69dbe0357e45797",
      "feedName": "MINO/USD",
      "results": ["1.2345"],
      "receipts": null,
      "variableOverrides": {
        "API_KEY": "..."
      },
      "network": "mainnet"
    }
  ],
  "totalFeeds": 1,
  "successfulFeeds": 1,
  "failedFeeds": 0
}
```

### Updates

#### `GET /v2/update/{feedHashes}`

Purpose: build a chain-specific consensus payload for one or more v2 feed hashes.

Path:

- `feedHashes`: comma-separated deterministic feed IDs / feed hashes

Query:

- `chain` (`string`, required for chain-specific payloads; use `evm` for EVM)
- `network` (`string`, optional; `mainnet` or `testnet`)
- `use_timestamp` (`bool`, optional)
- `num_oracles` (`u32`, optional)
- `gateway` (`string`, optional)

Response (`200`): object

```json
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
```

V2 update response schema:

- `medianResponses`: one consensus value per requested feed hash
- `oracleResponses`: per-oracle response detail
- `timestamp`: signed consensus timestamp
- `slot`: slot or sequence metadata from the gateway
- `recentHash`: recent hash used for the signed payload
- `encoded`: chain-specific encoded update payload

For EVM, wrap `encoded` into a one-element `bytes[]` when calling `getFee` or `updateFeeds`.

Monad example:

```bash
curl "http://localhost:8080/v2/update/0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812?chain=evm&network=testnet&use_timestamp=true"
```

#### `GET /updates/solana/{network}/{feedPubkeys}`

Purpose: generate Solana pull update instructions and oracle response metadata.

Path:

- `network`: `mainnet`, `mainnet-beta`, `devnet`, `testnet`
- `feedPubkeys`: comma-separated feed pubkeys

Query:

- `numSignatures` (`u32`, optional)
- `payer` (`string`, required)

Response (`200`): array of update objects

```json
[
  {
    "success": true,
    "pullIxns": [
      "0673bd46f2e47e04f12bd92fb731968ecd9d9757c274da87476f465c040c6573050000000000000089e0fecf1c1b3a11e77b9d1048192288ae1d8ada0e19ff95d737c4e5afb583f70001d284bd424eb258f1f502c95ff334245b64af7df6b14435d1ea46d10fb3ac68b6000086807068432f186a147cf0b13a30067d386204ea9d6c8b04743ac2ef010b075200007752c55e8b0a7079ad51975736764e45f56d61ebd15aa96d55f7ca86d5b5e387010100000000000000000000000000000000000000000000000000000000000000000000310000000000000001020304050607081d3c620d5670b1b26d0d3c7c27cb75a5187d99b8ccf8850d5b79d573b81bff7c030000009600000000"
    ],
    "responses": [
      {
        "oracle": "9pPCSotuPGUDgdYUtngMCemNi3KHdWFvwLhqx57KkbXb",
        "result": 1.1067679409326794,
        "errors": ""
      }
    ],
    "lookupTables": [
      "A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w"
    ]
  }
]
```

`pullIxns` wire format:

- Each array entry is a hex-encoded `bincode` serialization of `solana_sdk::instruction::Instruction`.
- Raw HTTP responses return these serialized strings directly.
- SDK helpers such as `CrossbarClient.fetchSolanaUpdates` may decode them into native instruction objects before returning to your application.
- `lookupTables` are still returned separately for address lookup table usage in versioned transactions.

Rust decode example:

```rust
use solana_sdk::instruction::Instruction;

fn decode_instruction(ix_hex: &str) -> anyhow::Result<Instruction> {
    let bytes = hex::decode(ix_hex)?;
    Ok(bincode::deserialize(&bytes)?)
}
```

#### `GET /updates/eclipse/{network}/{feedPubkeys}`

Response schema is the same as `/updates/solana/{network}/{feedPubkeys}`:

- `success`: `bool`
- `pullIxns`: array of hex-encoded serialized `Instruction` values
- `responses`: array of oracle responses
- `lookupTables`: array of address lookup table pubkeys (base58)

#### `GET /updates/evm/{chainId}/{aggregatorIds}`

Purpose: fetch EVM-compatible encoded updates and supporting oracle response data.

Path:

- `chainId`: EVM chain ID (example `1`, `42161`, `1116`)
- `aggregatorIds`: comma-separated feed IDs

Query:

- `numSignatures` (`u32`, optional)
- `gateway` (`string`, optional)

Response (`200`): object

```json
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
```

EVM response schema:

- `results`: array of oracle response objects (includes normalized `result` and additional gateway-returned fields).
- `failures`: array of errors for feeds/oracles that failed during fetch/update building.
- `encoded`: array of `0x`-prefixed ABI-encoded update payloads.

#### `GET /updates/aptos/{network}/{aggregatorAddresses}`

Response (`200`):

```json
{
  "responses": [
    {
      "responses": [],
      "failures": [],
      "encoded": [
        "0x..."
      ]
    }
  ],
  "failures": [],
  "encoded": [
    "0x..."
  ]
}
```

Aptos response schema:

- `responses`: per-aggregator update objects returned by Aptos SDK.
- `failures`: top-level route errors.
- `encoded`: flattened list of encoded Aptos update payloads.

#### `GET /updates/sui/{network}/{aggregatorAddresses}`

Response (`200`):

```json
{
  "responses": [
    {
      "results": [],
      "failures": []
    }
  ],
  "failures": []
}
```

Sui response schema:

- `responses`: per-aggregator update objects returned by Sui SDK (`fetchUpdateInfo` output).
- `failures`: top-level route errors.

#### `GET /updates/iota/{network}/{aggregatorAddresses}`

Response (`200`) matches the Sui endpoint shape:

```json
{
  "responses": [
    {
      "results": [],
      "failures": []
    }
  ],
  "failures": []
}
```

### Gateways

#### `GET /gateways`

Purpose: discover active gateway URLs from cached oracle state.

Query:

- `network`: `mainnet` (default), `devnet`, or `testnet`

Response (`200`):

```json
[
  "https://gateway-1.example.com",
  "https://gateway-2.example.com"
]
```

#### `POST /gateways/fetch_signatures`

Purpose: fetch signatures for a single feed/jobs request. Supports both legacy and new request shapes.

Legacy body (feed-hash based):

```json
{
  "feedHash": "617c43b30c588de5e620fa4c7b932e103301b9a160e2c24be69dbe0357e45797",
  "numSignatures": 3,
  "maxVariance": 50000000,
  "minResponses": 1,
  "useTimestamp": true
}
```

New body (jobs-based):

```json
{
  "apiVersion": "1",
  "jobsB64Encoded": ["..."],
  "numOracles": 3,
  "maxVariance": 50000000,
  "minResponses": 1,
  "useTimestamp": true
}
```

Response (`200`): gateway signature response object (signatures + timestamp + variance).

#### `POST /gateways/fetch_signatures_consensus`

Purpose: fetch consensus signatures using feed request objects.

Request body:

```json
{
  "apiVersion": "1",
  "feedRequests": [],
  "numOracles": 3,
  "useTimestamp": true
}
```

Response (`200`):

```json
{
  "signatures": [],
  "timestamp": 1730000000,
  "variance": 0,
  "consensusReached": true
}
```

### Stream (Surge)

#### `GET /stream/surge_feeds`

Purpose: list currently available Surge feed symbols.

Query:

- `symbol` (optional)
- `exchange` (optional)

Response (`200`): feed list object from Surge core.
Response (`503`): no feeds available.

#### `POST /stream/request_session`

Purpose: validate API key and create session token + WebSocket URL.

Auth input:

- Header `x-api-key: <key>` preferred
- Also supports `Authorization: Bearer <key>`
- Also supports query param `api_key=<key>`

Request body:

```json
{
  "client_ip": "203.0.113.10"
}
```

Response (`200`):

```json
{
  "session_token": "...",
  "simulator_ws_url": "wss://.../v1/surge/stream"
}
```

Error responses:

- `400` missing API key
- `401` invalid API key

#### `GET /stream/ws`

Purpose: WebSocket stream endpoint for Surge updates.  
For full handshake, auth headers, subscribe payload, and ping/pong flow, see [Surge Gateway Protocol](gateway-protocol.md).

### Minimal curl examples

Simulate Solana feed:

```bash
curl -X POST http://localhost:8080/simulate/solana \
  -H "Content-Type: application/json" \
  -d '{
    "feeds": ["6dJY6fNn7q7eYxw8fPqfF7XULg1Wm3v3GJm6M6hQ8B9X"],
    "network": "mainnet-beta",
    "includeReceipts": false
  }'
```

Fetch EVM updates:

```bash
curl "http://localhost:8080/updates/evm/1116/0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c"
```

Fetch a Monad custom-feed payload with the v2 route:

```bash
curl "http://localhost:8080/v2/update/0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812?chain=evm&network=testnet&use_timestamp=true"
```

Discover gateways:

```bash
curl "http://localhost:8080/gateways?network=mainnet"
```

## Public Rate Limits

For `https://crossbar.switchboard.xyz`, rate limiting is layered and route-dependent:

| Surface | Public limit behavior | Source |
| --- | --- | --- |
| Network-level Switchboard oracle requests | Default `20 requests/second` per user wallet; can be increased with stake | [The Switchboard NCN](../../how-it-works/switchboard-protocol/re-staking/the-switchboard-ncn.md) |
| Crossbar public REST (`/updates/*`, gateway/signature routes) | Additional IP-based edge throttling; `429 Too Many Requests` can appear under burst traffic | Public endpoint behavior, observed on March 3, 2026 |
| Surge WebSocket access | Plan-based max connections (`Plug: 1`, `Pro: 10`, `Enterprise: 15`) | [Surge pricing and limits](../../docs-by-chain/solana-svm/surge/README.md) |

Operational guidance:

- Keep update polling conservative on public Crossbar and avoid burst fan-out.
- On `429`, apply exponential backoff with jitter and retry.
- For steady high-throughput workloads, self-host Crossbar.

## Notes

- Some stream and gateway flows require signature/auth headers. See [Surge Gateway Protocol](gateway-protocol.md).
- Endpoint behavior can vary by network and environment configuration.
- Public Crossbar is rate limited by IP. Production systems should self-host.
- For complete machine schema and current field contracts, use `GET /api-docs/openapi.json`.
