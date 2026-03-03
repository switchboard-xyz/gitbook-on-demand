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
      {
        "keys": [
          {
            "pubkey": "acf6ac33e6e7ac61fc2753cb2b47461aa25aecf4309b48fd5aec01c9d898d391",
            "isSigner": false,
            "isWritable": true
          },
          {
            "pubkey": "86807068432f186a147cf0b13a30067d386204ea9d6c8b04743ac2ef010b0752",
            "isSigner": false,
            "isWritable": false
          }
        ],
        "programId": "0673bd46f2e47e04f12bd92fb731968ecd9d9757c274da87476f465c040c6573",
        "data": "9616d7a68f5d3089728139110000000001000000761474bfb3cb6c060000000000000000ac95d3645aa39944c6c61ab056d05c27ae359ae45c25108946c7b6fe6e555e0d7ef033918d2ae6887af8bf1d44bd815f5d1a4772e46ffec2d01d01af896476ce0100"
      }
    ],
    "responses": [
      {
        "oracle": "8Vjo4QEbmB9QhhBu6QiTy66G1tw8WomtFVWECMi3a71y",
        "result": 0.46296883458395865,
        "errors": "[]"
      }
    ],
    "lookupTables": [
      "DY5XyWFyLAy9LU2riqbmxZTB5KvQkvzvzTqFiQRpZYFB",
      "GZamopFRG3Nih67i7YdCEdMNRmGVkwXgxn3T3uNfT5YQ"
    ]
  }
]
```

`pullIxns` object schema:

- `keys`: account metas for the instruction.
- `keys[].pubkey`: 32-byte pubkey encoded as lowercase hex (64 chars, no `0x`).
- `keys[].isSigner`: signer flag for that account.
- `keys[].isWritable`: writable flag for that account.
- `programId`: 32-byte program ID encoded as lowercase hex (64 chars, no `0x`).
- `data`: instruction data bytes encoded as lowercase hex.

Required accounts behavior (important):

- There is no separate `requiredAccounts` field for this endpoint.
- The canonical account list is `pullIxns[i].keys`.
- Account order is significant and must be preserved exactly.
- `isSigner` and `isWritable` flags are part of the instruction contract and must be preserved exactly.
- Do not reorder, sort, dedupe, or recompute account metas when reconstructing the instruction.
- `lookupTables` are provided separately for address lookup table usage in versioned transactions; they do not replace `keys`.

Non-JS deserialization flow:

1. Decode hex fields to bytes.
2. Convert `programId` and each `keys[].pubkey` from 32-byte arrays into native pubkey types.
3. Build account metas from `isSigner` + `isWritable` in the same order as returned.
4. Use decoded `data` bytes as instruction payload.

Example (Rust):

```rust
use solana_program::{instruction::{AccountMeta, Instruction}, pubkey::Pubkey};

fn pubkey_from_hex(s: &str) -> anyhow::Result<Pubkey> {
    let bytes = hex::decode(s)?;
    let arr: [u8; 32] = bytes.try_into()
        .map_err(|_| anyhow::anyhow!("expected 32-byte pubkey"))?;
    Ok(Pubkey::new_from_array(arr))
}

fn build_instruction(
    program_id_hex: &str,
    keys: Vec<(String, bool, bool)>,
    data_hex: &str,
) -> anyhow::Result<Instruction> {
    let program_id = pubkey_from_hex(program_id_hex)?;
    let accounts = keys
        .into_iter()
        .map(|(pubkey_hex, is_signer, is_writable)| -> anyhow::Result<AccountMeta> {
            Ok(AccountMeta {
                pubkey: pubkey_from_hex(&pubkey_hex)?,
                is_signer,
                is_writable,
            })
        })
        .collect::<anyhow::Result<Vec<_>>>()?;

    Ok(Instruction {
        program_id,
        accounts,
        data: hex::decode(data_hex)?,
    })
}
```

#### `GET /updates/eclipse/{network}/{feedPubkeys}`

Response schema is the same as `/updates/solana/{network}/{feedPubkeys}`:

- `success`: `bool`
- `pullIxns`: array of instruction objects (`keys`, `programId`, `data`)
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

Discover gateways:

```bash
curl "http://localhost:8080/gateways?network=mainnet"
```

## Notes

- Some stream and gateway flows require signature/auth headers. See [Surge Gateway Protocol](gateway-protocol.md).
- Endpoint behavior can vary by network and environment configuration.
- Public Crossbar is rate limited by IP. Production systems should self-host.
- For complete machine schema and current field contracts, use `GET /api-docs/openapi.json`.
