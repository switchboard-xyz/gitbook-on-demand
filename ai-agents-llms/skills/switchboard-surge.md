---
name: switchboard-surge
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard Surge Skill

## Purpose

Use Switchboard Surge for low-latency streaming:

- Subscribe to signed updates over WebSocket
- Monitor latency/health and implement reconnection
- Convert signed updates for on-chain settlement (chain-specific)

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/on-demand@3.9.0`
- `@switchboard-xyz/common@5.7.0` (EVM conversion path)
- `@switchboard-xyz/sui-sdk@0.1.14` (Sui conversion path)

## Preconditions

- `OperatorPolicy` exists.
- If creating/modifying a paid subscription, explicit approval is required.

## Inputs to Collect

- subscription wallet/network (Solana)
- symbol/feed list
- target usage: bot-only vs on-chain settlement vs UI display
- validation thresholds (max staleness, deviation checks) if safety-critical

## Minimal Example

~~~ts
const surge = new sb.Surge({ connection, keypair });
await surge.connectAndSubscribe([{ symbol: "BTC/USD" }]);

surge.on("signedPriceUpdate", (update: sb.SurgeUpdate) => {
  if (!update.getLatencyMetrics().isHeartbeat) {
    console.log(update.getFormattedPrices());
  }
});
~~~

## Playbook

### 1) Subscribe to signed updates (TypeScript skeleton)

~~~ts
import * as sb from "@switchboard-xyz/on-demand";

const { keypair, connection } = await sb.AnchorUtils.loadEnv();
const surge = new sb.Surge({ connection, keypair });

await surge.connectAndSubscribe([{ symbol: "BTC/USD" }, { symbol: "SOL/USD" }]);

surge.on("signedPriceUpdate", (update: sb.SurgeUpdate) => {
  const metrics = update.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = update.getFormattedPrices();
  // Use prices + metrics in bot logic
});
~~~

### Subscription

Surge subscriptions are managed **on Solana** via the Surge program (`orac1eFjzWL5R3RbbdMV68K9H6TaCVVcL6LjvQQWAbz`). To subscribe programmatically:

1. **Choose a tier** (Plug/Pro/Enterprise). Tiers are on-chain PDAs.
2. **Acquire SWTCH tokens** (payments are in SWTCH only).
3. **Fetch a fresh SWTCH/USDT oracle quote** and include it in the same transaction.
4. **Call `subscription_init`** with `tier_id` and `epoch_amount`. The program prices the subscription in SWTCH using the live quote and creates your subscription PDA.

Key notes:
- If the keypair has no active subscription, `connectAndSubscribe` fails.
- Tiers and limits are enforced on-chain (max feeds, connections, min delay).
- For UI-free flows, derive PDAs (`STATE`, `TIER`, `SUBSCRIPTION`) and pass required accounts.

Minimal sketch (quote + `subscription_init` in one tx):

~~~ts
import * as sb from "@switchboard-xyz/on-demand";

const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new sb.Crossbar({ rpcUrl: connection.rpcEndpoint, programId: queue.pubkey });

// Fetch SWTCH/USDT quote ixs (feed hash from program state)
const quoteIxs = await queue.fetchQuoteIx(crossbar, [swtchFeedHash], {
  numSignatures: 1,
  payer: keypair.publicKey,
});

const subscriptionInitIx = buildSubscriptionInitIx({ tierId, epochAmount, accounts });

const tx = await sb.asV0Tx({
  connection,
  ixs: [quoteIxs, subscriptionInitIx],
  signers: [keypair],
});

await connection.sendTransaction(tx);
~~~

### Connection Flow (Gateway Auth)

If you are not using the SDK's `surge.connectAndSubscribe(...)`, implement this auth flow directly:

1. **Discover a gateway**
   - `GET https://crossbar.switchboard.xyz/gateways?network=mainnet` (or `devnet`)
2. **Create signature headers**
   - Build message hash: `SHA256("{blockhash}:{timestamp}")`
   - Sign with Ed25519 (your Solana keypair)
   - Send headers:
     - `X-Switchboard-Signature`
     - `X-Switchboard-Pubkey`
     - `X-Switchboard-Blockhash`
     - `X-Switchboard-Timestamp`
3. **Request a stream session**
   - `POST {gateway}/gateway/api/v1/request_stream`
   - Include all `X-Switchboard-*` headers
   - Read `session_token` + `oracle_ws_url` from response
4. **Open authenticated WebSocket**
   - Connect to `oracle_ws_url` with:
     - `Authorization: Bearer {pubkey}:{session_token}`
     - the same `X-Switchboard-*` headers
5. **Subscribe + keepalive**
   - Send a `Subscribe` message (feeds + signature fields)
   - When gateway sends `SignedPing`, reply with `SignedPong` using a **fresh** blockhash + timestamp + signature

Minimal message shape:

~~~json
{
  "type": "Subscribe",
  "feed_bundles": [{ "feeds": [{ "symbol": { "base": "BTC", "quote": "USD" }, "source": "AUTO" }] }],
  "signature_scheme": "Ed25519",
  "pubkey": "<solana-pubkey>",
  "signature": "<ed25519-signature>",
  "blockhash": "<recent-blockhash>",
  "timestamp": "<current-timestamp>"
}
~~~

### 2) Convert for on-chain settlement

- Solana: convert to quote/update instructions and include before consumer ix in the same tx.
- EVM: convert to EVM-compatible bytes and submit via `updateFeeds`.

### 3) Reliability

- heartbeat monitoring
- exponential backoff reconnect
- last-seen tracking and gap detection
- metrics logging

## References

- https://docs.switchboard.xyz/docs-by-chain/solana-svm/surge
- https://docs.switchboard.xyz/ai-agents-llms/surge-subscription-guide
- https://docs.switchboard.xyz/tooling/crossbar/gateway-protocol
- https://docs.switchboard.xyz/docs-by-chain/evm/surge
- https://docs.switchboard.xyz/docs-by-chain/sui/surge
