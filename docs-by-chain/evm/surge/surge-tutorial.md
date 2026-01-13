# Surge Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/evm/price-feeds](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/evm/price-feeds) (see `scripts/surgeToEvmConversion.ts`)

This tutorial walks you through converting Switchboard Surge real-time price updates into EVM-compatible format for use with your smart contracts.

## What You'll Build

A TypeScript script that:
- Receives Surge real-time price updates
- Converts them to EVM-encoded format
- Submits the data to your smart contracts

## Prerequisites

- **Bun** or Node.js 18+
- Basic understanding of hexadecimal encoding

## The Conversion Flow

```
Surge WebSocket → SurgeRawGatewayResponse → EVMUtils.convertSurgeUpdateToEvmFormat() → bytes → Smart Contract
```

## The SurgeRawGatewayResponse Structure

When you receive a Surge update, it has this structure:

```typescript
interface SurgeRawGatewayResponse {
  type: 'bundle_update';
  feed_bundle_id: string;
  feed_values: Array<{
    value: string;           // Price value as string (wei-like format)
    feed_hash: string;       // 32-byte hex feed identifier
    symbol: string;          // Human-readable symbol (e.g., "BTC/USD")
    source: string;          // Data source
  }>;
  oracle_response: {
    oracle_pubkey: string;   // Oracle's public key
    eth_address: string;     // Oracle's Ethereum address
    signature: string;       // Base64-encoded 64-byte signature
    recovery_id: number;     // ECDSA recovery ID (v value)
    timestamp: number;       // Unix timestamp in seconds
    slot: number;            // Solana slot number
    // ... additional fields
  };
}
```

## The Conversion Script

Here's a complete example that converts Surge updates to EVM format:

```typescript
import { EVMUtils, type SurgeRawGatewayResponse } from '@switchboard-xyz/common';
import * as fs from 'fs';

// Sample Surge update data
const sampleSurgeUpdate: SurgeRawGatewayResponse = {
  type: 'bundle_update',
  feed_bundle_id: 'sample-bundle-id',
  feed_values: [
    {
      value: '1000000000000000000',  // 1e18
      feed_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      symbol: 'BTC/USD',
      source: 'switchboard'
    },
    {
      value: '2500000000000000000',  // 2.5e18
      feed_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      symbol: 'ETH/USD',
      source: 'switchboard'
    }
  ],
  oracle_response: {
    oracle_pubkey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    eth_address: '0x742d35Cc6634C0532925a3b8D4C0B4E5C0C8b6C9',
    signature: 'Zl+8HHAyFbKTmaH66HEkQ/4nKRGYKWV8YOjPT9JcGdEhZzy+qI9OKhF3m+nmz9mbegPJRtIJdLfdi1o7wjZCaw==',
    checksum: 'sample-checksum',
    recovery_id: 0,
    oracle_idx: 0,
    timestamp: Math.floor(Date.now() / 1000),
    recent_hash: '0xdeadbeefcafebabe',
    slot: 12345678
  },
  source_ts_ms: Date.now(),
  seen_at_ts_ms: Date.now(),
  triggered_on_price_change: true,
  message: 'Sample surge update'
};

async function convertSurgeToEvm() {
  // Load surge data (from file or use sample)
  let surgeData: SurgeRawGatewayResponse;

  const surgeDataFile = process.env.SURGE_DATA_FILE;
  if (surgeDataFile && fs.existsSync(surgeDataFile)) {
    const fileContent = fs.readFileSync(surgeDataFile, 'utf-8');
    surgeData = JSON.parse(fileContent);
  } else {
    surgeData = sampleSurgeUpdate;
  }

  // Perform the conversion
  const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(surgeData, {
    minOracleSamples: 1
  });

  console.log('Encoded Data:', evmEncoded);
  console.log('Length:', (evmEncoded.length - 2) / 2, 'bytes');

  return evmEncoded;
}

convertSurgeToEvm();
```

### The convertSurgeUpdateToEvmFormat Function

```typescript
import { EVMUtils } from '@switchboard-xyz/common';

const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(surgeData, {
  minOracleSamples: 1  // Minimum oracle samples required
});
```

This function takes the raw Surge response and returns a `0x`-prefixed hex string that your smart contract can parse.

## EVM Data Structure

The encoded data follows this binary format:

| Field | Size | Description |
|-------|------|-------------|
| Slot | 8 bytes | Solana slot number |
| Timestamp | 8 bytes | Unix timestamp |
| Number of Feeds | 1 byte | Count of feeds in update |
| Number of Signatures | 1 byte | Count of oracle signatures |
| Feed Data | Variable | Per-feed data (see below) |
| Signature Data | Variable | Per-signature data (see below) |

### Feed Data (per feed)

| Field | Size | Description |
|-------|------|-------------|
| Feed Hash | 32 bytes | Feed identifier |
| Value | 16 bytes | Price value (int128) |
| Min Samples | 1 byte | Minimum oracle samples |

### Signature Data (per signature)

| Field | Size | Description |
|-------|------|-------------|
| Signature | 64 bytes | ECDSA signature (r, s) |
| Recovery ID | 1 byte | ECDSA recovery ID (v) |

## Parsing the Encoded Data

To understand what the encoded data contains, you can parse it:

