# Surge

## The Future of Oracle Technology

Switchboard Surge is the industry's fastest oracle data delivery system, providing sub-100ms latency through direct WebSocket streaming. Built for the next generation of DeFi applications, trading systems, and real-time dashboards.

## Key Innovation

Traditional oracles require multiple steps—gathering prices, writing to blockchain state, reaching consensus, and then making data available—resulting in 2-10 seconds of latency.

Switchboard oracles must pass a hardware proof when joining the network, ensuring they run only verified Switchboard code. This allows oracles to stream price data directly from sources to your application via WebSocket, achieving sub-100ms latency.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Price Sources   │────▶│  Oracle Network  │────▶│  Surge Gateway   │
│   (CEX, DEX)     │     │ (SAIL Verified)  │     │   (WebSocket)    │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                          │
                                               ┌──────────▼──────────┐
                                               │   Your Application  │
                                               │  • Event Listeners  │
                                               │  • Price Handlers   │
                                               │  • EVM Converter    │
                                               └─────────────────────┘
```

## Key Features

**Unmatched Performance** — Sub-100ms latency with direct WebSocket streaming and event-driven updates. No polling required.

**Zero Setup** — No data feed accounts or on-chain deployment needed. Just use your keypair and connection to start streaming.

**Cost Efficiency** — Subscription-based pricing with no gas fees for receiving updates. Reduced on-chain costs when submitting to contracts.

**Seamless Integration** — TypeScript/JavaScript SDK, WebSocket API for any language, and EVM format conversion for on-chain use.

**Enterprise-Grade Reliability** — 99.9% uptime SLA with global infrastructure, automatic failover, and professional support.

## User Flow

Surge works the same way regardless of your target chain:

1. **Subscribe** — All Surge subscriptions are managed on Solana, regardless of which chain you're building on. Connect your Solana wallet at the [subscription portal](https://explorer.switchboardlabs.xyz/subscriptions).

2. **Stream Prices** — Once subscribed, prices stream directly to your application via WebSocket. No on-chain reads required—this is what enables sub-100ms latency.

3. **Use Prices** — When you need prices on-chain, convert the Surge update to your chain's format and submit it. Switchboard provides SDKs for Solana, EVM, and Sui.

## Getting Started

### 1. Subscribe

Connect your wallet and subscribe at [explorer.switchboardlabs.xyz/subscriptions](https://explorer.switchboardlabs.xyz/subscriptions).

### 2. Install the SDK

```bash
npm install @switchboard-xyz/on-demand @switchboard-xyz/common
# or
yarn add @switchboard-xyz/on-demand @switchboard-xyz/common
```

### 3. Connect and Stream

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { EVMUtils } from "@switchboard-xyz/common";

// Initialize with keypair and connection (uses on-chain subscription)
const surge = new sb.Surge({ connection, keypair });

// Discover available feeds
const availableFeeds = await surge.getSurgeFeeds();
console.log(`${availableFeeds.length} feeds available`);

// Subscribe to specific feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
]);

// Handle price updates
surge.on('signedPriceUpdate', (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();
  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);

    // Convert to EVM format when needed for on-chain use
    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
  });
});
```

## Pricing & Limits

| Plan | Price | Quote Interval | Max Feeds | Max Connections |
|------|-------|----------------|-----------|-----------------|
| **Plug** | Free | 10s | 2 | 1 |
| **Pro** | ~$3,000/mo | 450ms | 100 | 10 |
| **Enterprise** | ~$7,500/mo | 0ms | 300 | 15 |

Subscriptions are paid in SWTCH tokens. For custom limits or dedicated support, contact [sales@switchboard.xyz](mailto:sales@switchboard.xyz).

## Primary Use Cases

### Perpetual Exchanges

