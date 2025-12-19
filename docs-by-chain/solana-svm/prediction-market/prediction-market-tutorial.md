# Prediction Market Tutorial

This tutorial demonstrates how to **verify oracle feed configurations on-chain** using Kalshi prediction market data. You'll learn a critical security pattern that prevents oracle substitution attacks.

## The Problem: Oracle Substitution Attacks

When using oracle data in your program, how do you know the oracle is fetching data from the sources you expect? A malicious actor could:

1. Create a similar-looking oracle feed with different (manipulated) data sources
2. Pass that feed to your program
3. Exploit your program with incorrect data

**Example Attack:**
- Your program expects BTC price from Binance + Coinbase
- Attacker creates a feed that looks similar but fetches from a manipulated source
- Your liquidation logic uses the wrong price

## The Solution: Feed ID Verification

Switchboard feed IDs are **deterministic SHA-256 hashes** of the feed's protobuf definition:

```
Feed Definition → Protobuf Encoding → SHA-256 Hash → Feed ID
```

By recreating the expected feed configuration on-chain and comparing its hash to the oracle's feed ID, you cryptographically prove the oracle uses exactly the data sources you expect.

## What You'll Build

A Solana program that:
1. Receives oracle data for a Kalshi prediction market order
2. Recreates the expected feed configuration on-chain
3. Verifies the feed ID matches before trusting the data

## Prerequisites

- Rust and Cargo installed
- Anchor framework familiarity
- Solana CLI installed and configured
- Kalshi API credentials (API key ID and private key)

## Key Concepts

### Feed ID Derivation

Feed IDs are derived by:
1. Constructing an `OracleFeed` protobuf message
2. Encoding it as length-delimited bytes
3. Computing SHA-256 hash

```rust
let bytes = OracleFeed::encode_length_delimited_to_vec(&feed);
let feed_id = hash(&bytes).to_bytes();
```

### QuoteVerifier

The `QuoteVerifier` uses a builder pattern to verify Ed25519 signatures from oracle operators:

```rust
let quote = QuoteVerifier::new()
    .queue(queue_account)
    .slothash_sysvar(slothashes)
    .ix_sysvar(instructions)
    .clock_slot(current_slot)
    .verify_instruction_at(0)?;
```

### Variable Overrides

Kalshi requires authentication. Variables like `${KALSHI_API_KEY_ID}` are placeholders that get replaced at runtime when fetching the quote:

```typescript
const quote = await queue.fetchQuoteIx(crossbar, [feed], {
  variableOverrides: {
    KALSHI_API_KEY_ID: "your-key-id",
    KALSHI_SIGNATURE: signature,
    KALSHI_TIMESTAMP: timestamp,
  },
});
```

## The On-Chain Program

### Dependencies

```toml
[dependencies]
anchor-lang = "0.31.1"
switchboard-on-demand = { version = "0.9.2", features = ["anchor", "devnet"] }
switchboard-protos = { version = "^0.2.1", features = ["serde"] }
prost = "0.13"
solana-program = "3.0.0"
faster-hex = "0.10.0"
```

### Program Structure

```rust
use anchor_lang::prelude::*;
use switchboard_on_demand::{SlotHashes, Instructions, QuoteVerifier};
use switchboard_protos::OracleFeed;
use switchboard_protos::OracleJob;
use switchboard_protos::oracle_job::oracle_job::{KalshiApiTask, JsonParseTask, Task};
use switchboard_protos::oracle_job::oracle_job::task;
use switchboard_on_demand::QueueAccountData;
use switchboard_on_demand::default_queue;
use prost::Message;
use solana_program::hash::hash;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod prediction_market {
    use super::*;

    pub fn verify_kalshi_feed(
        ctx: Context<VerifyFeed>,
        order_id: String,
    ) -> Result<()> {
        // Step 1: Create QuoteVerifier with builder pattern
        let mut verifier = QuoteVerifier::new();
        verifier
            .queue(ctx.accounts.queue.as_ref())
            .slothash_sysvar(ctx.accounts.slothashes.as_ref())
            .ix_sysvar(ctx.accounts.instructions.as_ref())
            .clock_slot(Clock::get()?.slot);

        // Step 2: Verify the Ed25519 instruction at index 0
        let quote = verifier.verify_instruction_at(0).unwrap();

        // Step 3: Extract feed ID from verified quote
        let feeds = quote.feeds();
        require!(!feeds.is_empty(), ErrorCode::NoOracleFeeds);

        let feed = &feeds[0];
        let actual_feed_id = feed.feed_id();

        // Step 4: Recreate expected feed ID and verify match
        require!(
            *actual_feed_id == create_kalshi_feed_id(&order_id)?,
            ErrorCode::FeedMismatch
        );

        msg!("Feed ID verification successful!");
        msg!("Feed ID: {}", faster_hex::hex_string(actual_feed_id));
        msg!("Order ID: {}", order_id);

        Ok(())
    }
}
```

### Feed ID Recreation

The critical function that recreates the expected feed configuration:

