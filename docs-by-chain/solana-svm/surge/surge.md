# Surge Tutorial

This tutorial walks you through implementing Switchboard Surge for real-time price streaming on Solana.

## Prerequisites

- Node.js 18+
- Surge API key ([request access](https://tinyurl.com/yqubsr8e))
- Basic TypeScript knowledge

## Installation

```bash
npm install @switchboard-xyz/on-demand
# or
yarn add @switchboard-xyz/on-demand
```

## Basic Implementation

Connect to Surge and stream real-time prices:

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

## Converting to Oracle Quotes

When you need to use Surge prices on-chain, convert them to Oracle Quotes:

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  // Convert Surge update to on-chain format
  const [sigVerifyIx, oracleQuote] = response.toBundleIx();

  // Use in your Solana transaction
  const tx = new Transaction()
    .add(sigVerifyIx)
    .add(
      await program.methods
        .yourInstruction(oracleQuote)
        .accounts({ /* ... */ })
        .instruction()
    );

  await sendAndConfirmTransaction(connection, tx, [wallet]);
});
```

## Streaming to Frontend with Crossbar

Crossbar is Switchboard's local gateway service for streaming prices to frontend applications.

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

### React Integration

```typescript
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

## Use Case Examples

### Perpetual Exchange

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
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

### Arbitrage Bot

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const opportunity = checkArbitrage(response.data);
  if (opportunity?.profit > MIN_PROFIT) {
    // Execute within milliseconds
    const [ix, oracleQuote] = response.toBundleIx();
    await executeArbitrageTrade(ix, oracleQuote);
  }
});
```

## Error Handling

```typescript
surge.on('error', (error) => {
  console.error('Surge error:', error);
});

surge.on('close', () => {
  console.log('Connection closed');
  // SDK handles automatic reconnection
});
```

## Next Steps

- Explore [code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
- Learn about [Crossbar gateway](../../../tooling/crossbar/)
- Join our [Discord](https://discord.gg/switchboard) for support
