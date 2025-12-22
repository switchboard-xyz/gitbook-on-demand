# Price Feeds Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/sui/feeds/basic](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sui/feeds/basic)

This tutorial walks you through integrating Switchboard oracle price feeds into your Sui Move contracts using the Quote Verifier pattern. You'll learn how to securely fetch, verify, and use real-time price data.

## What You'll Build

A Move contract that:
- Fetches real-time price data from multiple Switchboard oracles
- Verifies oracle signatures cryptographically
- Validates data freshness and price deviation
- Stores verified prices for your DeFi logic

Plus a TypeScript client that fetches oracle data and submits it to your contract.

## Prerequisites

- Sui CLI installed ([Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install))
- Node.js 18+ and npm/pnpm
- A Sui keypair with SUI tokens (testnet or mainnet)
- Basic understanding of Move and TypeScript

## Key Concepts

### The Quote Verifier Pattern

Switchboard uses a **Quote Verifier** pattern to ensure oracle data is legitimate. The verifier:

- Checks that data comes from authorized oracles on the correct queue
- Tracks timestamps and slots to prevent replay attacks
- Enables custom validation logic (freshness, deviation limits)

### Why Use Quote Verifier?

Without verification:
- Anyone could submit fake prices if you don't check the queue ID
- You'd have to track last update timestamps yourself
- Stale data could be replayed to manipulate prices

With verification:
- Only data from the authorized oracle queue is accepted
- Automatic freshness checks prevent stale data
- Replay attacks are prevented
- You don't need to manually track update timestamps

### Feed Hashes

