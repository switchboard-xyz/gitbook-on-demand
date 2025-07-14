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

## 🖥️ Using Crossbar to Stream Surge Prices to Your UI

### What is Crossbar?

Crossbar is Switchboard's local gateway service that enables you to stream real-time oracle prices directly to your frontend applications. It acts as a bridge between the Surge WebSocket feeds and your UI, providing a simple HTTP/WebSocket interface for price updates.

### Setting Up Crossbar for Surge Streaming

#### 1. **Run Crossbar Locally**

```bash
# Using Docker Compose (recommended)
git clone https://github.com/switchboard-xyz/crossbar
cd crossbar
docker-compose up -d

# Crossbar will be available at:
# HTTP: http://localhost:8080
# WebSocket: ws://localhost:8080/ws
```

#### 2. **Configure Surge Connection**

Create a `.env` file for Crossbar:

```bash
# Surge configuration
SURGE_API_KEY=your_surge_api_key_here
SURGE_GATEWAY_URL=wss://surge.switchboard.xyz/mainnet
SURGE_FEEDS=BTC/USDT:BINANCE,ETH/USDT:BINANCE,SOL/USDT:COINBASE

# Crossbar settings
CROSSBAR_PORT=8080
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000,https://yourdapp.com
```

#### 3. **Frontend Integration**

```typescript
// React example with real-time price updates
import { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
  confidence: number;
}

export function PriceFeed({ symbol }: { symbol: string }) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to Crossbar WebSocket
    const websocket = new WebSocket('ws://localhost:8080/ws');
    
    websocket.onopen = () => {
      console.log('Connected to Crossbar');
      // Subscribe to specific price feed
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
          timestamp: data.timestamp,
          source: data.source,
          confidence: data.confidence
        });
      }
    };

    websocket.onerror = (error) => {
      console.error('Crossbar WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [symbol]);

  if (!priceData) return <div>Loading...</div>;

  return (
    <div className="price-feed">
      <h3>{priceData.symbol}</h3>
      <div className="price">${priceData.price.toFixed(2)}</div>
      <div className="source">via {priceData.source}</div>
      <div className="latency">
        Latency: {Date.now() - priceData.timestamp}ms
      </div>
    </div>
  );
}
```

### Advanced Crossbar Features

#### 1. **HTTP Polling Alternative**

For simpler integrations, Crossbar also provides HTTP endpoints:

```typescript
// Fetch latest price via HTTP
async function fetchPrice(symbol: string) {
  const response = await fetch(`http://localhost:8080/api/price/${symbol}`);
  const data = await response.json();
  return data;
}

// Poll for updates
setInterval(async () => {
  const price = await fetchPrice('BTC/USDT');
  updateUI(price);
}, 1000); // Poll every second
```

#### 2. **Batch Price Requests**

```typescript
// Subscribe to multiple feeds simultaneously
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    feeds: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT']
  }));
};

// Handle batch updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'batch_update') {
    data.prices.forEach(price => {
      updatePriceDisplay(price.symbol, price);
    });
  }
};
```

#### 3. **Historical Data Access**

Crossbar can cache recent price history:

```typescript
// Get price history for charting
async function getPriceHistory(symbol: string, minutes: number = 60) {
  const response = await fetch(
    `http://localhost:8080/api/history/${symbol}?minutes=${minutes}`
  );
  const history = await response.json();
  
  // Format for charting library
  return history.map(point => ({
    time: point.timestamp,
    value: point.price
  }));
}
```

### Production Deployment

#### 1. **Crossbar with Reverse Proxy**

```nginx
# nginx configuration
upstream crossbar {
    server localhost:8080;
}

server {
    listen 443 ssl http2;
    server_name api.yourdapp.com;

    location /ws {
        proxy_pass http://crossbar;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://crossbar;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2. **Monitoring and Alerts**

```typescript
// Monitor connection health
class CrossbarConnection {
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnects) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, Math.pow(2, this.reconnectAttempts) * 1000);
      } else {
        this.onMaxReconnectsReached();
      }
    };
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onConnected();
    };
  }
}
```

### Best Practices

1. **Connection Management**
   - Implement automatic reconnection logic
   - Handle network interruptions gracefully
   - Use connection pooling for multiple feeds

2. **Performance Optimization**
   - Throttle UI updates to prevent overwhelming renders
   - Use React.memo or similar for price components
   - Implement virtual scrolling for large price lists

3. **Error Handling**
   - Fallback to HTTP polling if WebSocket fails
   - Display connection status to users
   - Log errors for monitoring

4. **Security**
   - Use WSS (WebSocket Secure) in production
   - Implement rate limiting
   - Validate all incoming data

### Example: Complete Trading Dashboard

```typescript
import { useEffect, useState } from 'react';
import { LineChart } from 'recharts';

export function TradingDashboard() {
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState({});
  const [connection, setConnection] = useState('disconnected');

  useEffect(() => {
    const crossbar = new CrossbarClient({
      url: 'wss://api.yourdapp.com/ws',
      onPriceUpdate: (symbol, price) => {
        setPrices(prev => ({ ...prev, [symbol]: price }));
        
        // Update history for charts
        setHistory(prev => ({
          ...prev,
          [symbol]: [...(prev[symbol] || []).slice(-100), {
            time: Date.now(),
            price: price.value
          }]
        }));
      },
      onConnectionChange: setConnection
    });

    crossbar.subscribe([
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
      'AVAX/USDT', 'MATIC/USDT', 'DOT/USDT'
    ]);

    return () => crossbar.disconnect();
  }, []);

  return (
    <div className="dashboard">
      <ConnectionStatus status={connection} />
      
      <div className="price-grid">
        {Object.entries(prices).map(([symbol, data]) => (
          <PriceCard
            key={symbol}
            symbol={symbol}
            price={data.price}
            change={data.change24h}
            chart={history[symbol] || []}
          />
        ))}
      </div>
    </div>
  );
}
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

1. Get a feed hash from [Switchboard Bundle Builder](https://beta.ondemand.switchboard.xyz/bundle-builder)
2. Use the bundle examples: [GitHub Repository](https://github.com/switchboard-xyz/sb-on-demand-examples)
3. Integrate into your program using the verification pattern

### For Surge

1. Contact Switchboard team for API access: [https://tinyurl.com/yqubsr8e](https://tinyurl.com/yqubsr8e)
2. Set up WebSocket connection with your API key
3. Subscribe to desired price feeds
4. Handle updates in your application

## Next Steps

* Explore the [complete examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
* Read about [on-chain integration](integrating-your-feed-on-chain.md)
* Learn about [feed design](part-1-designing-and-simulating-your-feed/)
* Join our [Discord](https://discord.gg/switchboard) for support
