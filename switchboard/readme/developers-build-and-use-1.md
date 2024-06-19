# Developers: Build and Use

Switchboard offers both a rust and typescript SDK for initializing your feed object as well as fetching new values.

You may get started with the [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

Using this SDK, you can design your data feed just like your Switchboard-v2 data feeds:

```typescript
export function buildBinanceComJob(pair: string): OracleJob {
  const jobConfig = {
    tasks: [
      {
        // Fetch the binance spot prices endpoint
        httpTask: {
          url: `https://www.binance.com/api/v3/ticker/price`,
        },
      },
      {
        // Parse out the price of the pair in question
        jsonParseTask: {
          path: `$[?(@.symbol == '${pair}')].price`,
        },
      },
    ],
  };
  return OracleJob.fromObject(jobConfig);
}
```

Above is a simple Switchboard job definition for

1. Fetching the ticker REST service from Binance.com for a token price
2. Using [JSONPATH](https://github.com/json-path/JsonPath) syntax to parse out the price field

For more information on the supported job definitions by switchboard oracles, see [https://docs.switchboard.xyz/api/protos/Task](https://docs.switchboard.xyz/api/protos/Task)

Now, lets expand on the helper above to create a data feed:

<pre class="language-typescript" data-full-width="false"><code class="lang-typescript">import {
  AnchorUtils,
  InstructionUtils,
  PullFeed,
  Queue,
  RecentSlotHashes,
} from "@switchboard-xyz/on-demand";
import { OracleJob, CrossbarClient, decodeString } from "@switchboard-xyz/common";
import * as anchor from "@coral-xyz/anchor";

(async () => {
  // Load the solana cli configs
  const { keypair, connection, provider, program } = await AnchorUtils.loadEnv();
  // Choose which set of oracles will manage your feed
  let queue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
  if (argv.mainnet) {
    queue = new PublicKey("A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w");
  }
  const queueAccount = new Queue(program, queue);
  const path = "target/deploy/sb_on_demand_solana-keypair.json";
  const myProgramKeypair = await AnchorUtils.initKeypairFromFile(path);
  const myProgram = await myAnchorProgram(provider, myProgramKeypair.publicKey);
  const txOpts = {
    commitment: "processed" as Commitment,
    skipPreflight: true,
  };
  // Create your feed config!
 const conf = {
    name: "BTC Price Feed", // the feed name (max 32 bytes)
    queue,// the queue of oracles to bind to
    maxVariance: 1.0,// minimum number of responses of jobs to allow
    minResponses: 1,// minimum number of responses of jobs to allow
    numSignatures: 3,// number of signatures to fetch per update
  };
  const [pullFeed, feedKp] = PullFeed.generate(program);
  const jobs = [buildBinanceComJob("BTC-USD")];
  
  // Upload jobs to IPFS and pin
  const ipfsResponse = await crossbarClient.store(queue.toBase58(), jobs);
  const decodedFeedHash = decodeString(ipfsResponse.feedHash);
  const [pullFeed, feedKp] = PullFeed.generate(program);
<strong>  const tx = await sb.asV0Tx({
</strong>      connection: program.provider.connection,
      ixs: [await pullFeed.initIx({ ...conf, feedHash: decodedFeedHash })],
      payer: keypair.publicKey,
      signers: [keypair, feedKp],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });
  const sim = await connection.simulateTransaction(tx, txOpts);
  const sig = await connection.sendTransaction(tx, txOpts);
  console.log(`Feed ${feedKp.publicKey} initialized: ${sig}`);
})();
</code></pre>

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
import { OracleJob, CrossbarClient, decodeString } from "@switchboard-xyz/common";
import * as anchor from "@coral-xyz/anchor";

(async () => {
  const { keypair, connection, provider, program } = await AnchorUtils.loadEnv();
  let queue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
  if (argv.mainnet) {
    queue = new PublicKey("A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w");
  }
  const queueAccount = new Queue(program, queue);
  const path = "target/deploy/sb_on_demand_solana-keypair.json";
  const myProgramKeypair = await AnchorUtils.initKeypairFromFile(path);
  const myProgram = await myAnchorProgram(provider, myProgramKeypair.publicKey);
  const txOpts = {
    commitment: "processed" as Commitment,
    skipPreflight: true,
  };
  ...
})();
```
{% endcode %}

