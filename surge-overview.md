# 🌊 Surge Overview

## The Future of Oracle Technology

Switchboard Surge is the industry's fastest oracle data delivery system, providing sub-100ms latency through direct WebSocket streaming. Built for the next generation of DeFi applications, trading systems, and real-time dashboards.

## Why Surge Changes Everything

### Traditional Oracle Flow (Slow)

```
Price Source → Oracle → Blockchain Write → Your App Reads
Total Latency: 2-10 seconds
```

### Surge Flow (Lightning Fast)

```
Price Source → Oracle → Direct WebSocket → Your App
Total Latency: <100ms
```

## Key Features

### ⚡ Unmatched Performance

* **Sub-100ms latency** from price source to your application
* **Direct streaming** eliminates blockchain bottlenecks
* **Event-driven updates** deliver prices as they change
* **No polling overhead** with persistent WebSocket connections

### 🎯 Zero Setup

* **No data feed accounts** to create or manage
* **No on-chain deployment** required
* **No SOL funding** needed for accounts
* **Instant access** with just an API key

### 💰 Cost Efficiency

* **Subscription-based pricing** - pay for what you use
* **No gas fees** for receiving updates
* **Reduced on-chain costs** when converting to Oracle Quotes
* **Enterprise pricing** available for high-volume users

### 🔗 Seamless Integration

* **Simple SDK** with TypeScript/JavaScript support
* **WebSocket API** for any programming language
* **Oracle Quote conversion** for on-chain use when needed
* **Crossbar gateway** for frontend integration

### 🛡️ Enterprise-Grade Reliability

* **99.9% uptime SLA** for production applications
* **Global infrastructure** with multiple regions
* **Automatic failover** and redundancy
* **Professional support** available

## Primary Use Cases

### 📈 Perpetual Exchanges

Surge is the perfect oracle solution for perpetual trading platforms, providing the ultra-low latency needed for:

```typescript
// Real-time mark price updates for perpetuals
surge.on('update', async (response: sb.SurgeUpdate) => {
  // Update mark price instantly
  await updateMarkPrice(response.data.symbol, response.data.price);
  
  // Check for liquidations with latest price
  const liquidations = await checkLiquidations(response.data);
  if (liquidations.length > 0) {
    await executeLiquidations(liquidations);
  }
  
  // Update funding rates
  await calculateFundingRate(response.data);
});

// Example: Drift-style perpetual integration
class PerpetualExchange {
  async handlePriceUpdate(update: sb.SurgeUpdate) {
    const market = this.markets.get(update.data.symbol);
    
    // Update oracle price
    market.oraclePrice = update.data.price;
    market.oracleSlot = update.data.slot;
    
    // Trigger liquidations if needed
    const underwaterPositions = await this.findUnderwaterPositions(market);
    for (const position of underwaterPositions) {
      if (this.isLiquidatable(position, market.oraclePrice)) {
        await this.liquidatePosition(position);
      }
    }
    
    // Update AMM curve based on new oracle price
    await this.updateAmmCurve(market);
  }
}
```

### 🔄 Oracle-Based AMMs

Build the next generation of AMMs that use real-time oracle prices instead of liquidity pools:

```typescript
// Oracle AMM with instant price discovery
class OracleAMM {
  constructor(private surge: sb.Surge) {
    // Subscribe to all trading pairs
    surge.on('update', this.handlePriceUpdate.bind(this));
  }
  
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
    
    // Convert to Oracle Quote for on-chain execution
    const [sigVerifyIx, oracleQuote] = this.latestUpdate.toBundleIx();
    
    return await this.program.methods
      .swap(amountIn, amountOut, oracleQuote)
      .accounts({
        amm: this.ammPda,
        queue: this.queuePubkey,
        // ... other accounts
      })
      .preInstructions([sigVerifyIx])
      .rpc();
  }
}
```

### High-Frequency Trading & Arbitrage

