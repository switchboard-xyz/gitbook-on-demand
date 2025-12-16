# Getting Started with Surge

## Overview

Switchboard Surge is the industry's fastest oracle data delivery system, providing sub-100ms latency through direct WebSocket streaming. Built for perpetual exchanges, oracle-based AMMs, and high-frequency trading systems.

### 🚀 Zero Setup Required

Just like Oracle Quotes, Surge requires **NO data feed accounts**:

* ❌ No need to create on-chain feed accounts
* ❌ No need to deploy or manage contracts
* ❌ No need to fund accounts with SOL
* ✅ Just get an API key and start streaming prices instantly!

## How is Surge So Fast?

Surge capitalizes on Switchboard's SAIL framework to verify a hardware proof of the oracle upon joining the network, proving the oracle signing prices is only running verified Switchboard code. This oracle then streams directly from price discovery sources without needing to report state to any middleware layer like its own L1.

Other pull oracles gather price information, write to a state layer, and come to consensus. Surge verifies a hardware proof on bootup to prove its legitimacy and unalterability and streams directly to users.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Price Sources  │────▶│  Oracle Network │────▶│  Surge Gateway  │
│  (CEX, DEX)     │     │   (SAIL Verified)│     │   (WebSocket)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                              ┌──────────▼──────────┐
                                              │  Your Application   │
                                              │ • Event Listeners   │
                                              │ • Price Handlers    │
                                              │ • Oracle Quote Converter │
                                              └─────────────────────┘
```

## Key Features

* **Sub-100ms Latency**: Direct oracle-to-client streaming
* **Event-Driven**: Receive updates as prices change
* **No Polling**: Persistent WebSocket eliminates overhead
* **Oracle Quote Compatible**: Convert streams to on-chain Oracle Quotes seamlessly
* **Auto-Reconnect**: Built-in connection recovery

## Implementation

```typescript
import * as sb from "@switchboard-xyz/on-demand";

// Initialize Surge client
// Two authentication modes are supported:

// Option 1: Keypair/connection (default, on-chain subscription)
const surge = new sb.Surge({
  connection,
  keypair,
  verbose: false,
});

// Option 2: API key
const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
  verbose: false,
});

// Discover available feeds
const availableFeeds = await surge.getSurgeFeeds();
console.log(`Found ${availableFeeds.length} available feeds`);

// Subscribe to price feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'SOL/USD' },
]);

// Handle real-time updates
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const prices = response.getFormattedPrices();   // { "BTC/USD": "$89,868.62" }
  const metrics = response.getLatencyMetrics();   // Detailed timing breakdown

  // Check update type (heartbeat vs price change)
  if (metrics.isHeartbeat) {
    // No price change, just keeping connection alive
    return;
  }

  // Log bundle-level metrics
  console.log(`Emit Latency: ${metrics.emitLatencyMs}ms`);
  console.log(`Oracle → Client: ${metrics.oracleBroadcastToClientMs}ms`);

  // Per-feed metrics
  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);
    console.log(`  Source → Oracle: ${feed.sourceToOracleMs}ms`);
  });

  // Convert to on-chain Oracle Quote when needed
  if (shouldExecuteTrade(response)) {
    const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
    await executeTrade(crankIxs);
  }
});
```

## Primary Use Cases

### 📈 Perpetual Exchanges

```typescript
// Real-time mark price updates for perpetuals
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  for (const feed of metrics.perFeedMetrics) {
    const market = perpetuals.get(feed.symbol);

    // Update mark price instantly
    market.markPrice = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));

    // Check liquidations with zero latency
    const underwaterPositions = await market.checkLiquidations(market.markPrice);
    for (const position of underwaterPositions) {
      const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
      await liquidatePosition(position, crankIxs);
    }
  }
});
```

### 🔄 Oracle-Based AMMs

```typescript
// Next-gen AMM using oracle prices (no impermanent loss)
class OracleAMM {
  private latestUpdate: sb.SurgeUpdate;

  async handlePriceUpdate(response: sb.SurgeUpdate) {
    const metrics = response.getLatencyMetrics();
    if (metrics.isHeartbeat) return;

    this.latestUpdate = response;
    const prices = response.getFormattedPrices();

    // Update pricing curve with oracle data
    for (const feed of metrics.perFeedMetrics) {
      this.pairs[feed.symbol] = {
        price: parseFloat(prices[feed.feed_hash].replace(/[$,]/g, '')),
        timestamp: Date.now()
      };
    }
  }

