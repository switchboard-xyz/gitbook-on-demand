---
description: Welcome to the Switchboard documentation gitbook!
---

# Switchboard On Demand

## 🌊 Introducing Switchboard Surge

**The fastest oracle data delivery system ever built - Sub-100ms latency WebSocket streaming**

Switchboard Surge represents the future of oracle technology, delivering real-time price feeds directly to your applications with unprecedented speed and efficiency. Whether you're building high-frequency trading systems, real-time dashboards, or latency-critical DeFi protocols, Surge provides the performance edge you need.

### Why Surge?

* **⚡ Ultra-Low Latency**: <100ms from price source to your application
* **🔄 Real-Time Streaming**: WebSocket connections deliver prices as they change
* **💰 Currently FREE**: No cost during launch phase (5 concurrent connections)
* **🔗 Seamless Integration**: Convert streams to on-chain Oracle Quotes instantly
* **🌐 Auto-Reconnect**: Built-in connection recovery
* **📊 Enterprise-Ready**: 99.9% uptime with global infrastructure

### Quick Start with Surge

```typescript
import * as sb from "@switchboard-xyz/on-demand";

// Initialize Surge (two authentication modes supported)
// Option 1: Keypair/connection (default, on-chain subscription)
const surge = new sb.Surge({ connection, keypair, verbose: false });

// Option 2: API key
// const surge = new sb.Surge({ apiKey: process.env.SURGE_API_KEY!, verbose: false });

// Discover available feeds
const feeds = await surge.getSurgeFeeds();
console.log(`${feeds.length} feeds available`);

// Stream real-time prices
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'SOL/USD' }
]);

// Handle price updates
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();
  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);
  });

  // Convert to on-chain Oracle Quote when needed
  if (shouldExecuteTrade(response)) {
    const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
    await executeTrade(crankIxs);
  }
});
```

[Get Started with Surge →](switchboard-surge/surge.md) | [Request API Access](https://tinyurl.com/yqubsr8e)

***

## 📦 Switchboard Oracle Quotes: The New Standard

For on-chain integrations, Switchboard's revolutionary Oracle Quotes method eliminates write locks and reduces costs:

* **No Data Feed Accounts**: Zero setup - no accounts to create or fund
* **No Write Locks**: Unlimited parallelization
* **Currently FREE**: No cost during launch phase (30 requests/min)
* **Instant Setup**: Start using prices immediately
* **Zero Maintenance**: No cranks or upkeep required

[Learn About Oracle Quotes →](oracle-quotes-the-new-standard/oracle-quotes.md)

***

## 🚀 Choose Your Integration Path

### For Real-Time Applications

**Use Surge** for the absolute fastest data delivery:

* **Perpetual exchanges** - Real-time mark prices and liquidations
* **Oracle-based AMMs** - Eliminate impermanent loss with oracle pricing
* High-frequency trading bots
* MEV-sensitive operations

### For Smart Contracts

**Use Oracle Quotes** for efficient on-chain integration:

* DeFi protocols
* Lending platforms
* Perpetual exchanges
* Gaming applications

### For Traditional Use Cases

**Use Standard Feeds** when you need:

* Historical price data
* Shared on-chain state
* Compatibility with existing systems

***

## 🛠️ Quick Links

* [**Surge Documentation**](switchboard-surge/surge.md) - Ultra-low latency WebSocket streaming
* [**Oracle Quote Builder**](https://beta.ondemand.switchboard.xyz/bundle-builder) - Create custom price feeds
* [**GitHub Examples**](https://github.com/switchboard-xyz/sb-on-demand-examples) - Code samples and templates
* [**Discord Community**](https://discord.gg/switchboard) - Get support and connect

***

## 📚 Documentation Overview

### Getting Started

* [Understanding Switchboard](understanding-switchboard/introduction/)
* [Why Switchboard Oracles?](understanding-switchboard/introduction/why-switchboard-oracles.md)
* [Architecture & Security](understanding-switchboard/introduction/switchboards-architecture-tech-stack-and-security/)

### Product Documentation

* [Surge & Oracle Quotes Guide](product-documentation/data-feeds/solana-svm/)
* [Data Feeds](product-documentation/data-feeds/)
* [Randomness](product-documentation/randomness/)
* [Tutorials](product-documentation/tutorials.md)

### Developer Resources

* [Solana/SVM Integration](product-documentation/data-feeds/solana-svm/)
* [EVM Integration](product-documentation/data-feeds/evm/)
* [Crossbar Gateway](tooling-and-resources/crossbar/)
* [SDKs & Documentation](tooling-and-resources/technical-resources-and-documentation/)

### Protocol & Infrastructure

* [Running an Oracle](switchboard-protocol/running-a-switchboard-oracle/)
* [(Re)staking](switchboard-protocol/re-staking/)
* [Tokenomics](broken-reference/)

***

Want our media kit? [See here](https://swbmediakit.notion.site/SWB-MEDIAKIT-1675c392253e40ff9154abc289627202)