Each price feed has a unique 32-byte hex identifier. You can find feed hashes in the [Switchboard Explorer](https://ondemand.switchboard.xyz/).

Example: BTC/USD feed hash:
```
0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
```

## The Move Contract

Here's the complete Move contract that consumes oracle data with built-in verification:

```move
module example::example;

use sui::clock::Clock;
use sui::event;
use switchboard::quote::{QuoteVerifier, Quotes};
use switchboard::decimal::Decimal;

// ========== Error Codes ==========

#[error]
const EInvalidQuote: vector<u8> = b"Invalid quote data";

#[error]
const EQuoteExpired: vector<u8> = b"Quote data is expired";

#[error]
const EPriceDeviationTooHigh: vector<u8> = b"Price deviation exceeds threshold";

// ========== Structs ==========

/// QuoteConsumer - Your Oracle Data Consumer
///
/// This struct manages oracle price data with built-in security features:
/// - `quote_verifier`: Verifies oracle signatures and manages quote storage
/// - `last_price`: The most recent verified price
/// - `last_update_time`: Timestamp of the last update
/// - `max_age_ms`: Maximum age for valid quotes
/// - `max_deviation_bps`: Maximum price deviation allowed (basis points)
public struct QuoteConsumer has key {
    id: UID,
    quote_verifier: QuoteVerifier,
    last_price: Option<Decimal>,
    last_update_time: u64,
    max_age_ms: u64,
    max_deviation_bps: u64,
}

/// Event emitted when price is updated
public struct PriceUpdated has copy, drop {
    feed_hash: vector<u8>,
    old_price: Option<u128>,
    new_price: u128,
    timestamp: u64,
    num_oracles: u64,
}

// ========== Public Functions ==========

/// Initialize a QuoteConsumer with a Quote Verifier
public fun init_quote_consumer(
    queue: ID,
    max_age_ms: u64,
    max_deviation_bps: u64,
    ctx: &mut TxContext
): QuoteConsumer {
    let verifier = switchboard::quote::new_verifier(ctx, queue);

    QuoteConsumer {
        id: object::new(ctx),
        quote_verifier: verifier,
        last_price: option::none(),
        last_update_time: 0,
        max_age_ms,
        max_deviation_bps,
    }
}

/// Create and share a QuoteConsumer
public fun create_quote_consumer(
    queue: ID,
    max_age_ms: u64,
    max_deviation_bps: u64,
    ctx: &mut TxContext
) {
    let consumer = init_quote_consumer(queue, max_age_ms, max_deviation_bps, ctx);
    transfer::share_object(consumer);
}

/// Update price using Switchboard oracle quotes
public fun update_price(
    consumer: &mut QuoteConsumer,
    quotes: Quotes,
    feed_hash: vector<u8>,
    clock: &Clock,
) {
    // STEP 1: Verify oracle signatures and queue membership
    consumer.quote_verifier.verify_quotes(&quotes, clock);

    // STEP 2: Check if the feed exists in the verified quotes
    assert!(consumer.quote_verifier.quote_exists(*& feed_hash), EInvalidQuote);

    // STEP 3: Get the verified quote
    let quote = consumer.quote_verifier.get_quote(*& feed_hash);

    // STEP 4: Ensure the quote is fresh (within 10 seconds)
    assert!(quote.timestamp_ms() + 10000 > clock.timestamp_ms(), EQuoteExpired);

    // STEP 5: Extract the price value
    let new_price = quote.result();

    // STEP 6: Validate price deviation (if we have a previous price)
    if (consumer.last_price.is_some()) {
        let last_price = *consumer.last_price.borrow();
        validate_price_deviation(&last_price, &new_price, consumer.max_deviation_bps);
    };

    // Store the old price for the event
    let old_price_value = if (consumer.last_price.is_some()) {
        option::some(consumer.last_price.borrow().value())
    } else {
        option::none()
    };

    // STEP 7: Update the stored price and timestamp
    consumer.last_price = option::some(new_price);
    consumer.last_update_time = quote.timestamp_ms();

    // STEP 8: Emit event for transparency
    event::emit(PriceUpdated {
        feed_hash,
        old_price: old_price_value,
        new_price: new_price.value(),
        timestamp: quote.timestamp_ms(),
        num_oracles: quotes.oracles().length(),
    });
}

/// Get the current price (if available)
public fun get_current_price(consumer: &QuoteConsumer): Option<Decimal> {
    consumer.last_price
}

/// Check if the current price is fresh (within max age)
public fun is_price_fresh(consumer: &QuoteConsumer, clock: &Clock): bool {
    if (consumer.last_update_time == 0) {
        return false
    };

    let current_time = clock.timestamp_ms();
    current_time - consumer.last_update_time <= consumer.max_age_ms
}

// ========== Private Helper Functions ==========

/// Validate that price deviation is within acceptable bounds
fun validate_price_deviation(
    old_price: &Decimal,
    new_price: &Decimal,
    max_deviation_bps: u64
) {
    let old_value = old_price.value();
    let new_value = new_price.value();

    let change = if (new_value > old_value) {
        ((new_value - old_value) * 10000) / old_value
    } else {
        ((old_value - new_value) * 10000) / old_value
    };

    assert!(change <= (max_deviation_bps as u128), EPriceDeviationTooHigh);
}
```

### Contract Walkthrough

#### Imports

```move
use switchboard::quote::{QuoteVerifier, Quotes};
use switchboard::decimal::Decimal;
```

- `QuoteVerifier` - Manages quote verification and storage
- `Quotes` - The signed oracle data structure
- `Decimal` - Switchboard's decimal type for price values

#### QuoteConsumer Struct

The `QuoteConsumer` is a shared object that stores:
- `quote_verifier`: Handles signature verification and prevents replay attacks
- `last_price`: Most recent verified price
- `last_update_time`: Timestamp for freshness checks
- `max_age_ms`: Maximum acceptable quote age (e.g., 300000 = 5 minutes)
- `max_deviation_bps`: Maximum price change in basis points (e.g., 1000 = 10%)

#### The update_price Function

This is the core function that processes oracle data:

1. **`verify_quotes()`** - Verifies all oracle signatures and ensures they're from the correct queue
2. **`quote_exists()`** - Confirms the requested feed is in the quotes
3. **`get_quote()`** - Retrieves the verified quote data
4. **Freshness check** - Rejects data older than 10 seconds
5. **Deviation check** - Prevents sudden price jumps that might indicate manipulation
6. **Store and emit** - Updates state and emits a `PriceUpdated` event

#### Business Logic Examples

The contract includes example functions for common DeFi use cases:

```move
/// Calculate collateral ratio using fresh price
public fun calculate_collateral_ratio(
    consumer: &QuoteConsumer,
    collateral_amount: u64,
    debt_amount: u64,
    clock: &Clock
): u64 {
    assert!(is_price_fresh(consumer, clock), EQuoteExpired);

    let price = consumer.last_price.borrow();
    let collateral_value = (collateral_amount as u128) * price.value();
    let debt_value = (debt_amount as u128) * 1_000_000_000;

    ((collateral_value * 100) / debt_value as u64)
}

/// Check if liquidation is needed
public fun should_liquidate(
    consumer: &QuoteConsumer,
    collateral_amount: u64,
    debt_amount: u64,
    liquidation_threshold: u64,
    clock: &Clock
): bool {
    if (!is_price_fresh(consumer, clock)) {
        return false // Don't liquidate with stale data
    };

    let ratio = calculate_collateral_ratio(consumer, collateral_amount, debt_amount, clock);
    ratio < liquidation_threshold
}
```

## The TypeScript Client

Here's the complete TypeScript client that creates a QuoteConsumer and updates prices:

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 as fromB64 } from "@mysten/sui/utils";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { SwitchboardClient, Quote } from "@switchboard-xyz/sui-sdk";

