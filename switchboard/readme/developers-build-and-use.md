# Developers: Build and Use!

Using a Switchboard-On-Demand Feed is design for maximum, speed, secuirty, and simplicity

Switchboard offers both a rust and typescript SDK for initializing your feed object as well as fetching new values.

You may get started with the [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

Using this SDK, you can design your data feed just like your Switchboard-v2 data feeds:

```typescript
function buildBinanceComJob(pair: String): OracleJob {
  const tasks = [
    OracleJob.Task.create({
      httpTask: OracleJob.HttpTask.create({
        url: `https://www.binance.com/api/v3/ticker/price?symbol=${pair}`,
      }),
    }),
    OracleJob.Task.create({
      jsonParseTask: OracleJob.JsonParseTask.create({ path: "$.price" }),
    }),
  ];
  return OracleJob.create({ tasks });
}

```

Above is a simple Switchboard job definition for

1. Fetching the ticker REST service from Binance.com for a token price
2. Using [JSONPATH](https://github.com/json-path/JsonPath) syntax to parse out the price field

For more information on the supported job definitions by switchboard oracles, see [https://docs.switchboard.xyz/api/protos/Task](https://docs.switchboard.xyz/api/protos/Task)

Now, lets expand on the helper above to create a data feed:

{% code fullWidth="false" %}
```typescript
import {
  AnchorUtils,
  InstructionUtils,
  PullFeed,
  Queue,
  RecentSlotHashes,
} from "@switchboard-xyz/on-demand";
import { OracleJob } from "@switchboard-xyz/common";
import * as anchor from "@coral-xyz/anchor";

(async () => {
  const [wallet, payer] = await AnchorUtils.initWalletFromFile("payer.json");
  const PID = new PublicKey("SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const queue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const idl = (await anchor.Program.fetchIdl(PID, provider))!;
  const program = new anchor.Program(idl, PID, provider);
  const feedKp = Keypair.generate();
  
  // ===
  const conf: any = {
    queue,
    jobs: [buildBinanceComJob("BTCUSDT")],
    maxVariance: 1.0,
    minResponses: 1,
    numSignatures: 1,
  };
  conf.feedHash = await Queue.fetchFeedHash(program, conf);
  const ix = await pullFeed.initIx(conf);
  const tx = await InstructionUtils.asV0Tx(program, [ix]);
  // ===

  tx.sign([payer, feedKp]);
  const signature = await connection.sendTransaction(tx, {
    // preflightCommitment is REQUIRED to be processed or disabled
    preflightCommitment: "processed",
  });
  await connection.confirmTransaction(signature);

})();
```
{% endcode %}

Now what is this code block actually doing? Let's break it down!

{% code fullWidth="false" %}
```typescript
import {
  AnchorUtils,
  InstructionUtils,
  PullFeed,
  Queue,
  RecentSlotHashes,
} from "@switchboard-xyz/on-demand";
import * as anchor from "@coral-xyz/anchor";

(async () => {
  const [wallet, payer] = await AnchorUtils.initWalletFromFile("payer.json");
  const PID = new PublicKey("SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const queue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const idl = (await anchor.Program.fetchIdl(PID, provider))!;
  const program = new anchor.Program(idl, PID, provider);
  const feedKp = Keypair.generate();
  ...
})();
```
{% endcode %}

All the above is boilerplate code to set your script environment up to communicate with Switchboard's staging environment!

Here, we want to create a brand new data feed so we init feedKp as a generated account to store the new feed in

```typescript
  const conf: any = {
    queue,
    jobs: [buildBinanceComJob("BTCUSDT")],
    maxVariance: 1.0,
    minResponses: 1,
    numSignatures: 1,
  };
  conf.feedHash = await Queue.fetchFeedHash(program, conf);
  const ix = await pullFeed.initIx(conf);
```

This is where the magic happens! This method will direct the switchboard network to perform the work listed in the `jobs` field.

`feed`: The data feed that will be created and/or updated with new values

`queue`: The network of oracles assigned to update this feed

`jobs`: The work schema that all oracles will perform

`maxVariance`: The max variance (percentile) that the jobs are allowed to differ by to give a response

`minResponses`: The minimum number of successful jobs required for a response

`numSignatures`: The number of oracles that we will collect signatures from to update the on-chain price

`returns`: An array of instructions for creating and updating the desired feed

After the feed has been initialized, we can now request price signatures from oracles!

```typescript
const ix = await pullFeed.solanaFetchUpdateIx(conf);
const tx = await InstructionUtils.asV0Tx(program, [ix]);
tx.sign([payer]);
const sig = await connection.sendTransaction(tx, {
  preflightCommitment: "processed",
});
```

And just like that, you've got Switchboard secured data on chain!

You may wonder why pre-flight commitment needs to be processed for our use case. That's due to how Switchboard proves your price data is fresssssshh

<figure><img src="../../.gitbook/assets/giphy.gif" alt=""><figcaption></figcaption></figure>

Off chain, switchboard selects the most recent slothash it can while reducing the risk of choosing a forked slot to prove the data the oracle provides was at least produced after that slot was created.

If the transaction simulation uses the confirmed or finalized chain state to simulate then the likeliness of the signed slot being confirmed already are slim.  To keep time constraints as tight as possible, testing simulation at the processed slot or not at all is optimal.

We have the feeds created and populated on chain: great, but how do we use it?

Switchboard on-demand saves values in the feed accounts in this format:

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

To conveniently read the feed value using all samples within a staleness range, we provide the following method on solana via our sdk here: ([https://crates.io/crates/switchboard-on-demand](https://crates.io/crates/switchboard-on-demand))

<pre class="language-rust"><code class="lang-rust"><strong>// cargo add switchboard-on-demand https://crates.io/crates/switchboard-on-demand
</strong>
<strong>impl PullFeedAccountData {
</strong>    /// Returns the median value of the submissions in the last `max_staleness` slots.
    /// If there are fewer than `min_samples` submissions, returns an error.
    /// **arguments**
    /// * `clock` - the clock to use for the current slot
    /// * `max_staleness` - the maximum number of slots to consider
    /// * `min_samples` - the minimum number of samples required to return a value
    /// * `only_positive` - exclude negative and zero values
    /// **returns**
    /// * `Ok(Decimal)` - the median value of the submissions in the last `max_staleness` slots
    pub fn get_value(
        &#x26;self,
        clock: &#x26;Clock,
        max_staleness: u64,
        min_samples: u32,
        only_positive: bool,
    ) -> Result&#x3C;Decimal>;
}
</code></pre>

Once your feed account is loaded, you may take the lower bound median of the accrued samples to use in your program.

