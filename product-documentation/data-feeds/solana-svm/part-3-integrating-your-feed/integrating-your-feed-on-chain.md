# Integrating your Feed On-Chain

This section guides you through the process of incorporating Switchboard data feeds into your Solana programs. By utilising Switchboard, your programs can access reliable and frequently updated external data. We recommend prioritising the Switchboard feed update instruction within your Solana transactions to guarantee access to the freshest data possible.

**Prerequisites:**

* Completion of [Part 2 of the guide](../part-2-deploying-your-feed-on-chain.md), including saving a feed's public key. If you haven't done this, you can:
  * Find an [existing feed](https://ondemand.switchboard.xyz/solana/mainnet).
  * [Design your own.](../part-1-designing-and-simulating-your-feed/)

**Integration Steps:**

1.  **Install the Switchboard On-Demand Crate:**

    To add the latest [Switchboard on-demand library](https://crates.io/crates/switchboard-on-demand), run the following command in your project's root directory:

    ```bash
    cargo add switchboard-on-demand
    ```

    This will automatically add the `switchboard-on-demand` crate to your `Cargo.toml` file.
2.  **Implement Switchboard in Your Solana Program (Rust):**

    Include the pull feed account in an instruction within your program. The following example demonstrates how to access and utilise Switchboard data in your Solana program using Rust:

    ```rust
    use anchor_lang::prelude::*;
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

            let clock = Clock::get()?;

            // Verify that this account is the intended one by comparing public keys
            // if ctx.accounts.feed.key != &specific_pubkey {
            //     throwSomeError
            // }

            // Docs at: https://switchboard-on-demand-rust-docs.web.app/on_demand/accounts/pull_feed/struct.PullFeedAccountData.html
            let feed = PullFeedAccountData::parse(feed_account).unwrap();
            // Log the value
            msg!("price: {:?}", feed.value(&clock));
            Ok(())
        }
    }

    ```

    To conveniently read the feed value, considering samples within a specified staleness range, utilise the `get_value` method provided in our [Solana SDK](https://crates.io/crates/switchboard-on-demand). This method allows you to determine the lower bound median of the accrued samples — a useful and effective statistical approach to valuing data within a time-series.
3.  **Using On-Demand Feeds with Typescript:**

    After initialising the feed, you can start requesting price signatures from oracles, leveraging their off-chain infrastructure.

    ```typescript
    // Extended from Part 2

    const connection = pullFeed.program.provider.connection;

    const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({
      crossbarClient: crossbarClient,
      chain: "solana",
      network: "mainnet",
    });

    const tx = await asV0Tx({
      connection,
      ixs: [pullIx!], // after the pullIx you can add whatever transactions you'd like
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
    if (sim.value?.logs) {
      const simPrice = sim.value.logs.join().match(/price: (.*)/)[1];
      console.log(`Price update: ${simPrice}\n\tTransaction sent: ${sig}`);
    } else {
      console.log("No price update");
    }
    ```

**Diving Deeper: Understanding the Process**

This example fetches the latest price update with signatures from the oracle network, assembles the transaction, and submits it to the Solana blockchain. While generally straightforward, some troubleshooting may be needed.

**Why Pre-Flight Commitment is Necessary:** Off-chain, Switchboard selects the most recent slot hash to minimise the risk of choosing a forked slot and to prove the origin of the oracle data. Transaction simulation using confirmed/finalised chain state increases the risk of the signed slot already being confirmed.

* **Fetching and Submitting Data:**
  *   Fetch the latest price update instruction for your feed:

      ```typescript
      pullFeed.fetchUpdateIx({ crossbarClient: crossbar });
      ```
  *   Submit the `pullIx` to the network to secure Switchboard data on-chain.

      ```rust
      pub struct Oraclesubmission {
          /// The public key of the oracle that submitted this value.
          pub oracle: Pubkey,
          /// The slot at which this value was signed.
          pub slot: u64,
          /// The value that was submitted.
          pub value: i128,
      }
      ```

      The system tracks each oracle's public key and the slot at which the value was signed to maintain the data's freshness. To effectively utilise the data feed, it is crucial to gather a set of samples that falls within an acceptable staleness tolerance. Again, utilise the 'get\_value' method.

**Further Resources:**

Check out our example repository for more information on backend integration:

[https://github.com/switchboard-xyz/sb-on-demand-examples/](https://github.com/switchboard-xyz/sb-on-demand-examples/)