// Configuration
const config = {
  network: (process.env.SUI_NETWORK || "mainnet") as "mainnet" | "testnet",
  rpcUrl: process.env.SUI_RPC_URL || undefined,
  keystoreIndex: parseInt(process.env.KEYSTORE_INDEX || "0"),
  examplePackageId: process.env.EXAMPLE_PACKAGE_ID || "",
  feedHash: process.env.FEED_HASH || "0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812",
  numOracles: parseInt(process.env.NUM_ORACLES || "3"),
  maxAgeMs: parseInt(process.env.MAX_AGE_MS || "300000"),
  maxDeviationBps: parseInt(process.env.MAX_DEVIATION_BPS || "1000"),
};

// Load keypair from Sui keystore
function loadKeypair(): Ed25519Keypair {
  const keystorePath = path.join(os.homedir(), ".sui", "sui_config", "sui.keystore");
  const keystore = JSON.parse(fs.readFileSync(keystorePath, "utf-8"));
  const secretKey = fromB64(keystore[config.keystoreIndex]);
  return Ed25519Keypair.fromSecretKey(secretKey.slice(1));
}

async function main() {
  console.log("Switchboard Oracle Quote Verifier Example\n");

  const rpcUrl = config.rpcUrl || getFullnodeUrl(config.network);
  console.log("Configuration:");
  console.log(`  Network: ${config.network}`);
  console.log(`  Package: ${config.examplePackageId}`);
  console.log(`  Feed: ${config.feedHash}`);
  console.log(`  Oracles: ${config.numOracles}\n`);

  // Initialize clients
  const client = new SuiClient({ url: rpcUrl });
  const sb = new SwitchboardClient(client);
  const state = await sb.fetchState();

  console.log("Switchboard Connected:");
  console.log(`  Oracle Queue: ${state.oracleQueueId}`);
  console.log(`  Network: ${state.mainnet ? 'Mainnet' : 'Testnet'}\n`);

  const keypair = loadKeypair();
  const userAddress = keypair.getPublicKey().toSuiAddress();
  console.log(`User Address: ${userAddress}\n`);

  // Step 1: Create QuoteConsumer
  console.log("Step 1: Creating QuoteConsumer...");

  const createTx = new Transaction();
  createTx.moveCall({
    target: `${config.examplePackageId}::example::create_quote_consumer`,
    arguments: [
      createTx.pure.id(state.oracleQueueId),
      createTx.pure.u64(config.maxAgeMs),
      createTx.pure.u64(config.maxDeviationBps),
    ],
  });

  const createRes = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: createTx,
    options: { showEffects: true, showObjectChanges: true, showEvents: true },
  });

  // Extract QuoteConsumer ID
  let quoteConsumerId: string | null = null;
  for (const change of createRes.objectChanges ?? []) {
    if (change.type === "created" && change.objectType?.includes("::example::QuoteConsumer")) {
      quoteConsumerId = change.objectId;
      console.log(`QuoteConsumer Created: ${quoteConsumerId}\n`);
      break;
    }
  }

  if (!quoteConsumerId) {
    throw new Error("Failed to create QuoteConsumer");
  }

  // Wait for object availability
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Fetch Oracle Data
  console.log("Step 2: Fetching Oracle Data...");

  const updateTx = new Transaction();
  const quotes = await Quote.fetchUpdateQuote(sb, updateTx, {
    feedHashes: [config.feedHash],
    numOracles: config.numOracles,
  });

  console.log("Oracle data fetched successfully\n");

  // Step 3: Verify and Update Price
  console.log("Step 3: Verifying and Updating Price...");

  updateTx.moveCall({
    target: `${config.examplePackageId}::example::update_price`,
    arguments: [
      updateTx.object(quoteConsumerId),
      quotes,
      updateTx.pure.vector("u8", Array.from(Buffer.from(config.feedHash.replace("0x", ""), "hex"))),
      updateTx.object("0x6"), // Sui Clock
    ],
  });

  const updateRes = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: updateTx,
    options: { showEffects: true, showEvents: true },
  });

  // Display results
  if (updateRes.effects?.status.status === "success") {
    console.log("Price Update Successful!\n");
  }

  // Parse events
  for (const event of updateRes.events ?? []) {
    if (event.type.includes("PriceUpdated")) {
      const data = event.parsedJson as any;
      console.log("PriceUpdated Event:");
      console.log(`  Feed Hash: ${Buffer.from(data.feed_hash).toString('hex')}`);
      console.log(`  New Price: ${data.new_price}`);
      console.log(`  Timestamp: ${new Date(parseInt(data.timestamp)).toISOString()}`);
      console.log(`  Oracles: ${data.num_oracles}`);
    }
  }
}

