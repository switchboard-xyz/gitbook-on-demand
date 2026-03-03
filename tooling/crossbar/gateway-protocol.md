# Surge Gateway Protocol

Surge provides low-latency price streaming via the Crossbar gateway. This page documents the HTTP + WebSocket protocol for clients that cannot use the SDK or need custom integrations.

## When to use this protocol

- You are implementing a non-JS client (Rust/Go/Python/etc.).
- You are running custom infrastructure and need direct gateway control.
- You are debugging auth/session issues or connection failures.
- You are building a load-testing or monitoring client.

## Prerequisites

Before calling `request_stream`, the Solana pubkey you authenticate with must have an **active on-chain Surge subscription**.

- Subscriptions are managed on Solana and paid in `SWTCH` tokens (except free-tier cases where payment can be zero, but subscription initialization is still required).
- If there is no active subscription for your pubkey, `POST /gateway/api/v1/request_stream` will fail even when signatures, blockhash, and timestamps are valid.
- Subscription setup guide: [Surge Subscription Guide](../../ai-agents-llms/surge-subscription-guide.md).
- Explorer subscription UI: [explorer.switchboardlabs.xyz/subscriptions](https://explorer.switchboardlabs.xyz/subscriptions).

## Protocol Overview

1. Discover a gateway endpoint.
2. Create signature headers.
3. Request a streaming session.
4. Open the WebSocket with auth headers.
5. Send a Subscribe message.
6. Receive bundled price updates.
7. Respond to keepalive pings.

---

## 1. Gateway discovery

Mainnet:

```
GET https://crossbar.switchboard.xyz/gateways?network=mainnet
```

Devnet:

```
GET https://crossbar.switchboard.xyz/gateways?network=devnet
```

The response returns one or more gateway base URLs. Choose one and use it for the session request.

---

## 2. Signature headers

For every HTTP and WebSocket request, you must include signature headers derived from a recent Solana blockhash and current timestamp.

**Message to sign**

```
SHA256("{blockhash}:{timestamp}")
```

Sign the hash with **Ed25519** using your Solana keypair.

**Required headers**

- `X-Switchboard-Signature` — Ed25519 signature of the hash
- `X-Switchboard-Pubkey` — Solana public key
- `X-Switchboard-Blockhash` — recent Solana blockhash
- `X-Switchboard-Timestamp` — current timestamp

Notes:
- Use a **fresh blockhash and timestamp** for each request.
- Keep client time in sync (clock skew can cause auth failures).

---

## 3. Session request

```
POST {gateway}/gateway/api/v1/request_stream
```

Include the signature headers. The response contains:

- `session_token`
- `oracle_ws_url`

---

## 4. WebSocket connection

Open a WebSocket connection to `oracle_ws_url` with:

- `Authorization: Bearer {pubkey}:{session_token}`
- The same signature headers (`X-Switchboard-*`)

---

## 5. Subscribe message

Send a `Subscribe` message after connecting:

```json
{
  "type": "Subscribe",
  "feed_bundles": [
    {
      "feeds": [
        {
          "symbol": { "base": "BTC", "quote": "USD" },
          "source": "AUTO"
        }
      ]
    }
  ],
  "signature_scheme": "Ed25519",
  "pubkey": "<your-solana-pubkey>",
  "signature": "<ed25519-signature>",
  "blockhash": "<recent-solana-blockhash>",
  "timestamp": "<current-timestamp>"
}
```

---

## 6. Price updates

The gateway sends **BundledFeedUpdate** messages. Each update includes `feed_values[]` entries. The `value` field is an **18-decimal big-integer string** (no decimal point). Convert it to a decimal value by dividing by `1e18` (e.g., `\"67335320000000000000000\"` → `67335.32`).

If you're using the SDK, helpers like `getFormattedPrices()` already apply this scaling for you. Only raw consumers need to handle the `1e18` divisor.

---

## 7. Keepalive

The gateway may send a `SignedPing`. Respond with a `SignedPong` that includes a **fresh signature** (new blockhash + timestamp):

```json
{
  "type": "SignedPong",
  "signature_scheme": "Ed25519",
  "pubkey": "<your-solana-pubkey>",
  "signature": "<ed25519-signature>",
  "blockhash": "<recent-solana-blockhash>",
  "timestamp": "<current-timestamp>"
}
```

---

## Error handling and reconnects

Common causes of disconnects or auth errors:

- Invalid signature
- Expired timestamp
- Stale blockhash
- Invalid or expired session token

On failure, request a new session and reconnect with fresh signatures.
