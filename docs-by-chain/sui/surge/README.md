# Surge Price Feeds

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

### Unmatched Performance

* **Sub-100ms latency** from price source to your application
* **Direct streaming** eliminates blockchain bottlenecks
* **Event-driven updates** deliver prices as they change
* **No polling overhead** with persistent WebSocket connections

### Zero Setup

* **No data feed accounts** to create or manage
* **No on-chain deployment** required
* **Instant access** with just an API key

### Cost Efficiency

* **Subscription-based pricing** - pay for what you use
* **No gas fees** for receiving updates
* **Reduced on-chain costs** when submitting to contracts
* **Enterprise pricing** available for high-volume users

## Getting Started

### 1. Request API Access

Get your Surge API key: [https://tinyurl.com/yqubsr8e](https://tinyurl.com/yqubsr8e)

* **Approval time**: ~3 days
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
});

// Get all available Surge feeds
const availableFeeds = await surge.getSurgeFeeds();
console.log('Available feeds:', availableFeeds);

// Subscribe to specific feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
]);

surge.on('update', (response: sb.SurgeUpdate) => {
  console.log(`${response.data.symbol}: $${response.data.price}`);
});
```

## Next Steps

* [Surge Tutorial](surge-tutorial.md) - Step-by-step implementation guide
* [Explore code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* [Join our Discord](https://discord.gg/switchboard)
* [Request API access](https://tinyurl.com/yqubsr8e)