main().catch(console.error);
```

### Client Walkthrough

#### Step 1: Create QuoteConsumer

```typescript
const createTx = new Transaction();
createTx.moveCall({
  target: `${config.examplePackageId}::example::create_quote_consumer`,
  arguments: [
    createTx.pure.id(state.oracleQueueId),  // Oracle queue from Switchboard state
    createTx.pure.u64(config.maxAgeMs),      // Max quote age (5 minutes)
    createTx.pure.u64(config.maxDeviationBps), // Max deviation (10%)
  ],
});
```

This creates a shared QuoteConsumer object tied to Switchboard's oracle queue.

#### Step 2: Fetch Oracle Quotes

```typescript
const quotes = await Quote.fetchUpdateQuote(sb, updateTx, {
  feedHashes: [config.feedHash],
  numOracles: config.numOracles,
});
```

`Quote.fetchUpdateQuote()` contacts Crossbar to get signed price data from multiple oracles. The `quotes` object is added to the transaction automatically.

#### Step 3: Update Price

```typescript
updateTx.moveCall({
  target: `${config.examplePackageId}::example::update_price`,
  arguments: [
    updateTx.object(quoteConsumerId),
    quotes,
    updateTx.pure.vector("u8", feedHashBytes),
    updateTx.object("0x6"), // Sui Clock
  ],
});
```

This calls your contract's `update_price` function with the fetched quotes. The Move contract will verify signatures and update the stored price.

## Project Structure

```
sui/
├── Move.toml              # Mainnet configuration
├── Move.testnet.toml      # Testnet configuration
├── sources/
│   └── example.move       # Quote Consumer contract with verifier
├── scripts/
│   └── run.ts             # Complete TypeScript example
├── examples/
│   ├── quotes.ts                # Simple quote fetching example
│   ├── mainnet_surge_stream.ts  # Mainnet streaming with Sui integration
│   └── testnet_surge_stream.ts  # Testnet streaming with Sui integration
└── package.json
```

## Available Scripts

```bash
# Build the Move contract
npm run build

# Build for testnet
npm run build:testnet

# Run Move tests
npm run test

# Deploy to mainnet
npm run deploy

# Deploy to testnet
npm run deploy:testnet

# Run the complete example with Move integration
npm run example

# Run simple quote fetching example
npm run quotes
```

## Running the Example

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/sui
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Build the Move Contract

```bash
# For mainnet
npm run build

# For testnet
npm run build:testnet
```

### 4. Deploy the Contract

```bash
# For mainnet
npm run deploy

