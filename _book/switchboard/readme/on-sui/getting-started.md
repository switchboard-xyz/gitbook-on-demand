# Getting Started

You can install the Switchboard On-Demand Typescript [Sui-SDK](https://www.npmjs.com/package/@switchboard-xyz/sui-sdk) by running:

<pre class="language-bash"><code class="lang-bash"><strong># Add the Switchboard Sui Typescript
</strong><strong>npm add @switchboard-xyz/sui-sdk
</strong></code></pre>

### Creating a Feed

If you're already familiarized with [Designing a Feed](../designing-feeds/), building on Sui should be a quick and easy process.

```typescript
import {
  CrossbarClient,
  SwitchboardClient,
  Aggregator,
  ON_DEMAND_MAINNET_QUEUE,
  ON_DEMAND_TESTNET_QUEUE,
} from "@switchboard-xyz/sui-sdk";

// for initial testing and development, you can use the public
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

// ... define some jobs ...

const queue = isMainnetSui ? ON_DEMAND_MAINNET_QUEUE : ON_DEMAND_TESTNET_QUEUE;

// Store some job definition
const { feedHash } = await crossbarClient.store(queue.toBase58(), jobs);

// Create a SwitchboardClient using the SuiClient configured with your favorite RPC on testnet or mainnet
const sb = new SwitchboardClient(suiClient);

// try creating a feed
const feedName = "BTC/USDT";

// Require only one oracle response needed
const minSampleSize = 1;

// Allow update data to be up to 60 seconds old
const maxStalenessSeconds = 60;

// If jobs diverge more than 1%, don't allow the feed to produce a valid update
const maxVariance = 1e9;

// Require only 1 job response
const minJobResponses = 1;

//==========================================================
// Feed Initialization On-Chain
//==========================================================

let transaction = new Transaction();

// add the tx to the PTB
await Aggregator.initTx(sb, transaction, {
  feedHash,
  name: feedName,
  authority: userAddress,
  minSampleSize,
  maxStalenessSeconds,
  maxVariance,
  minResponses: minJobResponses,
});

// Send the transaction
const res = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction,
  options: {
    showEffects: true,
  },
});

// Capture the created aggregator ID
let aggregatorId;
res.effects?.created?.forEach((c) => {
  if (c.reference.objectId) {
    aggregatorId = c.reference.objectId;
  }
});

// Wait for transaction confirmation
await client.waitForTransaction({
  digest: res.digest,
});

// Log the transaction effects
console.log(res);
```

### Updating Feeds

With Switchboard On-Demand, you can just pass your PTB into the feed update method and everything else will be handled for you.&#x20;

```typescript
const aggregator = new Aggregator(sb, aggregatorId);

// create the PTB
let feedTx = new Transaction();

// Fetch the oracle responses (and write them onto the tx)
const response = await aggregator.fetchUpdateTx(feedTx);

// Log the raw oracle responses from Switchboard 
console.log("Fetch Update Oracle Response: ", response);

// send the transaction
const res = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: feedTx,
  options: {
    showEffects: true,
  },
});

// wait for the transaction to be confirmed
await client.waitForTransaction({
  digest: res.digest,
});

// log the effects
console.log(res);
```

Note: You should make sure that the Switchboard Aggregator update is the first action in your PTB (or at least happens before the feed update is referenced).&#x20;

### Adding Switchboard to your Move Code

Start by updating your Move.toml to include Switchboard. Switchboard uses Sui Move2024 Beta Edition and should be fairly simple to integrate into your existing project.&#x20;

#### Move.toml

```toml
[dependencies.switchboard]
git = "https://github.com/switchboard-xyz/sui.git"
subdir = "on_demand" 
rev = "testnet" # change to mainnet when ready to use mainnet
 
[dependencies.Sui]
git = "https://github.com/MystenLabs/sui.git"
subdir = "crates/sui-framework/packages/sui-framework"
rev = "framework/testnet" # change to framework/mainnet for mainnet
# override = true # uncomment this if this gives you conflicts
```

Once dependencies are sorted out, you should be able to easily reference your updated aggregators.

#### example.move

```rust
module example::switchboard;

// Import the Switchboard Aggregator Type and Current Result
use switchboard::aggregator::{Aggregator, CurrentResult};

// Switchboard Decimal type (fixed scale of 18 / 18 decimal places)
use switchboard::decimal::Decimal;

public entry fun use_switchboard_value(
    aggregator: &Aggregator,
) {   

    // get the latest update info for the feed
    let current_result = aggregator.current_result();
    
    // get the median
    let result: Decimal = current_result.result();
    
    // get the value as a u128 (decimal * 10^18)
    let result_u128: u128 = result.value();
    
    // -- Other functions available to you on the Aggregator's CurrentResult -- 
    
    // get the oldest timestamp of the data considered in computing the result (ms)
    let min_timestamp_ms: u64 = current_result.min_timestamp_ms();
    
    // get the latest timestamp in milliseconds
    let max_timestamp_ms: u64 = current_result.max_timestamp_ms();
    
    // get the range (maximum value considered - minimum value)
    let range: Decimal = current_result.range();
    
    // get the average (mean) 
    let mean: Decimal = current_result.mean();
    
    // get the standard deviation of the computed results
    let stdev: Decimal = current_result.stdev();
    
    // get the maximum result of the computed window
    let max_result: Decimal = current_result.max_result();
    
    // get the minimum
    let min_result: Decimal = current_result.min_result();
    
    // check if the result is negative (ignore this if you're using price data)
    let neg: bool = result.neg();
    
    
    // ... use computed result for something ...
}

```

And with this kind of implementation you'll be able to read Switchboard data feeds.&#x20;

