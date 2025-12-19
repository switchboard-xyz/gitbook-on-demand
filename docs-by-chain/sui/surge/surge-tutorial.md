# Surge Tutorial

This tutorial shows you how to stream real-time price data via WebSocket using Switchboard Surge and submit updates to the Sui blockchain. This approach is ideal for applications requiring sub-second price updates.

## What You'll Build

A TypeScript application that:
- Connects to Switchboard Surge for real-time price streaming via WebSocket
- Receives signed price updates with sub-second latency
- Submits price updates to the Sui blockchain
- Tracks latency statistics and oracle performance

## Prerequisites

- Sui CLI installed ([Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install))
- Node.js 18+ and npm/pnpm
- A Sui keypair with SUI tokens (in your Sui keystore)
- Surge API key (obtain from [Switchboard](https://switchboard.xyz))

## Key Concepts

### Surge vs On-Demand Quotes

| Feature | On-Demand Quotes | Surge Streaming |
|---------|-----------------|-----------------|
| Update frequency | Request-based | Continuous (~100ms) |
| Latency | Higher (HTTP request) | Lower (WebSocket) |
| Use case | Occasional reads | Real-time apps |
| Authentication | None required | API key required |

### The emitSurgeQuote Function

Surge provides the `emitSurgeQuote()` function from `@switchboard-xyz/sui-sdk` that converts Surge updates into Sui transactions. This handles:
- Oracle signature formatting
- Transaction building
- Quote verification setup

### Oracle Mapping

Surge returns oracle public keys, but Sui needs oracle object IDs. The example fetches a mapping from Crossbar to convert between these formats.

### Transaction Queue Management

Since Sui transactions are sequential, the example implements a queue to:
- Buffer incoming price updates
- Process one transaction at a time
- Track processing latency

## The Streaming Client

Here's the complete mainnet streaming example:

```typescript
import * as sb from '@switchboard-xyz/on-demand';
import { CrossbarClient } from '@switchboard-xyz/common';
import { SuiClient } from '@mysten/sui/client';
import {
  SwitchboardClient,
  emitSurgeQuote,
} from '@switchboard-xyz/sui-sdk';
import { fromB64 } from '@mysten/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { Transaction } from '@mysten/sui/transactions';

// Initialize Sui clients
const suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
const switchboardClient = new SwitchboardClient(suiClient);

// Oracle mapping cache
const oracleMapping = new Map<string, string>();
let lastOracleFetch = 0;
const ORACLE_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// Transaction queue management
let isTransactionProcessing = false;
const rawResponseQueue: Array<{
  rawResponse: any;
  timestamp: number;
}> = [];

// Process transaction queue - ensures only one transaction at a time
async function processTransactionQueue(): Promise<void> {
  if (isTransactionProcessing || rawResponseQueue.length === 0) {
    return;
  }

  isTransactionProcessing = true;

  try {
    const queueItem = rawResponseQueue.shift()!;
    const { rawResponse, timestamp } = queueItem;

    console.log(`Processing transaction (queue length: ${rawResponseQueue.length})`);

    const transaction = new Transaction();

    // Convert Surge update to Sui transaction
    await emitSurgeQuote(switchboardClient, transaction, rawResponse);

    const result = await suiClient.signAndExecuteTransaction({
      transaction: transaction,
      signer: keypair!,
      options: {
        showEvents: true,
        showEffects: true,
      },
    });

    const processingTime = Date.now() - timestamp;
    console.log(`Transaction completed in ${processingTime}ms`);
    console.log('Transaction result:', result.digest);
  } catch (error) {
    console.error('Transaction failed:', error);
  } finally {
    isTransactionProcessing = false;

    // Process next transaction in queue
    if (rawResponseQueue.length > 0) {
      setImmediate(() => processTransactionQueue());
    }
  }
}

// Fetch oracle mappings from Crossbar
async function fetchOracleMappings(): Promise<Map<string, string>> {
  const now = Date.now();

  if (oracleMapping.size > 0 && now - lastOracleFetch < ORACLE_CACHE_TTL) {
    return oracleMapping;
  }

  try {
    const response = await fetch('https://crossbar.switchboard.xyz/oracles/sui');
    const oracles = (await response.json()) as Array<{
      oracle_id: string;
      oracle_key: string;
    }>;

    oracleMapping.clear();
    for (const oracle of oracles) {
      const cleanKey = oracle.oracle_key.startsWith('0x')
        ? oracle.oracle_key.slice(2)
        : oracle.oracle_key;
      oracleMapping.set(cleanKey, oracle.oracle_id);
    }

    lastOracleFetch = now;
    console.log(`Loaded ${oracleMapping.size} oracle mappings`);
    return oracleMapping;
  } catch (error) {
    console.error('Failed to fetch oracle mappings:', error);
    return oracleMapping;
  }
}

// Calculate latency statistics
function calculateStatistics(latencies: number[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: sum / sorted.length,
    count: sorted.length,
  };
}

// Load keypair from Sui keystore
let keypair: Ed25519Keypair | null = null;

try {
  const keystorePath = path.join(os.homedir(), '.sui', 'sui_config', 'sui.keystore');
  const keystore = JSON.parse(fs.readFileSync(keystorePath, 'utf-8'));
  const secretKey = fromB64(keystore[0]);
  keypair = Ed25519Keypair.fromSecretKey(secretKey.slice(1));
} catch (error) {
  console.error('Error loading keypair:', error);
}

if (!keypair) {
  throw new Error('Keypair not loaded');
}

// Main function
(async function main() {
  console.log('Starting Surge streaming...');

  const apiKey = process.env.SURGE_API_KEY!;
  if (!apiKey) {
    throw new Error('SURGE_API_KEY environment variable required');
  }

  const latencies: number[] = [];

  // Create Surge connection
  const surge = new sb.Surge({
    gatewayUrl: (await CrossbarClient.default().fetchGateway('mainnet')).endpoint(),
    apiKey,
    verbose: false,
    signatureScheme: 'secp256k1',
  });

  // Connect and subscribe to feeds
  await surge.connectAndSubscribe([{ symbol: 'BTC/USD' }]);

  // Pre-fetch oracle mappings
  await fetchOracleMappings();

  // Listen for price updates
  surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
    const currentLatency = Date.now() - response.data.source_ts_ms;
    latencies.push(currentLatency);

    const rawResponse = response.getRawResponse();
    const stats = calculateStatistics(latencies);
    const formattedPrices = response.getFormattedPrices();
    const currentPrice = Object.values(formattedPrices)[0] || 'N/A';

    console.log(
      `Update #${stats.count} | Price: ${currentPrice} | Latency: ${currentLatency}ms | Avg: ${stats.mean.toFixed(1)}ms`
    );

    // Log oracle mapping status
    if (rawResponse.oracle_response?.oracle_pubkey) {
      let oracleKeyHex = rawResponse.oracle_response.oracle_pubkey;
      if (oracleKeyHex.startsWith('0x')) {
        oracleKeyHex = oracleKeyHex.slice(2);
      }

      const oracleId = oracleMapping.get(oracleKeyHex);
      if (oracleId) {
        console.log(`Oracle ID found: ${oracleId}`);
      } else {
        console.warn(`Oracle ID not found for key: ${oracleKeyHex}`);
      }
    }

    // Queue the update for processing
    rawResponseQueue.push({
      rawResponse,
      timestamp: Date.now(),
    });

    console.log(`Response queued (queue length: ${rawResponseQueue.length})`);

    // Trigger queue processing
    processTransactionQueue();
  });

  console.log('Listening for price updates...');
})();
```

### Code Walkthrough

#### Setup

```typescript
const suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
const switchboardClient = new SwitchboardClient(suiClient);
```

Initialize the Sui and Switchboard clients. For testnet, use `https://fullnode.testnet.sui.io:443`.

