# Bundles and Surge: Next-Generation Oracle Solutions

## Overview

Switchboard introduces two revolutionary approaches to oracle data delivery that dramatically improve performance and reduce costs:

1. **Bundle Method** - Eliminate write locks and reduce costs by 90%
2. **Switchboard Surge** - Ultra-low latency WebSocket streaming with <100ms updates

## 🚀 Bundle Method: The New Standard

### Why are bundles faster than other oracle solutions?

The bundle method represents a paradigm shift in how oracle data is delivered on Solana:

```
Traditional Approach (Higher Cost):
Oracle → Feed Account (write) → Your Program (read)
         ↑ Write Lock Required

Bundle Method (90% Lower Cost):
Oracle → Bundle → Your Program (direct use)
         ↑ No Write Lock!
```

### Key Benefits

| Feature              | Bundle Method | Traditional Feeds |
| -------------------- | ------------- | ----------------- |
| **Transaction Cost** | FREE          | \~0.0001 SOL      |
| **Write Locks**      | None          | Required          |
| **Parallelization**  | Unlimited     | Limited           |
| **Setup Time**       | Instant       | 5-10 minutes      |
| **Maintenance**      | None          | Crank required    |

### How Bundles Work

#### 1. **Stateless Architecture**

* No on-chain accounts to create or maintain
* Prices are verified and used directly in your transaction
* Multiple programs can read the same price simultaneously

#### 2. **Efficient Signature Verification**

```typescript
// Fetch the latest price bundle
const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(gateway, crossbar, [
  feedHash1,
  feedHash2,
  // ... batch multiple feeds
]);

// Create transaction with both instructions
const tx = await asV0Tx({
  connection,
  ixs: [
    sigVerifyIx,        // Verify oracle signatures via precompile
    yourProgramIx       // Use verified prices immediately
  ],
  signers: [keypair],
});
```

#### 3. **On-Chain Verification**

```rust
let verified_bundle = BundleVerifierBuilder::from(&bundle)
    .queue(&queue)
    .slothash_sysvar(&slothashes)
    .ix_sysvar(&instructions)
    .clock(&Clock::get()?)
    .max_age(50) // Maximum age in slots
    .verify()
    .unwrap();

// Extract verified price
let price = verified_bundle.feed(FEED_HASH)?.value();
```

### Bundle Size Optimization

Understanding bundle sizes helps optimize your transactions:

**Base Formula**: `Total bytes = 34 + (n × 96) + (m × 49)`

Where:

* `n` = number of oracles
* `m` = number of feeds

**Examples:**

* 1 oracle, 1 feed: \~179 bytes
* 3 oracles, 5 feeds: \~563 bytes
* 3 oracles, 10 feeds: \~812 bytes

### Quick Start with Bundles

```bash
# Clone the examples repository
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/solana

# Install dependencies
bun install

# Run with your feed hash
bun run scripts/runBundle.ts --feedHash YOUR_FEED_HASH
```

## 🌊 Switchboard Surge: Ultra-Low Latency Streaming

### What is Surge?

Surge is a premium WebSocket streaming service delivering oracle updates with unprecedented speed:

```
Data Flow Timeline:
Oracle → Surge Gateway: ~10ms
Gateway → Your App: ~20-50ms
Total Latency: <100ms (vs 1000ms+ for traditional)
```

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Price Sources  │────▶│  Oracle Network │────▶│  Surge Gateway  │
│  (CEX, DEX)     │     │                 │     │   (WebSocket)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                              ┌──────────▼──────────┐
                                              │  Your Application   │
                                              │ • Event Listeners   │
                                              │ • Price Handlers    │
                                              │ • Bundle Converter  │
                                              └─────────────────────┘
```

### Key Features

* **Sub-100ms Latency**: Direct oracle-to-client streaming
* **Event-Driven**: Receive updates as prices change
* **No Polling**: Persistent WebSocket eliminates overhead
* **Bundle Compatible**: Convert streams to on-chain bundles seamlessly

### Surge Implementation

```typescript
import * as sb from "@switchboard-xyz/on-demand";

// Initialize Surge client
const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
  gatewayUrl: 'wss://surge.switchboard.xyz/mainnet',
});

// Subscribe to price feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USDT', source: 'BINANCE' },
  { symbol: 'SOL/USDT', source: 'COINBASE' },
]);

// Handle real-time updates
surge.on('update', async (response: sb.SurgeUpdate) => {
  console.log(`${response.data.symbol}: $${response.data.price}`);
  console.log(`Latency: ${Date.now() - response.data.source_ts_ms}ms`);
  
  // Option 1: Use price directly
  await updatePriceDisplay(response.data);
  
  // Option 2: Convert to on-chain bundle
  if (shouldExecuteTrade(response)) {
    const [sigVerifyIx, bundle] = response.toBundleIx();
    await executeTrade(sigVerifyIx, bundle);
  }
});
```

### Use Case Examples

#### High-Frequency Trading

```typescript
surge.on('update', async (response) => {
  const opportunity = checkArbitrage(response.data);
  if (opportunity?.profit > MIN_PROFIT) {
    // Execute within milliseconds
    const [ix, bundle] = response.toBundleIx();
    await executeArbitrageTrade(ix, bundle);
  }
});
```

#### Real-Time Dashboards

```typescript
surge.on('update', (response) => {
  // Instant UI updates
  priceDisplay[response.data.symbol] = response.data.price;
  metrics.latency = Date.now() - response.data.source_ts_ms;
});
```

#### MEV Protection

```typescript
surge.on('update', async (response) => {
  if (response.data.price <= targetPrice) {
    // Submit at optimal moment
    const tx = await createLimitOrder(response);
    await sendWithMevProtection(tx);
  }
});
```

## Choosing the Right Solution

| Use Case           | Surge 🌊     | Bundles 📦 | Traditional |
| ------------------ | ------------ | ---------- | ----------- |
| **HFT Bots**       | ✅ Best       | ✅ Good     | ❌ Too Slow  |
| **DeFi Protocols** | ✅ Good       | ✅ Best     | ✅ Works     |
| **Real-time Apps** | ✅ Best       | ✅ Good     | ❌ Too Slow  |
| **Analytics**      | ✅ Good       | ✅ Good     | ✅ Best      |
| **Latency**        | <100ms       | <1s        | 2-10s       |
| **Cost Model**     | Subscription | Per TX     | Per Update  |

### When to Use Bundles

* Smart contract integrations
* DeFi protocols requiring multiple price points
* Cost-sensitive applications
* Standard trading applications

### When to Use Surge

* High-frequency trading systems
* Real-time price displays
* Latency-critical applications
* MEV-sensitive operations

## Getting Started

### For Bundles

1. Get a feed hash from [Switchboard On-Demand](https://ondemand.switchboard.xyz)
2. Use the bundle examples: [GitHub Repository](https://github.com/switchboard-xyz/sb-on-demand-examples)
3. Integrate into your program using the verification pattern

### For Surge

1. Contact Switchboard team for API access
2. Set up WebSocket connection with your API key
3. Subscribe to desired price feeds
4. Handle updates in your application

## Next Steps

* Explore the [complete examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* Read about [on-chain integration](integrating-your-feed-on-chain.md)
* Learn about [feed design](part-1-designing-and-simulating-your-feed/)
* Join our [Discord](https://discord.gg/switchboard) for support
