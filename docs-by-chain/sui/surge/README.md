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
                                               │  • Quote Converter  │
                                               └─────────────────────┘
```

## Key Features

**Unmatched Performance** — Sub-100ms latency with direct WebSocket streaming and event-driven updates. No polling required.

**Zero Setup** — No data feed accounts or on-chain deployment needed. Just use your keypair and connection to start streaming.

**Cost Efficiency** — Subscription-based pricing with no gas fees for receiving updates. Reduced on-chain costs when submitting to contracts.

**Seamless Integration** — TypeScript/JavaScript SDK, WebSocket API for any language, and Sui quote conversion for on-chain use.

**Enterprise-Grade Reliability** — 99.9% uptime SLA with global infrastructure, automatic failover, and professional support.

## Getting Started

### 1. Subscribe

Connect your wallet and subscribe at [explorer.switchboardlabs.xyz/subscriptions](https://explorer.switchboardlabs.xyz/subscriptions).

### 2. Install the SDK

```bash
npm install @switchboard-xyz/on-demand @switchboard-xyz/sui-sdk
# or
yarn add @switchboard-xyz/on-demand @switchboard-xyz/sui-sdk
```

### 3. Connect and Stream

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { convertSurgeUpdateToQuotes, MAINNET_QUEUE_ID } from "@switchboard-xyz/sui-sdk";
import { Transaction } from "@mysten/sui/transactions";

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
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();
  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);
  });

  // Convert to on-chain Oracle Quote for Sui contracts when needed
  const ptb = new Transaction();
  const quoteData = await convertSurgeUpdateToQuotes(ptb, response, MAINNET_QUEUE_ID);

  ptb.moveCall({
    target: `${PACKAGE_ID}::your_module::your_function`,
    arguments: [quoteData],
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
import * as sb from "@switchboard-xyz/on-demand";
import { convertSurgeUpdateToQuotes, MAINNET_QUEUE_ID } from "@switchboard-xyz/sui-sdk";
import { Transaction } from "@mysten/sui/transactions";

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
      const ptb = new Transaction();
      const quoteData = await convertSurgeUpdateToQuotes(ptb, response, MAINNET_QUEUE_ID);
      await executeLiquidations(liquidations, ptb, quoteData);
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

    const ptb = new Transaction();
    const quoteData = await convertSurgeUpdateToQuotes(ptb, this.latestUpdate, MAINNET_QUEUE_ID);

    ptb.moveCall({
      target: `${PACKAGE_ID}::amm::swap`,
      arguments: [amountIn, amountOut, quoteData],
    });

    return await this.client.signAndExecuteTransaction({ transaction: ptb });
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
      const ptb = new Transaction();
      const quoteData = await convertSurgeUpdateToQuotes(ptb, response, MAINNET_QUEUE_ID);
      await executeArbitrage(ptb, quoteData, calculateOptimalSize(spread));
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
        const ptb = new Transaction();
        const quoteData = await convertSurgeUpdateToQuotes(ptb, response, MAINNET_QUEUE_ID);
        await liquidatePosition(position, ptb, quoteData);
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

Yes! Surge updates can be converted to Sui quote format using `convertSurgeUpdateToQuotes()` from the `@switchboard-xyz/sui-sdk` and submitted to your Move contracts.

### What's the reliability?

Surge operates with 99.9% uptime SLA, automatic failover, and global redundancy. Enterprise customers get dedicated infrastructure.

### How do I handle disconnections?

The SDK includes automatic reconnection logic with exponential backoff. Your application will seamlessly recover from network interruptions.

## Next Steps

* [Surge Tutorial](surge-tutorial.md) - Step-by-step implementation guide
* [Crossbar Gateway](../../../tooling/crossbar/README.md) - Stream prices to your frontend
* [Explore code examples](https://github.com/switchboard-xyz/sui)
* [Join our Discord](https://discord.gg/switchboard)
