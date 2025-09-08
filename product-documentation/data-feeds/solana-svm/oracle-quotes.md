# Oracle Quotes Overview

## Overview

Oracle Quotes represent a paradigm shift in how oracle data is delivered on Solana, eliminating write locks and reducing costs by 90%. With the new **Ed25519 signature verification**, Oracle Quotes now require only **485 compute units** for single feed verification, making them the most cost-efficient oracle solution on Solana.

### 🚀 No Data Feed Accounts Required

Unlike traditional oracle solutions, Oracle Quotes require **ZERO setup**:

* ❌ No need to create data feed accounts
* ❌ No need to fund accounts with SOL
* ❌ No need to manage account permissions
* ✅ Just fetch a feed hash and start using prices immediately!

## Why are Oracle Quotes faster than other oracle solutions?

```
Traditional Approach (Higher Cost):
Oracle → Feed Account (write) → Your Program (read)
         ↑ Write Lock Required

Oracle Quotes Method (90% Lower Cost):
Oracle → Oracle Quote → Your Program (direct use)
         ↑ No Write Lock!
```

## Key Benefits

| Feature              | Oracle Quotes (Ed25519) | Traditional Feeds |
| -------------------- | ----------------------- | ----------------- |
| **Transaction Cost** | ~0.00015 SOL           | ~0.002 SOL        |
| **Update Latency**   | <1 second              | 2-10 seconds      |
| **Write Locks**      | None                   | Required          |
| **Setup Time**       | Instant                | 5-10 minutes      |
| **Parallel Access**  | Unlimited              | Limited           |
| **Compute Units**    | 485 CU                 | 3,000+ CU         |

## How Oracle Quotes Work

The Oracle Quotes method consists of two key components working together:

### 1. **Client-Side Oracle Quote Fetch**

```typescript
import * as sb from "@switchboard-xyz/on-demand";

// Fetch the latest oracle quote with Ed25519 optimization
const [sigVerifyIx, oracleQuote] = await queue.fetchUpdateBundleIx(gateway, crossbar, [
  "0xYOUR_FEED_HASH_HERE"
]);

// Create your program instruction
const updateIx = await program.methods
  .verifyQuote()
  .accounts({
    oracle: oraclePda,
    queue: queue.pubkey,
    // ... other accounts
  })
  .instruction();

// Submit both instructions together
const tx = await sb.asV0Tx({
  connection,
  ixs: [sigVerifyIx, updateIx], // Ed25519 verify + your program
  signers: [wallet],
  lookupTables: [lut],
});
```

### 2. **On-Chain Signature Verification**

Your program receives the Ed25519 instruction and validates the oracle signatures:

### 3. **Ultra-Fast On-Chain Verification**

The Ed25519 verification process uses advanced optimizations for minimal compute cost:

```rust
use switchboard_on_demand::{
    QuoteVerifier, QueueAccountData, SlotHashes, Instructions
};

// Ed25519 verification with zero-copy parsing and batch validation
let quote = QuoteVerifier::new()
    .slothash_sysvar(&slothashes)
    .ix_sysvar(&instructions)  // Ed25519 instruction parsing
    .clock(parse_clock(&clock))
    .queue(&queue)
    .verify_account(&oracle)   // Single memcmp validates all signatures
    .unwrap();

// Access verified feed data
for feed_info in quote.feeds() {
    msg!("Feed ID: {}, value: {}", feed_info.hex_id(), feed_info.value());
}
```

## Oracle Quote Architecture Deep Dive

### Ed25519 Signature Verification Optimizations

The Oracle Quotes system leverages several advanced optimizations:

1. **Batch Signature Validation**: All oracle signatures are validated in a single Ed25519 instruction
2. **Zero-Copy Parsing**: No memory allocation during verification
3. **Precompiled Operations**: Uses Solana's native Ed25519 precompile for maximum efficiency
4. **Optimized Account Layout**: Minimal account reads through strategic data organization

### Performance Comparison

| Operation | Oracle Quotes | Traditional Feeds | Improvement |
| --------- | ------------- | ----------------- | ----------- |
| **Signature Verification** | 485 CU | 3,000+ CU | 6x faster |
| **Data Access** | Direct read | Account + deserialize | 4x faster |
| **Total Transaction Cost** | ~0.00015 SOL | ~0.002 SOL | 90% cheaper |

## Security Model

Oracle Quotes maintain the same security guarantees as traditional feeds:

- **Multi-Oracle Consensus**: Requires signatures from multiple independent oracles
- **Slashable Security**: Oracles have economic stake that can be slashed for misbehavior
- **Freshness Validation**: Built-in staleness checks prevent replay attacks
- **Cryptographic Integrity**: Ed25519 signatures ensure data authenticity

## Getting Started

### 1. **Quick Start (30 seconds to first price)**

```bash
# Clone the examples repository
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd solana

# Get a feed hash from https://explorer.switchboardlabs.xyz/
# Run the Oracle Quotes example
bun run scripts/feeds/runUpdate.ts --feedHash YOUR_FEED_HASH
```

### 2. **Integration Steps**

