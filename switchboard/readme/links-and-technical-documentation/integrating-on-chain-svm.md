---
description: Adding Switchboard to your Solana Program
---

# Integrating On-Chain (SVM)

Switchboard feed updates are instructions that should usually come first in a Solana transaction. This lets users get the most accurate (recent) data possible on-chain. Integrating on-chain only requires a few steps:

## Step 1: Getting a Solana Feed Public Key

Browse our awesome [Explorer ](https://ondemand.switchboard.xyz/)for a feed you like and save the feeds public key! \
\
You can also create a feed in our [On-Demand Builder](https://ondemand.switchboard.xyz/solana/mainnet/build), which is a tool for building and deploying feeds directly from the a user interface. You can use it to pull data from almost anywhere. See the [Designing a Feed](../on-evm-networks/designing-a-feed-evm.md) section for more on configuring oracle jobs.

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

#[program]
pub mod sb_on_demand_solana {
    use super::*;
    
    pub fn test<'a>(ctx: Context<Test>) -> Result<()> {
    
        // Feed account data
        let feed_account = ctx.accounts.feed.data.borrow();
        
        // This is where you should verify that this account is specifically the one you're trying to read
        // Compare the public keys
        // if ctx.accounts.feed.key != &specific_pubkey {
        //     throwSomeError
        // }
        
        // Docs at: https://switchboard-on-demand-rust-docs.web.app/on_demand/accounts/pull_feed/struct.PullFeedAccountData.html
        let feed = PullFeedAccountData::parse(feed_account).unwrap();
        // Log the value
        msg!("price: {:?}", feed.value());
        Ok(())
    }
}
```

To conveniently read the feed value using all samples within a staleness range, we provide the following method on Solana via our [SDK here](https://crates.io/crates/switchboard-on-demand). Once your feed account is loaded, you may take the lower bound median of the accrued samples to use in your program using [`get_value`](https://switchboard-on-demand-rust-docs.web.app/on\_demand/accounts/pull\_feed/struct.PullFeedAccountData.html#method.get\_value).

***

## Using On-Demand Feeds with Typescript

After the feed has been initialized, we can now request price signatures from oracles!

```typescript
import {
  // ...
  loadLookupTables // <- new dependency added
} from "@switchboard-xyz/on-demand";


// ... simulation logic ... 

const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({ crossbarClient: crossbar });

const tx = await asV0Tx({
      connection,
      ixs: [pullIx], // after the pullIx you can add whatever transactions you'd like
      signers: [payer],
      computeUnitPrice: 200_000,
      computeUnitLimitMultiple: 1.3,
      lookupTables: luts,
});

// simulate and send 
const sim = await connection.simulateTransaction(tx, {
    commitment: "processed",
});
const sig = await connection.sendTransaction(tx, {
  preflightCommitment: "processed",
  skipPreflight: true,
});
const simPrice = sim.value.logs.join().match(/price: (.*)/)[1];
console.log(`Price update: ${simPrice}\n\tTransaction sent: ${sig}`);
```

### Whats happening here?&#x20;

In this instance, we're fetching the latest update with signatures from the oracle network, then assembling the transaction and submitting it on-chain.  It's fairly straightforward,  but some troubleshooting can be necessary:

#### Why Pre-Flight Commitment is Necessary

Off-chain, Switchboard selects the most recent `slothash` to minimize the risk of choosing a forked slot, proving the oracle data was produced after that slot's creation. If transaction simulation uses the confirmed or finalized chain state, the likelihood of the signed slot being already confirmed is slim.

#### Fetching and Submitting Data

To fetch the latest price update instruction for your feed, while pulling the jobs from crossbar:

```typescript
pullFeed.fetchUpdateIx({ crossbarClient: crossbar });
```

Next, submit the `pullIx` to the network, securing Switchboard data on

```rust
pub struct OracleSubmission {
    /// The public key of the oracle that submitted this value.
    pub oracle: Pubkey,
    /// The slot at which this value was signed.
    pub slot: u64,
    /// The value that was submitted.
    pub value: i128,
}
```

For every oracle submission, we track which oracle submitted the value and at which slot.  In this way, we can track the freshest data from each oracle.

To use this data feed, you do not just want to collect the most recent oracle report, but a set of samples within your staleness tolerance.

To conveniently read the feed value using all samples within a staleness range, we provide the following method on Solana via our [SDK here](https://crates.io/crates/switchboard-on-demand).

#### Lookup Tables

```typescript
// Update: This is now passed as the 4th return value of fetchUpdateIx
const lookupTables = await loadLookupTables([...responses.map((x) => x.oracle), pullFeed]);
```

Here we create a set of [lookup tables](https://solana.com/docs/advanced/lookup-tables) to be passed into our transaction. This can be a big space-saver when packaging a Switchboard instruction alongside some business logic for your protocol (atomic updates).&#x20;

\
Check out our examples repository for more on backend integration!\
[https://github.com/switchboard-xyz/sb-on-demand-examples/](https://github.com/switchboard-xyz/sb-on-demand-examples/)
