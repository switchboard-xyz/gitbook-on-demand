# Basic Price Feed

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/feeds/basic](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/feeds/basic)

This tutorial shows the beginner-first Switchboard flow on Solana: update one feed, read `feeds[0]`, and log a human-readable price inside your program.

> **Version source of truth:** [SDK Version Matrix](../../../tooling/sdk-version-matrix.md)

## What You'll Build

- A minimal Anchor instruction that reads one verified price from a canonical quote account
- A TypeScript client flow that fetches a fresh managed update and optionally calls the sample consumer program in the same transaction

## Prerequisites

- Rust and Cargo installed
- Solana CLI installed and configured
- Node.js 18+
- A Solana keypair with SOL on devnet or mainnet

## Pick a Feed ID

Every feed has a 32-byte hex ID. For this Solana example, pass feed IDs as bare 64-character hex values.

To find a feed ID:

1. Open [Switchboard Explorer](https://explorer.switchboardlabs.xyz/).
2. Search for the asset you want, for example `SOL`.
3. Copy the feed ID for the network you are using.
4. If Explorer shows `0x...`, remove the `0x` prefix before passing it to the example scripts.

Default BTC/USD example feed ID:

```text
4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
```

Example SOL/USD devnet feed ID:

```text
822512ee9add93518eca1c105a38422841a76c590db079eebb283deb2c14caa9
```

## The On-Chain Program

The basic consumer program is intentionally single-feed oriented. It reads `feeds[0]`, logs the human-readable value, and keeps the account surface small.

```rust
use anchor_lang::prelude::*;
use switchboard_on_demand::{default_queue, SwitchboardQuote, SwitchboardQuoteExt};

declare_id!("HWZNh846V4VVdp5mkeYaeYQjGo47F1Uax38ViYY1VvrK");

#[program]
pub mod basic_oracle_example {
    use super::*;

    pub fn read_oracle_data(ctx: Context<ReadOracleData>) -> Result<()> {
        let feeds = &ctx.accounts.quote_account.feeds;
        require!(!feeds.is_empty(), BasicOracleError::MissingFeed);
        let feed = &feeds[0];

        let current_slot = ctx.accounts.sysvars.clock.slot;
        let quote_slot = ctx.accounts.quote_account.slot;
        let staleness = current_slot.saturating_sub(quote_slot);

        msg!("Feed count: {}", feeds.len());
        if feeds.len() > 1 {
            msg!("Using feed[0] in this basic example");
        }

        msg!("Quote slot: {}, Current slot: {}", quote_slot, current_slot);
        msg!("Staleness: {} slots", staleness);
        let feed_id = feed.hex_id();
        let feed_id = feed_id.strip_prefix("0x").unwrap_or(feed_id.as_str());
        msg!("Feed ID: {}", feed_id);
        msg!("Feed value (human-readable): {}", feed.value());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadOracleData<'info> {
    #[account(address = quote_account.canonical_key(&default_queue()))]
    pub quote_account: Box<Account<'info, SwitchboardQuote>>,
    pub sysvars: Sysvars<'info>,
}

#[derive(Accounts)]
pub struct Sysvars<'info> {
    pub clock: Sysvar<'info, Clock>,
}

#[error_code]
pub enum BasicOracleError {
    #[msg("quote_account did not contain any feeds")]
    MissingFeed,
}
```

### What `feed.value()` returns

`feed.value()` is already human-readable. Use it when you want to log or inspect the price directly.

If your protocol stores prices as fixed-point integers, scale and convert that value explicitly in your own logic. The basic example does not hide that conversion for you.

## Managed Update Flow

The client side follows this sequence:

1. Load the Switchboard queue for the current network
2. Derive the canonical quote account for one feed ID
3. Build the managed update instructions with `fetchManagedUpdateIxs`
4. Optionally append your consumer instruction
5. Simulate, send, and confirm the transaction

Core TypeScript flow:

```typescript
import * as anchor from "@coral-xyz/anchor";
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";

const feedId =
  "4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812";

const { keypair, connection, crossbar, queue } = await sb.AnchorUtils.loadEnv();
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);

const updateIxs = await queue.fetchManagedUpdateIxs(crossbar, [feedId], {
  instructionIdx: 0,
  payer: keypair.publicKey,
});

const readOracleIx = await basicProgram.methods.readOracleData().accounts({
  quoteAccount,
  sysvars: {
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },
}).instruction();

const tx = await sb.asV0Tx({
  connection,
  ixs: [...updateIxs, readOracleIx],
  signers: [keypair],
});

const sim = await connection.simulateTransaction(tx);
if (!sim.value.err) {
  const sig = await connection.sendTransaction(tx);
  await connection.confirmTransaction(sig, "confirmed");
}
```

## Running the Example

### 1. Clone the examples repo

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/solana/feeds/basic
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Solana for devnet

```bash
solana config set --url devnet
solana airdrop 2
```

If you are running in CI or a container, you can set `ANCHOR_PROVIDER_URL` and
`ANCHOR_WALLET` instead of relying on the Solana CLI config file.

### 4. Run the basic managed update

Default BTC/USD flow:

```bash
npm run update
```

SOL/USD flow:

```bash
npm run update -- --feedId 822512ee9add93518eca1c105a38422841a76c590db079eebb283deb2c14caa9
```

This always updates the canonical quote account. If the sample consumer program is not built and deployed yet, the script still submits the managed update and tells you it skipped the consumer step.

### 5. Optional: build and deploy the sample consumer

If you want the example transaction to call `read_oracle_data` after the quote update:

```bash
npm run build
solana program deploy --program-id target/deploy/basic_oracle_example-keypair.json target/deploy/basic_oracle_example.so
```

Then run `npm run update` again. The same command will now append the sample consumer instruction and you should see the on-chain logs in the simulated output.

### Expected output

Without the sample consumer deployed, you should see output like:

```text
✨ Generated instructions: 2
✅ Transaction sent: 5c...
✅ Managed update confirmed
ℹ️  The quote account was updated without the example consumer instruction
```

With the sample consumer deployed, you should also see logs like:

```text
Feed count: 1
Quote slot: 123456789, Current slot: 123456790
Staleness: 1 slots
Feed ID: 4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
Feed value (human-readable): 97234.5
```

## Add This to Your Program

Use the same account pattern in your own Anchor instruction:

```rust
#[derive(Accounts)]
pub struct YourInstruction<'info> {
    #[account(address = quote_account.canonical_key(&default_queue()))]
    pub quote_account: Box<Account<'info, SwitchboardQuote>>,
    pub sysvars: Sysvars<'info>,
}
```

Then read the first feed:

```rust
pub fn your_instruction(ctx: Context<YourInstruction>) -> Result<()> {
    let feeds = &ctx.accounts.quote_account.feeds;
    require!(!feeds.is_empty(), YourError::MissingFeed);

    let price = feeds[0].value();
    msg!("Price: {}", price);
    Ok(())
}
```

## Next Steps

- **Another asset**: Search [Switchboard Explorer](https://explorer.switchboardlabs.xyz/) and swap the feed ID
- **Multiple feeds**: Batch multiple IDs in one managed update transaction once the single-feed path is clear
- **Advanced verification**: Move to the [Advanced Price Feed Tutorial](advanced-price-feed.md) if you need stricter account validation or more control over update policy
