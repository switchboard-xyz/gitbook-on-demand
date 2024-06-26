---
description: Tutorial on using existing Switchboard Feeds.
---

# Developers: Quickstart!

Switchboard On-Demand Feeds are designed for maximum, speed, security, and simplicity. This quick-start guide will demonstrate how to use an existing Switchboard On-Demand Feed.&#x20;

For a quick-start guide on creating new feeds via Typescript, see: [Quickstart: Build and Use](broken-reference).

Start with[ Designing a feed](designing-a-feed-svm.md) for a more in-depth walkthrough on the process of creating and deploying with Switchboard.&#x20;

## Step 1: Getting a Solana Feed Public Key

\
Browse our awesome [Explorer ](https://ondemand.switchboard.xyz/)for a feed you like and save the feeds public key! \
\
You can also create a feed in our [On-Demand Builder](https://ondemand.switchboard.xyz/solana/mainnet/build), which is a tool for building and deploying feeds directly from the a user interface. You can use it to pull data from almost anywhere. See the [Designing a Feed](../switchboard-on-evm/designing-a-feed-evm.md) section for more on configuring oracle jobs.

## Step 2: Using Switchboard On-Chain

Add the latest [switchboard-on-demand](https://crates.io/crates/switchboard-on-demand) following to `Cargo.toml` by running:

```bash
# https://crates.io/crates/switchboard-on-demand
cargo add switchboard-on-demand 
```

Then within your Solana Program, you can add the Pull Feed Account into an instruction for use within the program. For example:

```rust
// Switchboard import
use switchboard_on_demand::on_demand::accounts::pull_feed::PullFeedAccountData;

// Include the feed account
#[derive(Accounts)]
pub struct Test<'info> {
    pub feed: AccountInfo<'info>,
}

// Simple Print Utility 
fn fmt(s: &str) -> String {
    if s.len() < 18 {
        return s.to_string();
    }
    let split_index = s.len() - 18;
    let (first_part, last_part) = s.split_at(split_index);
    format!("{}.{}", first_part, last_part)
}


#[program]
pub mod sb_on_demand_solana {
    use super::*;
    
    pub fn test<'a>(ctx: Context<Test>) -> Result<()> {
    
        // Feed account data
        let feed_account = ctx.accounts.feed.data.borrow();
        
        // Docs at: https://switchboard-on-demand-rust-docs.web.app/on_demand/accounts/pull_feed/struct.PullFeedAccountData.html
        let feed = PullFeedAccountData::parse(feed_account)
        .map_err(|e| {
            msg!("Parse Error: {:?}", e);
            ProgramError::Custom(1)}
        )?;
        
        // Get the value, 
        let price = feed.get_value(
            &Clock::get()?,
            30,  // max_staleness: maximum seconds staleness allowed for updates to remain valid in samples
            1,   // min_samples: the minimum oracle results required to produce a valid price
            true // only_positive
        ).map_err(|e| {
            msg!("Get Value Error: {:?}", e);
            ProgramError::Custom(2)
        })?;
        
        // Log the value
        msg!("price: {:?}", fmt(&price.mantissa().to_string()));
        Ok(())
    }
}
```

## Step 3: Updating a Feed

Get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

Now using this SDK and the public key of the feed:

1. Initialize the feed account object,&#x20;
2. Fetch an update instruction for the latest feed update!
3. Submit it to the chain along with your programs instruction!

```typescript
// Replace with your feed pubkey
const feed = new PublicKey("HvMrsyD5p1Jg7PTCkLq3bkb5Hs1r3ToYex3ixZ1Mq47A");
const feedAccount = new sb.PullFeed(program, feed);
const demoPath = "target/deploy/sb_on_demand_solana-keypair.json";
const demo = await myAnchorProgram(program.provider, demoPath);

// Get the update instruction for switchboard and lookup tables to make the instruction lighter
const [pullIx, responses, success] = await feedAccount.fetchUpdateIx({ numSignatures: 3 });
const lookupTables = await sb.loadLookupTables([...responses.map((x) => x.oracle), feedAccount]);

// Instruction to example program using the switchboard feed
const myIx = await demo.methods.test().accounts({ feed }).instruction();

// Create the transaction
const tx = await sb.asV0Tx({
  connection,
  ixs: [pullIx, myIx],
  signers: [keypair],
  computeUnitPrice: 200_000,
  computeUnitLimitMultiple: 1.3,
  lookupTables,
});

// simulate the transaction
const simulateResult =
  await queue.program.provider.connection.simulateTransaction(tx, {
    commitment: "processed",
  });
console.log(simulateResult);

// Send the transaction via rpc 
const sig = await connection.sendTransaction(tx, { commitment: "processed" });
```

Check out our examples repository !\
[https://github.com/switchboard-xyz/sb-on-demand-examples/](https://github.com/switchboard-xyz/sb-on-demand-examples/)\
\
Need more in-depth info? Next Page!