  async swap(tokenA: string, tokenB: string, amount: number) {
    const price = this.pairs[`${tokenA}/${tokenB}`].price;
    const output = amount * price * (1 - FEE);

    // Use Oracle Quote for on-chain verification
    const crankIxs = this.latestUpdate.toQuoteIx(queue.pubkey, keypair.publicKey);
    return await executeSwap(crankIxs, output);
  }
}
```

### High-Frequency Trading

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();
  for (const feed of metrics.perFeedMetrics) {
    const price = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));
    const opportunity = checkArbitrage(feed.symbol, price);

    if (opportunity?.profit > MIN_PROFIT) {
      // Execute within milliseconds
      const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
      await executeArbitrageTrade(crankIxs);
    }
  }
});
```

## Using Crossbar to Stream Surge Prices to Your UI

### What is Crossbar?

Crossbar is Switchboard's local gateway service that enables you to stream real-time oracle prices directly to your frontend applications.

### Setting Up Crossbar

```bash
# Using Docker Compose (recommended)
git clone https://github.com/switchboard-xyz/crossbar
cd crossbar
docker-compose up -d

# Crossbar will be available at:
# HTTP: http://localhost:8080
# WebSocket: ws://localhost:8080/ws
```

### Frontend Integration

```typescript
// React example with real-time price updates
import { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  source_ts_ms: number;
  feedHash: string;
}

export function PriceFeed({ symbol }: { symbol: string }) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080/ws');
    
    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'subscribe',
        feeds: [symbol]
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update' && data.symbol === symbol) {
        setPriceData({
          symbol: data.symbol,
          price: data.price,
          source_ts_ms: data.source_ts_ms,
          feedHash: data.feedHash
        });
      }
    };

    return () => websocket.close();
  }, [symbol]);

  if (!priceData) return <div>Loading...</div>;

  return (
    <div className="price-feed">
      <h3>{priceData.symbol}</h3>
      <div className="price">${priceData.price.toFixed(2)}</div>
      <div className="latency">
        Latency: {Date.now() - priceData.source_ts_ms}ms
      </div>
    </div>
  );
}
```

## Using Surge on Sui

On Sui, Switchboard Surge updates can be used to get low-latency, low-cost feeds running. Watch price streams with sub-300ms latency, and trigger updates when necessary.

Convert streaming prices directly into on-chain oracle **Quotes** for smart contract integration:

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { convertSurgeUpdateToQuotes, MAINNET_QUEUE_ID } from "@switchboard-xyz/sui-sdk";

const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
});

// Subscribe to price feeds
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
]);

// Handle real-time updates and convert to Sui quotes
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();
  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);
  });

  // Convert to on-chain Oracle Quote for Sui contracts
  const ptb = new Transaction();
  const quoteData = await convertSurgeUpdateToQuotes(ptb, response, MAINNET_QUEUE_ID);

  // Add your Sui contract call with the quote data
  ptb.moveCall({
    target: `${PACKAGE_ID}::your_module::your_function`,
    arguments: [quoteData],
  });
});
```

Find the source and examples for integrating Sui in the [Switchboard Github](https://github.com/switchboard-xyz/sui?tab=readme-ov-file#oracle-quote-integration-new---october-2025-switchboard-upgrade).

## Current Limits & Pricing

* **Cost**: FREE during launch phase
* **Rate Limits**: 5 concurrent WebSocket connections per API key
* **Auto-reconnect**: Built-in automatic reconnection on disconnect
* **Approval Time**: \~3 days for API key
* **Requirements**: None - open to all developers

## Getting Started

1. Request API access: [https://tinyurl.com/yqubsr8e](https://tinyurl.com/yqubsr8e)
   * Approval time: \~3 days
   * No requirements - open to all
   * Currently FREE with 5 concurrent connections
2. Set up WebSocket connection with your API key
3. Subscribe to desired price feeds
4. Auto-reconnection is handled automatically

## FAQ

### How is Surge different from Oracle Quotes?

Surge streams data directly to your application via WebSocket for real-time use. Oracle Quotes are for on-chain smart contract integration. You can convert Surge updates to Oracle Quotes when needed.

### What happens on disconnect?

The SDK includes automatic reconnection logic with exponential backoff. Your application will seamlessly recover from network interruptions.

### Can I use custom feeds?

Contact the Switchboard team for custom feed requests.

## Next Steps

* Explore [code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* Learn about [Crossbar gateway](../tooling-and-resources/crossbar/)
* Join our [Discord](https://discord.gg/switchboard) for support