```typescript
// Capitalize on price discrepancies across venues
surge.on('update', async (response: sb.SurgeUpdate) => {
  const dexPrice = await getDexPrice(response.data.symbol);
  const oraclePrice = response.data.price;
  
  const spread = Math.abs(dexPrice - oraclePrice) / oraclePrice;
  if (spread > MIN_PROFIT_THRESHOLD) {
    await executeArbitrage({
      symbol: response.data.symbol,
      dexPrice,
      oraclePrice,
      size: calculateOptimalSize(spread)
    });
  }
});
```

### Liquidation Engines

```typescript
// Instant liquidations for lending protocols
surge.on('update', async (response: sb.SurgeUpdate) => {
  const positions = await getPositionsByCollateral(response.data.symbol);
  
  for (const position of positions) {
    const ltv = calculateLTV(position, response.data.price);
    if (ltv > LIQUIDATION_THRESHOLD) {
      // Execute liquidation with fresh oracle price
      const [ix, oracleQuote] = response.toBundleIx();
      await liquidatePosition(position, ix, oracleQuote);
    }
  }
});
```

## Getting Started

### 1. Request API Access

Get your Surge API key: [https://tinyurl.com/yqubsr8e](https://tinyurl.com/yqubsr8e)

* **Approval time**: \~3 days
* **Requirements**: None - open to all developers
* **Waitlist**: Yes, processed on first-come basis

### 2. Install the SDK

```bash
npm install @switchboard-xyz/on-demand
# or
yarn add @switchboard-xyz/on-demand
```

### 3. Connect and Stream

```typescript
import * as sb from "@switchboard-xyz/on-demand";

const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
  // Leave gatewayUrl empty for automatic default selection
});

// Get all available Surge feeds
const availableFeeds = await surge.getSurgeFeeds();
console.log('Available feeds:', availableFeeds);

// Subscribe to specific feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
  { symbol: 'SOL/USD' }
]);

surge.on('update', (response: sb.SurgeUpdate) => {
  console.log(`${response.data.symbol}: $${response.data.price}`);
});
```

## Pricing & Limits

### Current Pricing (Launch Phase)

* **Surge API**: FREE during launch phase
* **Oracle Quotes**: FREE during launch phase

### Rate Limits

* **Surge**: 5 concurrent WebSocket connections per API key
* **Oracle Quotes**: 30 requests per minute
* **Auto-reconnect**: Built-in automatic reconnection on disconnect

### Future Pricing

* Developer, Professional, and Enterprise tiers coming soon
* Early adopters will receive special pricing

Contact for enterprise needs: [sales@switchboard.xyz](mailto:sales@switchboard.xyz)

## How is Surge So Fast?

Surge capitalizes on Switchboard's SAIL framework to verify a hardware proof of the oracle upon joining the network, proving the oracle signing prices is only running verified Switchboard code. This oracle then streams directly from price discovery sources without needing to report state to any middleware layer like its own L1.

### Traditional Pull Oracles vs Surge

**Traditional Pull Oracles:**

1. Gather price information
2. Write to a state layer
3. Come to consensus
4. Then make data available

**Surge:**

1. Verifies a hardware proof on bootup to prove its legitimacy and unalterability
2. Streams directly to users from price sources
3. No middleware layer needed
4. No consensus delays

This architecture eliminates multiple steps that add latency in traditional oracle systems, enabling true sub-100ms performance.

## Technical Specifications

### Latency Breakdown

* Oracle processing: \~10ms
* Network transmission: \~20-50ms
* Client processing: \~10ms
* **Total: <100ms**

### Discovering Available Feeds

Use the `getSurgeFeeds()` method to see all available trading pairs:

```typescript
const surge = new sb.Surge({ apiKey: YOUR_API_KEY });
const feeds = await surge.getSurgeFeeds();

// Example output format
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

Yes! Surge updates can be converted to Oracle Quote format for on-chain use with a simple SDK call: `response.toBundleIx()`

### What's the reliability?

Surge operates with 99.9% uptime SLA, automatic failover, and global redundancy. Enterprise customers get dedicated infrastructure.

### How do I handle disconnections?

The SDK includes automatic reconnection logic with exponential backoff. Your application will seamlessly recover from network interruptions.

## Next Steps

* [Explore code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* [Join our Discord](https://discord.gg/switchboard)
* [Request API access](https://tinyurl.com/yqubsr8e)
