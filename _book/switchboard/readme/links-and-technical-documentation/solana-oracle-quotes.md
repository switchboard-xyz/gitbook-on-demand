---
description: Using Oracle Quotes with Switchboard On-Demand on Solana
---

# Solana Oracle Quotes

Oracle Quotes are the recommended method for consuming Switchboard oracle data on Solana. This approach offers significant advantages over traditional feed accounts:

- **90% Lower Costs**: No feed maintenance fees
- **Sub-second Latency**: Direct oracle-to-program data flow
- **No Write Locks**: Multiple programs can read prices simultaneously
- **Instant Setup**: No accounts to create or maintain

## Quick Start

### 1. Install Dependencies

```bash
npm i @switchboard-xyz/on-demand
cargo add switchboard-on-demand
```

### 2. Client Code (TypeScript)

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { CrossbarClient } from "@switchboard-xyz/common";

// Load environment
const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();

// Initialize components
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new CrossbarClient("https://crossbar.switchboardlabs.xyz");
const gateway = await queue.fetchGatewayFromCrossbar(crossbar as any);
const lut = await queue.loadLookupTable();

// Fetch oracle quote
const sbIx = await queue.fetchUpdateBundleIx(gateway, crossbar as any, [
  "0xYOUR_FEED_HASH_HERE"
]);

// Your program instruction
const updateIx = await program.methods
  .verifyQuote()
  .accounts({
    oracle: oraclePda,
    queue: queue.pubkey,
    // ... other accounts
  })
  .instruction();

// Submit transaction
const tx = await sb.asV0Tx({
  connection,
  ixs: [sbIx, updateIx],
  signers: [keypair],
  lookupTables: [lut],
});

const sig = await connection.sendTransaction(tx);
```

### 3. Program Code (Rust)

```rust
use anchor_lang::prelude::*;
use switchboard_on_demand::clock::parse_clock;
use switchboard_on_demand::{
    QuoteVerifier, QueueAccountData, SlotHashes, OracleQuote, Instructions,
};

#[program]
pub mod my_program {
    use super::*;

    pub fn verify_quote(ctx: Context<VerifyCtx>) -> Result<()> {
        let VerifyCtx { queue, oracle, sysvars, .. } = ctx.accounts;

        // Verify the oracle quote
        let quote = QuoteVerifier::new()
            .slothash_sysvar(&sysvars.slothashes)
            .ix_sysvar(&sysvars.instructions)
            .clock(parse_clock(&sysvars.clock))
            .queue(&queue)
            .verify_account(&oracle)
            .unwrap();

        msg!("Verified slot: {}", quote.slot());
        
        // Access feed data
        for feed_info in quote.feeds() {
            msg!("Feed ID: {}, value: {}", 
                feed_info.hex_id(), 
                feed_info.value()
            );
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyCtx<'info> {
    #[account(seeds = [b"oracle"], bump)]
    pub oracle: AccountLoader<'info, SwitchboardQuote>,
    
    #[account(address = switchboard_on_demand::default_queue())]
    pub queue: AccountLoader<'info, QueueAccountData>,
    
    pub sysvars: Sysvars<'info>,
}

#[derive(Accounts)]
pub struct Sysvars<'info> {
    pub clock: Sysvar<'info, Clock>,
    pub slothashes: Sysvar<'info, SlotHashes>,
    pub instructions: Sysvar<'info, Instructions>,
}

// Required for SwitchboardQuote
switchboard_on_demand::switchboard_anchor_bindings!();
```

## Key Concepts

### Oracle Quotes vs Traditional Feeds

| Feature | Oracle Quotes | Traditional Feeds |
|---------|---------------|-------------------|
| **Update Cost** | ~0.00015 SOL | ~0.002 SOL |
| **Latency** | <1 second | 2-10 seconds |
| **Write Locks** | None | Required |
| **Setup Time** | Instant | 5-10 minutes |
| **Parallel Access** | Unlimited | Limited |

### Architecture Flow

1. **Oracle Network**: Aggregates price data from multiple sources
2. **Gateway**: Signs and delivers oracle quotes on-demand  
3. **Ed25519 Instruction**: Verifies oracle signatures efficiently
4. **Your Program**: Consumes verified price data directly

## Advanced Usage

### Multiple Feed Verification

```rust
pub fn multi_feed_verify(ctx: Context<VerifyCtx>) -> Result<()> {
    let quote = QuoteVerifier::new()
        .slothash_sysvar(&ctx.accounts.sysvars.slothashes)
        .ix_sysvar(&ctx.accounts.sysvars.instructions)
        .clock(parse_clock(&ctx.accounts.sysvars.clock))
        .queue(&ctx.accounts.queue)
        .verify_account(&ctx.accounts.oracle)
        .unwrap();

    // Access specific feeds by their hex ID
    let btc_feed = quote.feed_by_hex_id("0xBTC_FEED_HASH")?;
    let eth_feed = quote.feed_by_hex_id("0xETH_FEED_HASH")?;
    
    msg!("BTC Price: {}", btc_feed.value());
    msg!("ETH Price: {}", eth_feed.value());
    
    Ok(())
}
```

### Error Handling

```rust
pub fn safe_verify(ctx: Context<VerifyCtx>) -> Result<()> {
    match QuoteVerifier::new()
        .slothash_sysvar(&ctx.accounts.sysvars.slothashes)
        .ix_sysvar(&ctx.accounts.sysvars.instructions)
        .clock(parse_clock(&ctx.accounts.sysvars.clock))
        .queue(&ctx.accounts.queue)
        .verify_account(&ctx.accounts.oracle) {
        
        Ok(quote) => {
            // Use verified quote
            msg!("Quote verified for slot: {}", quote.slot());
            Ok(())
        },
        Err(e) => {
            msg!("Verification failed: {:?}", e);
            return Err(ErrorCode::InvalidQuote.into());
        }
    }
}
```

## Examples Repository

For complete examples including client code, program implementations, and advanced patterns, see:

[sb-on-demand-examples/solana](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana)

## Related Documentation

- [Creating a Solana Feed](creating-a-solana-feed.md)
- [Solana Accounts](../../tooling-and-resources/technical-resources-and-documentation/solana-accounts.md)
- [Switchboard On-Demand Docs](https://docs.switchboard.xyz)