All the above is boilerplate code to set your script environment up to communicate with Switchboard's staging environment!

Here, we want to create a brand new data feed, so we initialise `feedKp` as a generated account to store the new feed in:

```typescript
 const conf = {
    name: "BTC Price Feed", // the feed name (max 32 bytes)
    queue,// the queue of oracles to bind to
    maxVariance: 1.0,// minimum number of responses of jobs to allow
    minResponses: 1,// minimum number of responses of jobs to allow
    numSignatures: 3,// number of signatures to fetch per update
  };
  let pullFeed: PullFeed;
  const [pullFeed, feedKp] = PullFeed.generate(program);
  const jobs = [buildBinanceComJob("BTC-USD")]
 
  const ipfsResponse = await crossbarClient.store(queue.toBase58(), jobs);
  const decodedFeedHash = decodeString(ipfsResponse.feedHash);

  const [pullFeed, feedKp] = PullFeed.generate(program);
  const tx = await sb.asV0Tx({
      connection: program.provider.connection,
      ixs: [await pullFeed.initIx({ ...conf, feedHash: decodedFeedHash })],
      payer: keypair.publicKey,
      signers: [keypair, feedKp],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });
  const sim = await connection.simulateTransaction(tx, txOpts);
  const sig = await connection.sendTransaction(tx, txOpts);
  console.log(`Feed ${feedKp.publicKey} initialized: ${sig}`);
```

This is w[here th](#user-content-fn-1)[^1]e magic happens! This method will direct the Switchboard network to perform the work listed within the `jobs` variable.

#### Key Components

* **Feed**: The data feed that will be created and/or updated with new values.
* **Queue**: The network of oracles assigned to update this feed.
* **Jobs**: The work schema that all oracles will perform.
* **Max Variance**: The maximum variance (percentile) that the jobs are allowed to differ by to give a response.
* **Min Responses**: The minimum number of successful jobs required for a response.
* **Num Signatures**: The number of oracles that will collect signatures to update the on-chain price.
* **crossbarClient**: A Restful API that interacts with Switchboard. Here we are submitted the job for storage in IPFS and returning the hash of the job feed. Your IPFS hash can also be retrieved in the response.

***

## Using On-Demand Feeds

After the feed has been initialized, we can now request price signatures from oracles!

```typescript
const [pullIx, responses, success] = await pullFeed.fetchUpdateIx(conf);
if (!success) throw new Error(`Errors: ${responses.map((x) => x.error)}`);

const lutOwners = [...responses.map((x) => x.oracle), pullFeed.pubkey];
const tx = await sb.asV0Tx({
      connection,
      ixs: [pullIx, await myProgramIx(myProgram, pullFeed.pubkey)],
      signers: [keypair],
      computeUnitPrice: 200_000,
      computeUnitLimitMultiple: 1.3,
      lookupTables: await sb.loadLookupTables(lutOwners),
});

const sim = await connection.simulateTransaction(tx, txOpts);
const sig = await connection.sendTransaction(tx, txOpts);
const simPrice = +sim.value.logs.join().match(/price: "(\d+(\.\d+)?)/)[1];
console.log(`Price update: ${simPrice}\n\tTransaction sent: ${sig}`);
```

Whats happening here..? \
The `pullFeed.fetchUpdateIx(conf)` is fetching the latest price update instruction for your feed. Then all thats left to do is to submit the `pullIx` to the network!

And just like that, you've got Switchboard secured data on chain!

You may wonder why pre-flight commitment needs to be `processed` for our use case. That's due to how Switchboard proves your price data is fresssssshh

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

Once your feed account is loaded, you may take the lower bound median of the accrued samples to use in your program.\
\
Check out our examples repository !\
[https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main)\


[^1]: 