Surge is the perfect oracle solution for perpetual trading platforms:

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  for (const feed of metrics.perFeedMetrics) {
    const price = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));

    // Update mark price instantly
    await updateMarkPrice(feed.symbol, price);

    // Check for liquidations with latest price
    const liquidations = await checkLiquidations(feed.symbol, price);
    if (liquidations.length > 0) {
      const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
      await executeLiquidations(liquidations, evmEncoded);
    }
  }
});
```

### Oracle-Based AMMs

Build the next generation of AMMs that use real-time oracle prices:

```typescript
class OracleAMM {
  private latestUpdate: sb.SurgeUpdate;

  async handlePriceUpdate(response: sb.SurgeUpdate) {
    const metrics = response.getLatencyMetrics();
    if (metrics.isHeartbeat) return;

    this.latestUpdate = response;
    const prices = response.getFormattedPrices();

    for (const feed of metrics.perFeedMetrics) {
      const pair = this.pairs.get(feed.symbol);
      pair.oraclePrice = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));
      pair.lastUpdate = Date.now();
    }
  }

  async executeSwap(tokenIn: string, tokenOut: string, amountIn: number) {
    const pair = `${tokenIn}/${tokenOut}`;
    const latestPrice = this.pairs.get(pair).oraclePrice;
    const amountOut = amountIn * latestPrice * (1 - this.swapFee);

    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(this.latestUpdate.getRawResponse());
    return await this.contract.swap(amountIn, amountOut, evmEncoded);
  }
}
```

### High-Frequency Trading & Arbitrage

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  for (const feed of metrics.perFeedMetrics) {
    const oraclePrice = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));
    const dexPrice = await getDexPrice(feed.symbol);

    const spread = Math.abs(dexPrice - oraclePrice) / oraclePrice;
    if (spread > MIN_PROFIT_THRESHOLD) {
      const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
      await executeArbitrage(evmEncoded, calculateOptimalSize(spread));
    }
  }
});
```

### Liquidation Engines

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  for (const feed of metrics.perFeedMetrics) {
    const price = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));
    const positions = await getPositionsByCollateral(feed.symbol);

    for (const position of positions) {
      const ltv = calculateLTV(position, price);
      if (ltv > LIQUIDATION_THRESHOLD) {
        const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
        await liquidatePosition(position, evmEncoded);
      }
    }
  }
});
```

## Technical Specifications

### Latency Breakdown

* Oracle processing: ~10ms
* Network transmission: ~20-50ms
* Client processing: ~10ms
* **Total: <100ms**

### Discovering Available Feeds

Use the `getSurgeFeeds()` method to see all available trading pairs:

```typescript
const surge = new sb.Surge({ connection, keypair });
const feeds = await surge.getSurgeFeeds();

feeds.forEach(feed => {
  console.log(`${feed.symbol}`);
});
```

### Supported Assets

* All major cryptocurrency pairs
* Multiple exchange sources available
* New pairs added regularly
* Custom feeds available on request

Note: Surge does not support custom feeds created with the [feed builder](https://explorer.switchboardlabs.xyz/feed-builder).

## FAQ

### How is Surge different from traditional oracles?

Surge streams data directly to your application via WebSocket, bypassing the blockchain entirely for reads. This eliminates gas costs and reduces latency from seconds to milliseconds.

### Can I use Surge data on-chain?

Yes! Surge updates can be converted to EVM-compatible format using `EVMUtils.convertSurgeUpdateToEvmFormat()` and submitted to your smart contracts.

### What's the reliability?

Surge operates with 99.9% uptime SLA, automatic failover, and global redundancy. Enterprise customers get dedicated infrastructure.

### How do I handle disconnections?

The SDK includes automatic reconnection logic with exponential backoff. Your application will seamlessly recover from network interruptions.

## Next Steps

* [Surge Tutorial](surge-tutorial.md) - Step-by-step implementation guide
* [Crossbar Gateway](../../../tooling/crossbar/README.md) - Stream prices to your frontend
* [Explore code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* [Join our Discord](https://discord.gg/EyBm9a3bYm)
