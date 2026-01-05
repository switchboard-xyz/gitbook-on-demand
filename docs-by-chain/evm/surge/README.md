# Surge

## The Future of Oracle Technology

Switchboard Surge is the industry's fastest oracle data delivery system, providing sub-100ms latency through direct WebSocket streaming. Built for the next generation of DeFi applications, trading systems, and real-time dashboards.

## Surge's Key Innovation

Traditional oracles require multiple steps—gathering prices, writing to blockchain state, reaching consensus, and then making data available—resulting in 2-10 seconds of latency.

Switchboard oracles must pass a hardware proof when joining the network, ensuring they run only verified Switchboard code. This allows oracles to stream price data directly from sources to your application via WebSocket, achieving sub-100ms latency.

## Architecture

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

**Zero Setup** — No data feed accounts or on-chain deployment needed. Just grab an API key and start streaming.

**Cost Efficiency** — Subscription-based pricing with no gas fees for receiving updates. Reduced on-chain costs when submitting to contracts.

**Seamless Integration** — TypeScript/JavaScript SDK, WebSocket API for any language, and EVM format conversion for on-chain use.

**Enterprise-Grade Reliability** — 99.9% uptime SLA with global infrastructure, automatic failover, and professional support.

## Primary Use Cases

### Perpetual Exchanges

Surge is the perfect oracle solution for perpetual trading platforms:

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  // Update mark price instantly
  await updateMarkPrice(response.data.symbol, response.data.price);

  // Check for liquidations with latest price
  const liquidations = await checkLiquidations(response.data);
  if (liquidations.length > 0) {
    // Convert to EVM format and submit
    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
    await executeLiquidations(liquidations, evmEncoded);
  }
});
```

### Oracle-Based AMMs

Build the next generation of AMMs that use real-time oracle prices:

```typescript
class OracleAMM {
  async handlePriceUpdate(response: sb.SurgeUpdate) {
    // Update AMM pricing curve with oracle data
    const pair = this.pairs.get(response.data.symbol);
    pair.oraclePrice = response.data.price;
    pair.lastUpdate = response.data.source_ts_ms;

    // No impermanent loss - prices come from oracles
    await this.updatePricingCurve(pair);
  }

  async executeSwap(tokenIn: string, tokenOut: string, amountIn: number) {
    const pair = `${tokenIn}/${tokenOut}`;
    const latestPrice = this.pairs.get(pair).oraclePrice;

    // Calculate output using oracle price
    const amountOut = amountIn * latestPrice * (1 - this.swapFee);

    // Convert to EVM format for on-chain execution
    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(this.latestUpdate);
    return await this.contract.swap(amountIn, amountOut, evmEncoded);
  }
}
```

### High-Frequency Trading & Arbitrage

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const dexPrice = await getDexPrice(response.data.symbol);
  const oraclePrice = response.data.price;

  const spread = Math.abs(dexPrice - oraclePrice) / oraclePrice;
  if (spread > MIN_PROFIT_THRESHOLD) {
    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
    await executeArbitrage(evmEncoded, calculateOptimalSize(spread));
  }
});
```

### Liquidation Engines

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const positions = await getPositionsByCollateral(response.data.symbol);

  for (const position of positions) {
    const ltv = calculateLTV(position, response.data.price);
    if (ltv > LIQUIDATION_THRESHOLD) {
      const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
      await liquidatePosition(position, evmEncoded);
    }
  }
});
```

## Getting Started

### 1. Sign Up

Connect your wallet and subscribe at [explorer.switchboardlabs.xyz/subscriptions](https://explorer.switchboardlabs.xyz/subscriptions) to get your Surge API key.

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

const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
});

// Get all available Surge feeds
const availableFeeds = await surge.getSurgeFeeds();
console.log('Available feeds:', availableFeeds);

// Subscribe to specific feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
]);

surge.on('signedPriceUpdate', (response: sb.SurgeUpdate) => {
  console.log(`${response.data.symbol}: $${response.data.price}`);

  // Convert to EVM format when needed
  const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(response.getRawResponse());
});
```

## Pricing & Limits

| Plan | Price | Quote Interval | Max Feeds | Max Connections |
|------|-------|----------------|-----------|-----------------|
| **Plug** | Free | 10s | 2 | 1 |
| **Pro** | ~$3,000/mo | 450ms | 100 | 10 |
| **Enterprise** | ~$7,500/mo | 0ms | 300 | 15 |

Subscriptions are paid in SWTCH tokens. For custom limits or dedicated support, contact [sales@switchboard.xyz](mailto:sales@switchboard.xyz).

## Technical Specifications

### Latency Breakdown

* Oracle processing: ~10ms
* Network transmission: ~20-50ms
* Client processing: ~10ms
* **Total: <100ms**

### Discovering Available Feeds

Use the `getSurgeFeeds()` method to see all available trading pairs:

```typescript
const surge = new sb.Surge({ apiKey: YOUR_API_KEY });
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
* [Join our Discord](https://discord.gg/switchboard)
* [Request API access](https://tinyurl.com/yqubsr8e)