#### Creating Surge Connection

```typescript
const surge = new sb.Surge({
  gatewayUrl: (await CrossbarClient.default().fetchGateway('mainnet')).endpoint(),
  apiKey,
  verbose: false,
  signatureScheme: 'secp256k1',
});

await surge.connectAndSubscribe([{ symbol: 'BTC/USD' }]);
```

- `gatewayUrl`: Fetched dynamically from Crossbar
- `apiKey`: Your Surge API key
- `signatureScheme`: Use `'secp256k1'` for Sui
- `connectAndSubscribe()`: Connects and subscribes to specified feeds

#### Handling Updates

```typescript
surge.on('signedPriceUpdate', async (response: sb.SurgeUpdate) => {
  const rawResponse = response.getRawResponse();
  const formattedPrices = response.getFormattedPrices();
  // ...
});
```

The `signedPriceUpdate` event fires whenever new price data arrives. Key methods:
- `getRawResponse()`: Returns the raw signed data for transaction submission
- `getFormattedPrices()`: Returns human-readable prices

#### Submitting to Sui

```typescript
const transaction = new Transaction();
await emitSurgeQuote(switchboardClient, transaction, rawResponse);

const result = await suiClient.signAndExecuteTransaction({
  transaction,
  signer: keypair,
});
```

The `emitSurgeQuote()` function handles converting the Surge response into a valid Sui transaction.

## Mainnet vs Testnet

The mainnet and testnet examples are nearly identical with these differences:

