# Surge Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/surge](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/surge)

This tutorial walks you through implementing Switchboard Surge for real-time price streaming on Solana.

## Prerequisites

- Node.js 18+
- Solana keypair with an active Surge subscription ([subscribe here](https://explorer.switchboardlabs.xyz/subscriptions))
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

// Load environment (keypair, connection, queue, etc.)
const { keypair, connection, queue } = await sb.AnchorUtils.loadEnv();

// Initialize Surge client with keypair and connection
const surge = new sb.Surge({ connection, keypair });

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
  const metrics = response.getLatencyMetrics();

  // Skip heartbeat messages
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  metrics.perFeedMetrics.forEach((feed) => {
    console.log(`${feed.symbol}: ${prices[feed.feed_hash]}`);
    console.log(`  Source → Oracle: ${feed.sourceToOracleMs}ms`);
    console.log(`  Emit Latency: ${feed.emitLatencyMs}ms`);
  });
});
```

## Converting to Oracle Quotes

When you need to use Surge prices on-chain, convert them to Oracle Quotes:

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  // Convert Surge update to on-chain instructions
  const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);

  // Build transaction with oracle quote update
  const tx = await sb.asV0Tx({
    connection,
    ixs: [
      ...crankIxs,
      await program.methods
        .yourInstruction()
        .accounts({ /* ... */ })
        .instruction()
    ],
    signers: [keypair],
    computeUnitPrice: 20_000,
    computeUnitLimitMultiple: 1.3,
  });

  await connection.sendTransaction(tx);
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
  const metrics = response.getLatencyMetrics();
  if (metrics.isHeartbeat) return;

  const prices = response.getFormattedPrices();

  for (const feed of metrics.perFeedMetrics) {
    const price = parseFloat(prices[feed.feed_hash].replace(/[$,]/g, ''));
    const market = perpetuals.get(feed.symbol);

    // Update mark price instantly
    market.markPrice = price;

    // Check liquidations with latest price
    const underwaterPositions = await market.checkLiquidations(price);
    for (const position of underwaterPositions) {
      const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
      await liquidatePosition(position, crankIxs);
    }
  }
});
```

### Arbitrage Bot

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
      const crankIxs = response.toQuoteIx(queue.pubkey, keypair.publicKey);
      await executeArbitrageTrade(crankIxs, calculateOptimalSize(spread));
    }
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
- Learn about [Crossbar gateway](../../../tooling/crossbar/README.md)
- Join our [Discord](https://discord.gg/EyBm9a3bYm) for support
