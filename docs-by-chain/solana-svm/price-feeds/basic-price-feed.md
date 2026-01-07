# Basic Price Feed

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/feeds/basic](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/feeds/basic)

This tutorial walks you through the simplest way to integrate Switchboard oracle price feeds into your Solana program. You'll learn how to read verified price data using Switchboard's managed update system.

## What You'll Build

A minimal Anchor program that reads price feed data from a Switchboard oracle account, plus a TypeScript client that fetches fresh oracle data and calls your program.

## Prerequisites

- Rust and Cargo installed
- Solana CLI installed and configured
- Node.js 18+ and npm/pnpm
- Basic understanding of Anchor framework
- A Solana keypair with SOL (devnet or mainnet)

## Key Concepts

Before diving into the code, let's understand how Switchboard's managed update system works.

### Managed Updates

Switchboard uses a **managed update system** where oracle data is stored in canonical accounts derived deterministically from feed IDs. This means:

- No manual account management needed
- Same feed IDs always produce the same oracle account address
- Accounts are created automatically if they don't exist

### The Two-Instruction Pattern

Every Switchboard oracle update requires two instructions in sequence:

1. **Ed25519 Signature Verification** - Verifies the oracle operator's signature
2. **Quote Program Storage** - Stores the verified data in the canonical oracle account

Your program then reads from this oracle account as a third instruction in the same transaction.

### Feed IDs

Each price feed has a unique 32-byte hex identifier. You can find feed IDs in the [Switchboard Explorer](https://ondemand.switchboard.xyz/).

Example: BTC/USD feed ID:
```
4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
```

## The On-Chain Program

Here's the complete Anchor program that reads oracle data:

```rust
use anchor_lang::prelude::*;
use switchboard_on_demand::{
    SlotHashes, Instructions, default_queue, SwitchboardQuoteExt, SwitchboardQuote
};

declare_id!("9kVBXoCrvZgKYWTJ74w3S8wAp7daEB7zpG7kwiXxkCVN");

#[program]
pub mod basic_oracle_example {
    use super::*;

    /// Read and verify oracle data from the managed oracle account
    pub fn read_oracle_data(ctx: Context<ReadOracleData>) -> Result<()> {
        // Access the oracle data directly
        let feeds = &ctx.accounts.quote_account.feeds;

        // Calculate staleness (how old is the data?)
        let current_slot = ctx.accounts.sysvars.clock.slot;
        let quote_slot = ctx.accounts.quote_account.slot;
        let staleness = current_slot.saturating_sub(quote_slot);

        msg!("Number of feeds: {}", feeds.len());
        msg!("Quote slot: {}, Current slot: {}", quote_slot, current_slot);
        msg!("Staleness: {} slots", staleness);

        // Process each feed
        for (i, feed) in feeds.iter().enumerate() {
            msg!("Feed {}: ID = {}", i, feed.hex_id());
            msg!("Feed {}: Value = {}", i, feed.value());

            // Your business logic here!
            // - Store the price in your program state
            // - Trigger events based on price changes
            // - Use the price for calculations
        }

        msg!("Successfully read {} oracle feeds!", feeds.len());
        Ok(())
    }
}

/// Account context for reading oracle data
#[derive(Accounts)]
pub struct ReadOracleData<'info> {
    /// The canonical oracle account containing verified quote data
    /// The address constraint ensures this is the correct canonical account
    #[account(address = quote_account.canonical_key(&default_queue()))]
    pub quote_account: Box<Account<'info, SwitchboardQuote>>,

    /// System variables required for quote verification
    pub sysvars: Sysvars<'info>,
}

/// System variables required for oracle verification
#[derive(Accounts)]
pub struct Sysvars<'info> {
    pub clock: Sysvar<'info, Clock>,
    pub slothashes: Sysvar<'info, SlotHashes>,
    pub instructions: Sysvar<'info, Instructions>,
}
```

### Code Walkthrough

#### Imports

```rust
use switchboard_on_demand::{
    SlotHashes, Instructions, default_queue, SwitchboardQuoteExt, SwitchboardQuote
};
```

- `SwitchboardQuote` - The account type that holds oracle data
- `SwitchboardQuoteExt` - Extension trait for accessing feed values
- `default_queue()` - Returns the default Switchboard queue for the current network
- `SlotHashes`, `Instructions` - Sysvar types needed for verification

#### The Instruction

The `read_oracle_data` instruction:

1. **Accesses feed data** from `quote_account.feeds`
2. **Calculates staleness** by comparing the quote slot to the current slot
3. **Iterates through feeds** to extract values using `feed.hex_id()` and `feed.value()`

#### Account Validation

```rust
#[account(address = quote_account.canonical_key(&default_queue()))]
pub quote_account: Box<Account<'info, SwitchboardQuote>>,
```

This constraint ensures the passed account is the legitimate canonical oracle account for the contained feeds. It prevents malicious actors from passing fake oracle data.

#### Sysvars

The program requires three sysvars:
- `Clock` - For checking the current slot
- `SlotHashes` - For quote verification
- `Instructions` - For verifying the Ed25519 instruction was included

## The TypeScript Client

Here's the complete client code that fetches oracle data and calls your program:

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";

const FEED_ID = "4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812";

async function main() {
  // Step 1: Load environment (auto-detects network)
  const { program, keypair, connection, crossbar, queue } =
    await sb.AnchorUtils.loadEnv();

  console.log("Queue:", queue.pubkey.toBase58());
  console.log("Network:", crossbar.getNetwork());

  // Step 2: Derive the canonical oracle account from feed ID
  const [quoteAccount] = OracleQuote.getCanonicalPubkey(
    queue.pubkey,
    [FEED_ID]
  );
  console.log("Quote Account:", quoteAccount.toBase58());

  // Step 3: Simulate the feed to see current value
  const simResult = await crossbar.simulateFeed(FEED_ID);
  console.log("Simulated feed result:", simResult);

  // Step 4: Create managed update instructions
  const updateInstructions = await queue.fetchManagedUpdateIxs(
    crossbar,
    [FEED_ID],
    {
      variableOverrides: {},
      instructionIdx: 0,  // Ed25519 instruction index
      payer: keypair.publicKey,
    }
  );

  // Step 5: Create your program's instruction
  const readOracleIx = await program.methods
    .readOracleData()
    .accounts({
      quoteAccount: quoteAccount,
      // Sysvars are added automatically by Anchor
    })
    .instruction();

  // Step 6: Build and send the transaction
  const tx = await sb.asV0Tx({
    connection,
    ixs: [...updateInstructions, readOracleIx],
    signers: [keypair],
    computeUnitPrice: 20_000,
    computeUnitLimitMultiple: 1.1,
  });

  // Step 7: Simulate and send
  const sim = await connection.simulateTransaction(tx);
  console.log(sim.value.logs?.join("\n"));

  if (!sim.value.err) {
    const sig = await connection.sendTransaction(tx);
    console.log("Transaction:", sig);
  }
}

main();
```

### Client Code Walkthrough

#### Step 1: Load Environment

```typescript
const { program, keypair, connection, crossbar, queue } =
  await sb.AnchorUtils.loadEnv();
```

This auto-detects whether you're on mainnet or devnet based on your RPC endpoint and loads the appropriate Switchboard queue.

#### Step 2: Derive Canonical Account

```typescript
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [FEED_ID]);
```

The canonical account is a PDA derived from the queue public key and feed IDs. This ensures the same inputs always produce the same account address.

#### Step 3: Simulate Feed (Optional)

```typescript
const simResult = await crossbar.simulateFeed(FEED_ID);
```

You can simulate a feed to see what value the oracle would return before submitting a transaction.

#### Step 4: Create Update Instructions

```typescript
const updateInstructions = await queue.fetchManagedUpdateIxs(
  crossbar,
  [FEED_ID],
  {
    variableOverrides: {},
    instructionIdx: 0,
    payer: keypair.publicKey,
  }
);
```

This returns an array of instructions:
1. Ed25519 signature verification instruction
2. Quote program `verified_update` instruction

#### Step 5-7: Build and Send Transaction

The transaction includes:
1. Ed25519 verification instruction
2. Quote program update instruction
3. Your program's instruction

All three must be in the same transaction for the verification to work.

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

### 3. Configure Your Environment

Create or update your Solana CLI config to point to devnet:

```bash
solana config set --url devnet
```

Ensure your keypair has SOL:

```bash
solana airdrop 2
```

### 4. Build and Deploy the Program (Optional)

If you want to deploy your own instance:

```bash
anchor build
anchor deploy
```

### 5. Run the Example

```bash
# Using default BTC/USD feed
npm run feeds:managed