| Setting | Mainnet | Testnet |
|---------|---------|---------|
| RPC URL | `https://fullnode.mainnet.sui.io:443` | `https://fullnode.testnet.sui.io:443` |
| Gateway | `fetchGateway('mainnet')` | `fetchGateway('testnet')` |
| Oracle Mapping | `/oracles/sui` | `/oracles/sui/testnet` |

### Testnet Configuration

```typescript
// Testnet setup
const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

const surge = new sb.Surge({
  gatewayUrl: (await CrossbarClient.default().fetchGateway('testnet')).endpoint(),
  apiKey,
  signatureScheme: 'secp256k1',
});

// Testnet oracle mapping endpoint
const response = await fetch('https://crossbar.switchboard.xyz/oracles/sui/testnet');
```

## Running the Examples

### 1. Clone the Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/sui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
# Set your Surge API key
export SURGE_API_KEY="your_api_key_here"
```

### 4. Run the Examples

```bash
# Mainnet streaming
npx tsx examples/mainnet_surge_stream.ts

# Testnet streaming
npx tsx examples/testnet_surge_stream.ts
```

### Expected Output

```
Starting Surge streaming...
Loaded 15 oracle mappings
Listening for price updates...
Update #1 | Price: 97234.50 | Latency: 85ms | Avg: 85.0ms
Oracle ID found: 0x...
Response queued (queue length: 1)
Processing transaction (queue length: 0)
Transaction completed in 1234ms
Transaction result: 8Js7NsQ7...
Update #2 | Price: 97235.10 | Latency: 92ms | Avg: 88.5ms
Oracle ID found: 0x...
Response queued (queue length: 1)
...
```

## Adding to Your Project

### Dependencies

```bash
npm install @switchboard-xyz/on-demand @switchboard-xyz/common @switchboard-xyz/sui-sdk @mysten/sui
```

### Minimal Integration

```typescript
import * as sb from '@switchboard-xyz/on-demand';
import { CrossbarClient } from '@switchboard-xyz/common';
import { SuiClient } from '@mysten/sui/client';
import { SwitchboardClient, emitSurgeQuote } from '@switchboard-xyz/sui-sdk';
import { Transaction } from '@mysten/sui/transactions';

const suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
const switchboardClient = new SwitchboardClient(suiClient);

const surge = new sb.Surge({
  gatewayUrl: (await CrossbarClient.default().fetchGateway('mainnet')).endpoint(),
  apiKey: process.env.SURGE_API_KEY!,
  signatureScheme: 'secp256k1',
});

await surge.connectAndSubscribe([{ symbol: 'BTC/USD' }]);

surge.on('signedPriceUpdate', async (response) => {
  const tx = new Transaction();
  await emitSurgeQuote(switchboardClient, tx, response.getRawResponse());

  // Sign and send transaction
  await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });
});
```

### Multiple Feeds

```typescript
await surge.connectAndSubscribe([
  { symbol: 'BTC/USD' },
  { symbol: 'ETH/USD' },
  { symbol: 'SOL/USD' },
]);
```

### Error Handling

```typescript
surge.on('error', (error) => {
  console.error('Surge error:', error);
});

surge.on('close', () => {
  console.log('Connection closed, attempting reconnect...');
  // Implement reconnection logic
});
```

## Performance Considerations

### Transaction Queue

The example uses a queue because:
- Sui transactions are sequential per sender
- Surge updates arrive faster than transactions complete
- Queuing prevents transaction conflicts

### Latency Optimization

- Keep your Sui node geographically close
- Use dedicated RPC endpoints for production
- Consider batching updates if latency isn't critical

### Oracle Mapping Cache

The oracle mapping is cached for 10 minutes to avoid repeated API calls. Adjust `ORACLE_CACHE_TTL` based on your needs.

## Troubleshooting

### "Keypair not loaded"
- Ensure you have a valid keypair in `~/.sui/sui_config/sui.keystore`
- Run `sui client new-address ed25519` to create one

### "SURGE_API_KEY environment variable required"
- Set the environment variable: `export SURGE_API_KEY="your_key"`

### "Oracle ID not found for key"
- The oracle mapping might be stale
- Force refresh by clearing `oracleMapping` and calling `fetchOracleMappings()`
- Check you're using the correct network (mainnet vs testnet)

### Transaction Failures
- Ensure your wallet has sufficient SUI for gas
- Check network connectivity
- Verify you're on the correct network

### High Latency
- Check your network connection
- Consider using a dedicated RPC endpoint
- Reduce logging if running in production

## Next Steps

- **Quote Verifier Pattern**: See the [Price Feeds](price-feeds.md) tutorial for verified on-chain price storage
- **Multiple Feeds**: Subscribe to multiple feeds for portfolio tracking
- **Custom Integration**: Use the price data to trigger your own Move contract logic