```rust
fn create_kalshi_feed_id(order_id: &str) -> Result<[u8; 32]> {
    // Build the Kalshi API URL
    let url = format!(
        "https://api.elections.kalshi.com/trade-api/v2/portfolio/orders/{}",
        order_id
    );

    // Construct the exact feed definition
    let feed = OracleFeed {
        name: Some("Kalshi Order Price".to_string()),
        jobs: vec![
            OracleJob {
                tasks: vec![
                    // Task 1: Fetch from Kalshi API
                    Task {
                        task: Some(task::Task::KalshiApiTask(KalshiApiTask {
                            url: Some(url.clone()),
                            api_key_id: Some("${KALSHI_API_KEY_ID}".to_string()),
                            signature: Some("${KALSHI_SIGNATURE}".to_string()),
                            timestamp: Some("${KALSHI_TIMESTAMP}".to_string()),
                            ..Default::default()
                        })),
                    },
                    // Task 2: Parse JSON response
                    Task {
                        task: Some(task::Task::JsonParseTask(JsonParseTask {
                            path: Some("$.order.yes_price_dollars".to_string()),
                            ..Default::default()
                        })),
                    },
                ],
                weight: None,
            }
        ],
        min_job_responses: Some(1),
        min_oracle_samples: Some(1),
        max_job_range_pct: Some(0),
    };

    // Encode as protobuf and hash
    let bytes = OracleFeed::encode_length_delimited_to_vec(&feed);
    Ok(hash(&bytes).to_bytes())
}
```

### Account Context

```rust
#[derive(Accounts)]
pub struct VerifyFeed<'info> {
    /// The Switchboard queue - must be the default queue
    #[account(address = default_queue())]
    pub queue: AccountLoader<'info, QueueAccountData>,

    /// SlotHashes sysvar for signature verification
    pub slothashes: Sysvar<'info, SlotHashes>,

    /// Instructions sysvar for Ed25519 verification
    pub instructions: Sysvar<'info, Instructions>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No oracle feeds available")]
    NoOracleFeeds,

    #[msg("Feed hash mismatch - oracle feed does not match expected configuration")]
    FeedMismatch,
}
```

## The TypeScript Client

### Kalshi Authentication

Kalshi uses RSA-PSS-SHA256 signatures for API authentication:

```typescript
import * as crypto from "crypto";
import * as fs from "fs";

function loadPrivateKey(keyPath: string): crypto.KeyObject {
  const privateKeyPem = fs.readFileSync(keyPath, "utf8");
  return crypto.createPrivateKey(privateKeyPem);
}

function createSignature(
  privateKey: crypto.KeyObject,
  timestamp: string,
  method: string,
  path: string
): string {
  const message = `${timestamp}${method}${path}`;
  const messageBuffer = Buffer.from(message, "utf8");

  const signature = crypto.sign("sha256", messageBuffer, {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString("base64");
}
```

### Complete Client Flow

