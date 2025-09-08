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
const surge = new sb.Surge({
  apiKey: process.env.SURGE_API_KEY!,
  // gatewayUrl is optional - leave empty for automatic selection
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
  console.log(`${response.data.symbol}: $${response.data.price}`);
  console.log(`Latency: ${Date.now() - response.data.source_ts_ms}ms`);
  
  // Option 1: Use price directly
  await updatePriceDisplay(response.data);
  
  // Option 2: Convert to on-chain Oracle Quote
  if (shouldExecuteTrade(response)) {
    const [sigVerifyIx, oracleQuote] = response.toBundleIx();
    await executeTrade(sigVerifyIx, oracleQuote);
  }
});
```

## Primary Use Cases

### 📈 Perpetual Exchanges

```typescript
// Real-time mark price updates for perpetuals
surge.on('update', async (response: sb.SurgeUpdate) => {
  const market = perpetuals.get(response.data.symbol);
  
  // Update mark price instantly
  market.markPrice = response.data.price;
  
  // Check liquidations with zero latency
  const underwaterPositions = await market.checkLiquidations(response.data.price);
  for (const position of underwaterPositions) {
    const [ix, oracleQuote] = response.toBundleIx();
    await liquidatePosition(position, ix, oracleQuote);
  }
  
  // Calculate funding rates
  await market.updateFundingRate(response.data);
});
```

### 🔄 Oracle-Based AMMs

```typescript
// Next-gen AMM using oracle prices (no impermanent loss)
class OracleAMM {
  async handlePriceUpdate(response: sb.SurgeUpdate) {
    // Update pricing curve with oracle data
    this.pairs[response.data.symbol] = {
      price: response.data.price,
      timestamp: response.data.source_ts_ms
    };
  }
  
  async swap(tokenA: string, tokenB: string, amount: number) {
    const price = this.pairs[`${tokenA}/${tokenB}`].price;
    const output = amount * price * (1 - FEE);
    
    // Use Oracle Quote for on-chain verification
    const [ix, oracleQuote] = this.latestUpdate.toBundleIx();
    return await executeSwap(ix, oracleQuote, output);
  }
}
```

### High-Frequency Trading

```typescript
surge.on('update', async (response: sb.SurgeUpdate) => {
  const opportunity = checkArbitrage(response.data);
  if (opportunity?.profit > MIN_PROFIT) {
    // Execute within milliseconds
    const [ix, oracleQuote] = response.toBundleIx();
    await executeArbitrageTrade(ix, oracleQuote);
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
* Learn about [Crossbar gateway](../../../tooling-and-resources/crossbar/)
* Join our [Discord](https://discord.gg/switchboard) for support