1. **Install SDK**: `npm i @switchboard-xyz/on-demand`
2. **Add Rust Crate**: `cargo add switchboard-on-demand`
3. **Fetch Oracle Quote**: Use `fetchUpdateBundleIx()` client-side
4. **Verify On-Chain**: Use `QuoteVerifier` in your program
5. **Access Data**: Extract verified feed values for your logic

### 3. **Complete Integration Example**

```typescript
// Client-side: Fetch Oracle Quote
const [sigVerifyIx, oracleQuote] = await queue.fetchUpdateBundleIx(
  gateway, crossbar, [feedHash]
);

// Your program instruction
const tradeIx = await program.methods
  .executeSwap(amountIn, minAmountOut)
  .accounts({
    oracle: oraclePda,
    queue: queue.pubkey,
    // ... other accounts
  })
  .instruction();

// Execute atomically
const tx = await sb.asV0Tx({
  connection,
  ixs: [sigVerifyIx, tradeIx],
  signers: [wallet],
});
```

```rust
// Program-side: Verify Oracle Quote
#[program]
pub mod my_dex {
    use super::*;

    pub fn execute_swap(
        ctx: Context<SwapAccounts>, 
        amount_in: u64, 
        min_amount_out: u64
    ) -> Result<()> {
        // Verify oracle quote
        let quote = QuoteVerifier::new()
            .slothash_sysvar(&ctx.accounts.sysvars.slothashes)
            .ix_sysvar(&ctx.accounts.sysvars.instructions)
            .clock(parse_clock(&ctx.accounts.sysvars.clock))
            .queue(&ctx.accounts.queue)
            .verify_account(&ctx.accounts.oracle)?;

        // Get price from verified quote
        let price_feed = quote.feeds().next().unwrap();
        let current_price = price_feed.value();

        // Execute swap with verified price
        let amount_out = calculate_swap(amount_in, current_price);
        require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);
        
        // ... swap logic
        Ok(())
    }
}
```

## Real-World Examples

### DeFi Lending Protocol

```rust
pub fn liquidate_position(ctx: Context<Liquidate>) -> Result<()> {
    // Verify the oracle quote
    let quote = QuoteVerifier::new()
        .slothash_sysvar(&ctx.accounts.sysvars.slothashes)
        .ix_sysvar(&ctx.accounts.sysvars.instructions)
        .clock(parse_clock(&ctx.accounts.sysvars.clock))
        .queue(&ctx.accounts.queue)
        .verify_account(&ctx.accounts.oracle)?;

    // Extract BTC price from the verified quote
    let btc_feed = quote.feeds().next().unwrap(); // Assuming first feed is BTC
    let btc_price = btc_feed.value();

    // Check if position is underwater
    let ltv = calculate_ltv(ctx.accounts.position, btc_price);
    require!(ltv > LIQUIDATION_THRESHOLD, ErrorCode::PositionHealthy);

    // Execute liquidation...
    Ok(())
}
```

### Perpetual DEX

```typescript
// Fetch multiple price Oracle Quotes for a perps exchange
const [sigVerifyIx, oracleQuote] = await queue.fetchUpdateBundleIx(
  gateway, crossbar, [
    "0xBTC_FEED_HASH",
    "0xETH_FEED_HASH", 
    "0xSOL_FEED_HASH"
  ]
);

const openPositionIx = await perpProgram.methods
  .openPosition(size, leverage)
  .accounts({
    oracle: oraclePda,
    queue: queue.pubkey,
    trader: wallet.publicKey,
    // ... other accounts
  })
  .instruction();

// Execute with minimal latency
const tx = await sb.asV0Tx({
  connection,
  ixs: [sigVerifyIx, openPositionIx],
  signers: [wallet],
  computeUnitPrice: 50_000, // Higher priority for MEV protection
});
```

## Migration from Traditional Feeds

Oracle Quotes are designed to be a drop-in replacement for traditional feeds:

### Before (Traditional Feeds)
```rust
// Required: Create and fund feed accounts
// Higher compute cost, write locks, slower updates

let feed_account = ctx.accounts.price_feed.load()?;
let price = feed_account.get_result()?.try_into()?;
```

### After (Oracle Quotes)  
```rust
// No setup required, instant access, 90% lower cost

let quote = QuoteVerifier::new()
    .verify_account(&ctx.accounts.oracle)?;
let price = quote.feeds().next().unwrap().value();
```

## Frequently Asked Questions

**Q: Do Oracle Quotes work on all Solana networks?**
A: Yes! Oracle Quotes work on Mainnet, Devnet, and Testnet with the same API.

**Q: Can I batch multiple feeds in one Oracle Quote?**
A: Yes! You can include multiple feed hashes in a single `fetchUpdateBundleIx()` call.

**Q: What's the maximum number of feeds per Oracle Quote?**  
A: The limit depends on transaction size constraints, but typically 10-20 feeds per quote.

**Q: How fresh is the oracle data?**
A: Oracle Quotes are typically updated within 1 second of price changes, with built-in staleness validation.

**Q: Are Oracle Quotes more secure than traditional feeds?**
A: Yes! Same security model but with additional Ed25519 cryptographic verification and no write lock attack vectors.

---

**Ready to get started?** Check out our [complete integration examples](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana) and start building with Oracle Quotes today!