```typescript
import { CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

async function verifyKalshiFeed(
  apiKeyId: string,
  privateKeyPath: string,
  orderId: string
) {
  // Step 1: Load Switchboard environment
  const { program, keypair, connection } = await sb.AnchorUtils.loadEnv();
  const queue = await sb.Queue.loadDefault(program!);
  const crossbar = new CrossbarClient("https://crossbar.switchboardlabs.xyz");

  // Step 2: Create Kalshi authentication
  const privateKey = loadPrivateKey(privateKeyPath);
  const method = "GET";
  const path = `/trade-api/v2/portfolio/orders/${orderId}`;
  const timestamp = Date.now().toString();
  const signature = createSignature(privateKey, timestamp, method, path);

  // Step 3: Define the oracle feed
  const oracleFeed = {
    name: "Kalshi Order Price",
    minJobResponses: 1,
    minOracleSamples: 1,
    maxJobRangePct: 0,
    jobs: [
      {
        tasks: [
          {
            kalshiApiTask: {
              url: `https://api.elections.kalshi.com${path}`,
              apiKeyId: "${KALSHI_API_KEY_ID}",
              signature: "${KALSHI_SIGNATURE}",
              timestamp: "${KALSHI_TIMESTAMP}",
            },
          },
          {
            jsonParseTask: {
              path: "$.order.yes_price_dollars",
            },
          },
        ],
      },
    ],
  };

  // Step 4: Simulate the feed (optional, for testing)
  const simulation = await crossbar.simulateFeed(oracleFeed, true, {
    KALSHI_SIGNATURE: signature,
    KALSHI_TIMESTAMP: timestamp,
    KALSHI_API_KEY_ID: apiKeyId,
  });
  console.log("Simulated value:", simulation.results[0]);

  // Step 5: Fetch quote instruction with credentials
  const quoteIx = await queue.fetchQuoteIx(crossbar, [oracleFeed], {
    numSignatures: 1,
    variableOverrides: {
      KALSHI_SIGNATURE: signature,
      KALSHI_TIMESTAMP: timestamp,
      KALSHI_API_KEY_ID: apiKeyId,
    },
    instructionIdx: 0,
    payer: keypair.publicKey,
  });

  // Step 6: Create verification instruction
  const verifyIx = await yourProgram.methods
    .verifyKalshiFeed(orderId)
    .accounts({
      queue: queue.pubkey,
      slothashes: sb.SYSVAR_SLOTHASHES_PUBKEY,
      instructions: sb.SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();

  // Step 7: Build and send transaction
  const tx = await sb.asV0Tx({
    connection,
    ixs: [quoteIx, verifyIx],
    signers: [keypair],
    computeUnitPrice: 20_000,
    computeUnitLimitMultiple: 1.1,
  });

  const sim = await connection.simulateTransaction(tx);
  console.log("Verification logs:", sim.value.logs);
}
```

## Running the Example

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/solana
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build and Deploy the Program

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### 4. Get Kalshi API Credentials

1. Sign up at [Kalshi](https://kalshi.com)
2. Generate API credentials in your account settings
3. Download your private key PEM file

### 5. Run the Verification

```bash
bun run scripts/prediction-market-examples/testKalshiFeedVerification.ts \
  --api-key-id YOUR_API_KEY_ID \
  --private-key-path /path/to/kalshi/private-key.pem \
  --order-id YOUR_ORDER_ID
```

### Expected Output

```
Kalshi Feed Verification Test
==================================

Configuration:
  API Key ID: abc123...
  Order ID: 12345678-1234-1234-1234-123456789012
  Crossbar URL: https://crossbar.switchboardlabs.xyz

Solana Configuration:
  Wallet: 7Js...
  Queue: FdRn...

Creating Oracle Feed Definition...
Simulating Feed with Crossbar...
  Simulation Result: 0.65...

Fetching quote instruction...
  Successfully fetched quote instruction

Transaction Simulated

Transaction Simulation Logs:
[
  "Program YOUR_PROGRAM_ID invoke",
  "Feed ID verification successful!",
  "Feed ID: 4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812",
  "Order ID: 12345678-1234-1234-1234-123456789012",
  "Program YOUR_PROGRAM_ID success"
]
```

## Use Cases

### 1. Prediction Market Settlement

Before settling prediction market positions, verify the oracle is using the correct data source:

```rust
// Verify feed configuration before settlement
verify_kalshi_feed(ctx, order_id)?;

// Now safe to use the oracle value
let price = feeds[0].value();
settle_positions(price)?;
```

### 2. Conditional Payments

Release funds only when verified oracle data meets conditions:

```rust
verify_kalshi_feed(ctx, order_id)?;

let yes_price = feeds[0].value();
if yes_price > threshold {
    release_funds()?;
}
```

### 3. DeFi Protocol Integration

Verify oracle configuration before using prices for:
- Liquidations
- Collateral calculations
- Interest rate adjustments

### 4. Compliance & Audit Trails

Prove on-chain that specific data sources were used:

```rust
emit!(FeedVerified {
    feed_id: actual_feed_id,
    order_id: order_id,
    timestamp: Clock::get()?.unix_timestamp,
});
```

## Security Best Practices

### Always Verify Feed Configuration

```rust
// Good: Verify before trusting data
require!(
    *actual_feed_id == create_kalshi_feed_id(&order_id)?,
    ErrorCode::FeedMismatch
);
let price = feeds[0].value();

// Bad: Trust without verification
let price = feeds[0].value(); // Dangerous!
```

### Validate Queue Account

```rust
// Good: Ensure data comes from trusted Switchboard queue
#[account(address = default_queue())]
pub queue: AccountLoader<'info, QueueAccountData>,
```

### Use QuoteVerifier

```rust
// Good: Cryptographically verify oracle signatures
let quote = QuoteVerifier::new()
    .queue(queue)
    .slothash_sysvar(slothashes)
    .ix_sysvar(instructions)
    .clock_slot(slot)
    .verify_instruction_at(0)?;
```

## Extending the Pattern

### Generic HTTP APIs

```rust
Task {
    task: Some(task::Task::HttpTask(HttpTask {
        url: Some("https://api.example.com/data".to_string()),
        method: Some(Method::Get as i32),
        ..Default::default()
    })),
}
```

### Polymarket Integration

```rust
Task {
    task: Some(task::Task::HttpTask(HttpTask {
        url: Some(format!(
            "https://clob.polymarket.com/event/{}",
            event_id
        )),
        ..Default::default()
    })),
}
```

### Multi-Source Validation

Verify multiple feeds use approved sources:

```rust
for (i, feed) in feeds.iter().enumerate() {
    require!(
        *feed.feed_id() == expected_feed_ids[i],
        ErrorCode::FeedMismatch
    );
}
```

## Next Steps

- **Price Feeds**: Learn basic oracle integration in [Basic Price Feed](price-feeds/basic-price-feed.md)
- **Custom Feeds**: Create your own feed definitions in [Custom Feeds](../../../custom-feeds/README.md)
- **Randomness**: Explore verifiable randomness in [Randomness](randomness.md)