# For testnet
npm run deploy:testnet
```

Save the package ID from the deployment output.

### 5. Run the Example

```bash
# Set your package ID
export EXAMPLE_PACKAGE_ID=0xYOUR_PACKAGE_ID

# Run the example
npm run example

# Or with custom parameters
export FEED_HASH=0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
export NUM_ORACLES=5
npm run example
```

### Expected Output

```
Switchboard Oracle Quote Verifier Example

Configuration:
  Network: mainnet
  Package: 0xYOUR_PACKAGE_ID
  Feed: 0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
  Oracles: 3

Switchboard Connected:
  Oracle Queue: 0xe9324b82374f18d17de601ae5a19cd72e8c9f57f54661bf9e41a76f8948e80b5
  Network: Mainnet

User Address: 0x...

Step 1: Creating QuoteConsumer...
QuoteConsumer Created: 0x...

Step 2: Fetching Oracle Data...
Oracle data fetched successfully

Step 3: Verifying and Updating Price...
Price Update Successful!

PriceUpdated Event:
  Feed Hash: 4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
  New Price: 98765432100
  Timestamp: 2025-12-18T10:30:00.000Z
  Oracles: 3
```

## Adding to Your Project

### 1. Add Switchboard to Move.toml

```toml
[dependencies.Switchboard]
git = "https://github.com/switchboard-xyz/sui.git"
subdir = "on_demand/"
rev = "mainnet"  # or "testnet"

[dependencies.Sui]
git = "https://github.com/MystenLabs/sui.git"
subdir = "crates/sui-framework/packages/sui-framework"
rev = "framework/mainnet"  # or "framework/testnet"
```

### 2. Import in Your Move Module

```move
use switchboard::quote::{QuoteVerifier, Quotes};
use switchboard::decimal::Decimal;
```

### 3. Add Quote Verifier to Your Struct

```move
public struct MyProtocol has key {
    id: UID,
    quote_verifier: QuoteVerifier,
    // ... your other fields
}
```

### 4. TypeScript Dependencies

```bash
npm install @switchboard-xyz/sui-sdk @mysten/sui
```

## Available Feeds

| Asset | Feed Hash |
|-------|-----------|
| BTC/USD | `0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812` |
| ETH/USD | `0xa0950ee5ee117b2e2c30f154a69e17bfb489a7610c508dc5f67eb2a14616d8ea` |
| SOL/USD | `0x822512ee9add93518eca1c105a38422841a76c590db079eebb283deb2c14caa9` |
| SUI/USD | `0x7ceef94f404e660925ea4b33353ff303effaf901f224bdee50df3a714c1299e9` |

Find more feeds at the [Switchboard Explorer](https://ondemand.switchboard.xyz/).

## Deployments

| Network | Package ID |
|---------|------------|
| Mainnet | `0xa81086572822d67a1559942f23481de9a60c7709c08defafbb1ca8dffc44e210` |
| Testnet | `0x28005599a66e977bff26aeb1905a02cda5272fd45bb16a5a9eb38e8659658cff` |

## Troubleshooting

### "EInvalidQuote"
- The requested feed hash is not in the quotes
- Verify the feed hash is correct and included in `fetchUpdateQuote()`

### "EQuoteExpired"
- Quote data is older than 10 seconds
- Fetch fresh data before calling `update_price()`
- Check network latency

### "EPriceDeviationTooHigh"
- Price changed more than the configured `max_deviation_bps`
- This can happen during high volatility
- Adjust the threshold if needed for your use case

### "EInvalidQueue"
- The quotes are from a different oracle queue
- Verify you're using the correct queue ID for your network (mainnet vs testnet)

### Build Errors

```bash
# Clean and rebuild
rm -rf build/
npm run build

# For testnet
npm run build:testnet
```

## Next Steps

- **Multiple Feeds**: Pass multiple feed hashes to `fetchUpdateQuote()` to update several prices in one transaction
- **Real-time Streaming**: See the [Surge Price Stream](surge-price-stream.md) tutorial for WebSocket-based streaming
- **Custom Feeds**: Learn how to create custom data feeds in the [Custom Feeds](../../../custom-feeds/README.md) section
