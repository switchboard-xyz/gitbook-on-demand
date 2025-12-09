# Iota

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Mainnet: [0x8650249db8ffcffe8eb08b0696a8cb71e325f2afb9abc646f45344077b073ba1](https://explorer.iota.org/object/0x8650249db8ffcffe8eb08b0696a8cb71e325f2afb9abc646f45344077b073ba1)
* Testnet: [0xad9557529ba97ccf94a6a89d759fc8c8a6da5f0b98630c0fb53fe3b6d6a8e97a](https://explorer.iota.org/object/0xad9557529ba97ccf94a6a89d759fc8c8a6da5f0b98630c0fb53fe3b6d6a8e97a?network=testnet)

### Typescript-SDK Installation

To use Switchboard On-Demand, add the following dependencies to your project:

#### NPM

```bash
npm install @switchboard-xyz/iota-sdk @iota/iota-sdk --save
```

#### Bun

```bash
bun add @switchboard-xyz/iota-sdk @iota/iota-sdk
```

#### PNPM

```bash
pnpm add @switchboard-xyz/iota-sdk @iota/iota-sdk
```

### Creating an Aggregator and Sending Transactions

Building a feed in Switchboard can be done using the Typescript SDK, or it can be done with the [Switchboard Web App](https://ondemand.switchboard.xyz/iota/mainnet). Visit our [docs](https://docs.switchboard.xyz/) for more on designing and creating feeds.

#### Building Feeds

```typescript
import {
  SwitchboardClient,
  Aggregator,
} from "@switchboard-xyz/iota-sdk";
import { CrossbarClient, OracleJob } from "@switchboard-xyz/common";
import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

// Add your Iota signer here
const keypair = new Ed25519Keypair();
const userAddress = keypair.getPublicKey().toIotaAddress();
const iotaClient = new IotaClient({
    url: getFullnodeUrl('testnet'),
});

// for initial testing and development, you can use the public
// https://crossbar.switchboard.xyz instance of crossbar
const crossbarClient = new CrossbarClient("https://crossbar.switchboard.xyz");

// ... define some jobs ...
const jobs: OracleJob[] = [
  OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "https://binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        }
      },
      {
        jsonParseTask: {
          path: "$.price"
        }
      }
    ],
  }),
];


// Create a SwitchboardClient using the IotaClient configured with your favorite RPC on testnet or mainnet
const sb = new SwitchboardClient(iotaClient);
const state = await sb.fetchState();
const queue = state.oracleQueueId;

const { feedHash } = await crossbarClient.store(queue, jobs);

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
const res = await iotaClient.signAndExecuteTransaction({
  signer: keypair,
  transaction,
  options: {
    showEffects: true,
  },
});

// Capture the created aggregator ID
let aggregatorId;
res.effects?.created?.forEach((c: any) => {
  if (c.reference.objectId) {
    aggregatorId = c.reference.objectId;
  }
});

// Wait for transaction confirmation
await iotaClient.waitForTransaction({
  digest: res.digest,
});

// Log the transaction effects
console.log(res);

```

### Updating Feeds

With Switchboard On-Demand, passing the PTB into the feed update method handles the update automatically.

```typescript
const aggregator = new Aggregator(sb, aggregatorId);

// Create the PTB transaction
let feedTx = new Transaction();

// Fetch and log the oracle responses
const response = await aggregator.fetchUpdateTx(feedTx);
console.log("Fetch Update Oracle Response: ", response);

// Send the transaction
const res = await iotaClient.signAndExecuteTransaction({
  signer: keypair,
  transaction: feedTx,
  options: {
    showEffects: true,
  },
});

// Wait for transaction confirmation
await iotaClient.waitForTransaction({
  digest: res.digest,
});

// Log the transaction effects
console.log({ aggregatorId, res });
```

Note: Ensure the Switchboard Aggregator update is the first action in your PTB or occurs before referencing the feed update.

### Adding Switchboard to Move Code

To integrate Switchboard with Move, add the following dependencies to Move.toml:

```toml
[dependencies.Switchboard]
git = "https://github.com/switchboard-xyz/iota.git"
subdir = "on_demand/"
rev = "main" 

[dependencies.Iota]
override = true
git = "https://github.com/iotaledger/iota.git"
subdir = "crates/iota-framework/packages/iota-framework"
rev = "framework/testnet"
```

Once dependencies are configured, updated aggregators can be referenced easily.

### Example Move Code for Using Switchboard Values

In the example.move module, use the Aggregator and CurrentResult types to access the latest feed data.

```rust
module example::switchboard;

use switchboard::aggregator::{Aggregator, CurrentResult};
use switchboard::decimal::Decimal;

public entry fun use_switchboard_value(aggregator: &Aggregator) {

    // Get the latest update info for the feed
    let current_result = aggregator.current_result();

    // Access various result properties
    let result: Decimal = current_result.result();        // Median result
    let result_u128: u128 = result.value();               // Result as u128
    let min_timestamp_ms: u64 = current_result.min_timestamp_ms(); // Oldest data timestamp
    let max_timestamp_ms: u64 = current_result.max_timestamp_ms(); // Latest data timestamp
    let range: Decimal = current_result.range();          // Range of results
    let mean: Decimal = current_result.mean();            // Average (mean)
    let stdev: Decimal = current_result.stdev();          // Standard deviation
    let max_result: Decimal = current_result.max_result();// Max result
    let min_result: Decimal = current_result.min_result();// Min result
    let neg: bool = result.neg();                         // Check if negative (ignore for prices)

    // Use the computed result as needed...
}
```

This implementation allows you to read and utilize Switchboard data feeds within Move. If you have any questions or need further assistance, please contact the Switchboard team.