```typescript
function parseEvmEncodedData(evmEncoded: string) {
  const hexData = evmEncoded.slice(2); // Remove 0x prefix
  let offset = 0;

  // Parse header
  const slot = parseInt(hexData.slice(offset, offset + 16), 16);
  offset += 16;

  const timestamp = parseInt(hexData.slice(offset, offset + 16), 16);
  offset += 16;

  const numFeeds = parseInt(hexData.slice(offset, offset + 2), 16);
  offset += 2;

  const numSigs = parseInt(hexData.slice(offset, offset + 2), 16);
  offset += 2;

  console.log('Slot:', slot);
  console.log('Timestamp:', new Date(timestamp * 1000).toISOString());
  console.log('Number of Feeds:', numFeeds);
  console.log('Number of Signatures:', numSigs);

  // Parse feeds
  for (let i = 0; i < numFeeds; i++) {
    const feedHash = '0x' + hexData.slice(offset, offset + 64);
    offset += 64;
    const value = '0x' + hexData.slice(offset, offset + 32);
    offset += 32;
    const minSamples = parseInt(hexData.slice(offset, offset + 2), 16);
    offset += 2;

    console.log(`Feed ${i + 1}:`, { feedHash, value, minSamples });
  }

  // Parse signatures
  for (let i = 0; i < numSigs; i++) {
    const signature = '0x' + hexData.slice(offset, offset + 128);
    offset += 128;
    const recoveryId = parseInt(hexData.slice(offset, offset + 2), 16);
    offset += 2;

    console.log(`Signature ${i + 1}:`, {
      signature: signature.slice(0, 20) + '...',
      recoveryId
    });
  }
}
```

## Using with Smart Contracts

Once you have the encoded data, submit it to Switchboard:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ISwitchboard } from "./switchboard/interfaces/ISwitchboard.sol";

contract SurgePriceConsumer {
    ISwitchboard public immutable switchboard;

    constructor(address _switchboard) {
        switchboard = ISwitchboard(_switchboard);
    }

    function updateFromSurge(bytes calldata surgeUpdateData) external payable {
        // Get the required fee
        bytes[] memory updates = new bytes[](1);
        updates[0] = surgeUpdateData;

        uint256 fee = switchboard.getFee(updates);
        require(msg.value >= fee, "Insufficient fee");

        // Submit to Switchboard for verification
        switchboard.updateFeeds{ value: fee }(updates);

        // Data is now verified and available via latestUpdate()
    }
}
```

### TypeScript Integration

```typescript
import * as ethers from "ethers";
import { EVMUtils, type SurgeRawGatewayResponse } from "@switchboard-xyz/common";

async function submitSurgeUpdate(
  contract: ethers.Contract,
  switchboard: ethers.Contract,
  surgeData: SurgeRawGatewayResponse
) {
  // Convert Surge update to EVM format
  const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(surgeData, {
    minOracleSamples: 1
  });

  // Get fee and submit
  const fee = await switchboard.getFee([evmEncoded]);
  const tx = await contract.updateFromSurge(evmEncoded, { value: fee });

  await tx.wait();
  console.log("Surge update submitted:", tx.hash);
}
```

## Full Integration Pattern

Here's how to combine Surge WebSocket streaming with EVM submission:

```typescript
import { EVMUtils, type SurgeRawGatewayResponse } from "@switchboard-xyz/common";
import * as ethers from "ethers";

// Connect to your contract
const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid.xyz/evm");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const contract = new ethers.Contract(contractAddress, abi, signer);

// Handle incoming Surge updates
async function handleSurgeUpdate(surgeData: SurgeRawGatewayResponse) {
  try {
    // Convert to EVM format
    const evmEncoded = EVMUtils.convertSurgeUpdateToEvmFormat(surgeData, {
      minOracleSamples: 1
    });

    // Submit to chain
    const updates = [evmEncoded];
    const fee = await switchboard.getFee(updates);

    const tx = await contract.updatePrices(updates, { value: fee });
    console.log("Submitted:", tx.hash);

    await tx.wait();
    console.log("Confirmed");

  } catch (error) {
    console.error("Failed to submit:", error);
  }
}

// Connect to Surge WebSocket (pseudo-code)
// const ws = new WebSocket(SURGE_WS_URL);
// ws.onmessage = (event) => {
//   const surgeData = JSON.parse(event.data);
//   handleSurgeUpdate(surgeData);
// };
```

## Running the Example

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/evm/price-feeds
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Run the Conversion Example

```bash
# With sample data
bun examples/surgeToEvmConversion.ts

# With custom surge data file
SURGE_DATA_FILE=path/to/surge-data.json bun examples/surgeToEvmConversion.ts
```

### Expected Output

```
Using sample surge data
Input Surge Update Summary:
   - Type: bundle_update
   - Feed Count: 2
   - Timestamp: 1734523800 (2024-12-18T12:30:00.000Z)
   - Slot: 12345678

Converting to EVM format...

EVM Conversion Results:
   - Encoded Data: 0x00000000bc614e0000000000675946f80201...
   - Length: 284 hex characters (142 bytes)

Parsing EVM Structure:
   - Slot: 12345678
   - Timestamp: 1734523800 (2024-12-18T12:30:00.000Z)
   - Number of Feeds: 2
   - Number of Signatures: 1
   - Feed Data:
     Feed 1:
       - Hash: 0x1234567890abcdef...
       - Value: 0x0de0b6b3a7640000
       - Min Samples: 1
     Feed 2:
       - Hash: 0xabcdef1234567890...
       - Value: 0x22b1c8c1227a0000
       - Min Samples: 1
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Invalid surge data` | Ensure the input matches `SurgeRawGatewayResponse` structure |
| `Missing signature` | The `oracle_response.signature` field must be a valid base64 string |
| `Invalid recovery_id` | Must be 0 or 1 |
| `Fee errors on-chain` | Query `switchboard.getFee()` with your encoded data |

## Next Steps

- Learn about [on-demand price feeds](../price-feeds/price-feeds-tutorial.md) for pull-based updates
- Explore [randomness integration](../randomness/randomness-tutorial.md) for gaming and NFTs
- Check out the [Sui Surge tutorial](../../sui/surge/surge-tutorial.md) for comparison