# Using a custom feed ID
npm run feeds:managed -- --feedId=YOUR_FEED_ID_HERE
```

### Expected Output

```
Queue: FdRnYujMnYbAJp5P2rkEYZCbF2TKs2D2yXZ7MYq89Hms
Network: devnet
Quote Account: 8Js7NsQ7sF3WLJN3JC4LJQGz8kHiEJwZ7sdGTtJC5J7d
Simulated feed result: { value: 97234.5, ... }
Number of feeds: 1
Quote slot: 123456789, Current slot: 123456790
Staleness: 1 slots
Feed 0: ID = 4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
Feed 0: Value = 97234.50
Successfully read 1 oracle feeds!
```

## Adding to Your Program

To integrate Switchboard into your own program:

### 1. Add Dependencies

In your `Cargo.toml`:

```toml
[dependencies]
switchboard-on-demand = "0.1"
```

### 2. Add the Account Struct

```rust
use switchboard_on_demand::{
    SlotHashes, Instructions, default_queue, SwitchboardQuoteExt, SwitchboardQuote
};

#[derive(Accounts)]
pub struct YourInstruction<'info> {
    #[account(address = quote_account.canonical_key(&default_queue()))]
    pub quote_account: Box<Account<'info, SwitchboardQuote>>,

    pub clock: Sysvar<'info, Clock>,
    pub slothashes: Sysvar<'info, SlotHashes>,
    pub instructions: Sysvar<'info, Instructions>,

    // ... your other accounts
}
```

### 3. Read the Price

```rust
pub fn your_instruction(ctx: Context<YourInstruction>) -> Result<()> {
    let feeds = &ctx.accounts.quote_account.feeds;

    // Get the first feed's value
    let price = feeds[0].value();

    // Use the price in your logic
    // ...

    Ok(())
}
```

## Next Steps

- **Multiple Feeds**: Pass multiple feed IDs to `fetchManagedUpdateIxs` to update several prices in one transaction
- **Staleness Checks**: Add maximum staleness requirements for your use case
- **Custom Feeds**: Learn how to create custom data feeds in the [Custom Feeds](../../../custom-feeds/README.md) section
- **Advanced Patterns**: See the Advanced Price Feed tutorial for more complex integration patterns
