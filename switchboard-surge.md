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
- Optionally use unsigned updates for UI/monitoring only

## Preconditions

- `OperatorPolicy` exists.
- If creating/modifying a paid subscription, explicit approval is required.

## Inputs to Collect

- subscription wallet/network (Solana)
- symbol/feed list
- target usage: bot-only vs on-chain settlement vs UI display
- validation thresholds (max staleness, deviation checks) if safety-critical

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

### 2) Convert for on-chain settlement

- Solana: convert to quote/update instructions and include before consumer ix in the same tx.
- EVM: convert to EVM-compatible bytes and submit via `updateFeeds`.

### 3) Unsigned updates (UI only)

- Treat as display-only; do not use for settlement.

### 4) Reliability

- heartbeat monitoring
- exponential backoff reconnect
- last-seen tracking and gap detection
- metrics logging

## References

- https://docs.switchboard.xyz/docs-by-chain/solana-svm/surge
- https://docs.switchboard.xyz/ai-agents-llms/surge-subscription-guide
- https://docs.switchboard.xyz/docs-by-chain/evm/surge
- https://docs.switchboard.xyz/docs-by-chain/sui/surge
