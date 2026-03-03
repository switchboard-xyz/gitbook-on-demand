---
name: switchboard-x402
version: 1.0.3
updated: 2026-02-19
depends_on:
  - switchboard
---

# Switchboard X402 Micropayments Skill

## Purpose

Use X402 micropayments with Switchboard feeds to access any X402-protected resource (premium data APIs, paid RPC, metered endpoints) in a way that:

- generates single-use payment authorization per request
- injects authorization securely at runtime (via variable overrides)
- avoids double-charging during simulation
- keeps sensitive payment material out of stored feed definitions

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/on-demand@3.9.0`
- `@switchboard-xyz/common@5.7.0`
- `@solana/web3.js@1.98.4`

## Preconditions

- `OperatorPolicy` exists (explicit approval for spending, secret handling rules).
- The target endpoint supports X402 and specifies:
  - required header name(s)
  - how signatures are derived (URL/method/body binding)

## Inputs to Collect

- X402-protected endpoint(s): URL, method, and any body/headers that are part of the signature
- funding source (e.g., USDC/SOL wallet) and spend caps
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- whether this feed will be:
  - used atomically (update+use in same tx), or
  - cranked/pushed periodically (generally discouraged for X402 due to cost)

## Key Constraints (from the X402 tutorial)

- **`numSignatures` must be 1**
  - Why: X402 payment signatures are single-use. If more than one oracle tries to use the same payment authorization, subsequent requests fail.
- **Simulation can charge you**
  - Crossbar simulation can trigger the paid HTTP request and charge the payment method.
  - On-chain transaction simulation is safe (does not trigger the HTTP call).
- **Prefer inline feeds**
  - Payment signatures change every request and headers contain sensitive authorization.
  - Storing a static definition on IPFS is generally incompatible with per-request payment authorization.

## Minimal Example

~~~ts
const instructions = await queue.fetchManagedUpdateIxs(crossbar, [ORACLE_FEED], {
  numSignatures: 1,
  instructionIdx: 0,
  payer: keypair.publicKey,
  variableOverrides: {
    X402_PAYMENT_SIGNATURE: paymentSignature,
  },
});
~~~

## Generalized Playbook

### 1) Derive the X402 payment authorization off-chain

- Use the X402 client tooling to derive the payment header/signature.
- The derived authorization must match the exact request (URL, method, and sometimes body).

### 2) Define the Switchboard job with a placeholder header

- Put the payment authorization in an HTTP header as a variable placeholder.
- Use variable overrides to inject the real value at runtime.

Example (conceptual):

~~~json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://paid.example.com/endpoint",
        "method": "POST",
        "headers": [
          { "key": "X-PAYMENT", "value": "${X402_PAYMENT_HEADER}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBlockHeight\"}"
      }
    },
    { "jsonParseTask": { "path": "$.result" } }
  ]
}
~~~

### 3) Execute the update with runtime overrides

- Provide `variableOverrides = { X402_PAYMENT_HEADER: <derived_value> }`
- Enforce `numSignatures = 1` to avoid reuse/failure.

### 4) Cost controls

- Treat each successful oracle HTTP call as a billable event.
- Enforce per-request and daily spend caps.
- Avoid Crossbar simulations against paid endpoints unless explicitly approved.

## Outputs

Produce an `X402IntegrationPlan` including:

- how payment authorization is derived and what request fields it binds to
- job definition template with placeholders
- required runtime overrides
- `numSignatures = 1` constraint and operational implications
- anti-double-charge simulation guidance
- spend cap and monitoring strategy

## References

- https://docs.switchboard.xyz/docs-by-chain/solana-svm/x402/x402-tutorial
- https://docs.switchboard.xyz/custom-feeds/advanced-feed-configuration/data-feed-variable-overrides
- https://docs.switchboard.xyz/tooling/crossbar
