# Aptos

This guide covers the setup and use of Switchboard data feeds within your project, using the `Aggregator` module for updating feeds and integrating `Switchboard` in Move.

**Active Deployments**

Switchboard is currently deployed on the following networks:

* Mainnet:&#x20;
  * [`0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a590577528`](https://explorer.aptoslabs.com/object/0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a59057752b8/modules/code/aggregator?network=mainnet)
* Testnet:&#x20;
  * [`0x81fc6bbc64b7968e631b2a5b3a88652f91a617534e3755efab2f572858a3099`](https://explorer.aptoslabs.com/object/0x4fc1809ffb3c5ada6b4e885d4dbdbeb70cbdd99cbc0c8485965d95c2eab90935/modules/code/aggregator?network=testnet)

**Typescript-SDK Installation**

To use Switchboard On-Demand, add the following dependencies to your project:

**NPM**

```bash
npm install @switchboard-xyz/aptos-sdk --save
npm install @aptos-labs/ts-sdk
```

**Adding Switchboard to Move Code**

To integrate Switchboard with Move, add the following dependencies to Move.toml:

```bash
[dependencies.Switchboard]
git = "https://github.com/switchboard-xyz/aptos.git" subdir = "on_demand/" rev = "mainnet" # testnet or mainnet
```

**Example Move Code for Using Switchboard Values**

In the example.move module, use the Aggregator and CurrentResult types to access the latest feed data.

```rust
module example::switchboard_example {
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::object::{Self, Object};
    use switchboard::aggregator::{Self, Aggregator, CurrentResult};
    use switchboard::decimal::Decimal;
    use switchboard::update_action;

    public entry fun my_function(account: &signer, update_data: vector<vector<u8>>) {

        // Update the feed with the provided data
        update_action::run<AptosCoin>(account, update_data);

        /**
         * You can use the following code to remove and run switchboard updates from the update_data vector,
         * keeping only non-switchboard byte vectors:
         *
         * update_action::extract_and_run<AptosCoin>(account, &mut update_data);
         */

        // Get the feed object
        let aggregator: address = @0xSomeFeedAddress;
        let aggregator: Object<Aggregator> = object::address_to_object<Aggregator>(aggregator);

        // Get the latest update info for the feed
        let current_result: CurrentResult = aggregator::current_result(aggregator);

        // Access various result properties
        let result: Decimal = aggregator::result(&current_result);              // Update result
        let (result_u128, result_neg) = decimal::unpack(result);                // Unpack result
        let timestamp_seconds = aggregator::timestamp(&current_result);         // Timestamp in seconds

        // Other properties you can use from the current result
        let min_timestamp: u64 = aggregator::min_timestamp(&current_result);    // Oldest valid timestamp used
        let max_timestamp: u64 = aggregator::max_timestamp(&current_result);    // Latest valid timestamp used
        let range: Decimal = aggregator::range(&current_result);                // Range of results
        let mean: Decimal = aggregator::mean(&current_result);                  // Average (mean)
        let stdev: Decimal = aggregator::stdev(&current_result);                // Standard deviation

        // Use the computed result as needed...
    }
}
```

Once dependencies are configured, updated aggregators can be referenced easily.

This implementation allows you to read and utilize Switchboard data feeds within Move. If you have any questions or need further assistance, please contact the Switchboard team.

**Creating an Aggregator and Sending Transactions**

Building a feed in Switchboard can be done using the Typescript SDK, or it can be done with the [Switchboard Web App](https://ondemand.switchboard.xyz/aptos/mainnet). Visit our [docs](https://docs.switchboard.xyz/docs) for more on designing and creating feeds.

**Building Feeds in Typescript \[optional]**

```tsx
import {
  CrossbarClient,
  SwitchboardClient,
  Aggregator,
  ON_DEMAND_MAINNET_QUEUE,
  ON_DEMAND_TESTNET_QUEUE,
} from "@switchboard-xyz/aptos-sdk";
import { OracleJob } from "@switchboard-xyz/common";
import { Aptos, Account, AptosConfig, Network } from "@aptos-labs/ts-sdk"

// get the aptos client
const config = new AptosConfig({
  network: Network.MAINNET, // network a necessary param / if not passed in, full node url is required
});
// create a SwitchboardClient using the aptos client
const aptos = new Aptos(config);
const client = new SwitchboardClient(aptos);

const crossbarClient = new CrossbarClient("http://myCrossbarDeployment.com");

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

const isMainnet = true; // set to false for testnet
const queue = isMainnet
  ? ON_DEMAND_MAINNET_QUEUE
  : ON_DEMAND_TESTNET_QUEUE;

// Store some job definition
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
const minResponses = 1;

//==========================================================
// Feed Initialization On-Chain
//==========================================================

// ... get the account object for your signer with relevant key / address ...

// get the signer address
const account = Account.generate(); // Or plug in your account
const signerAddress = account.accountAddress.toString();

const aggregatorInitTx = await Aggregator.initTx(client, signerAddress, {
  name: feedName,
  minSampleSize,
  maxStalenessSeconds,
  maxVariance,
  feedHash,
  minResponses,
});

const res = await aptos.signAndSubmitTransaction({
  signer: account,
  transaction: aggregatorInitTx,
});

const result = await aptos.waitForTransaction({
  transactionHash: res.hash,
  options: {
    timeoutSecs: 30,
    checkSuccess: true,
  },
});

// Log the transaction results
console.log(result);

```

**Updating Feeds**

```tsx
// Replace with your feed ID
const aggregatorId = "0x1234567890abcdef1234567890abcdef12345678";D
const aggregator = new Aggregator(client, aggregatorId);

// Fetch and log the oracle responses
const { updates } = await aggregator.fetchUpdate();

// Create a transaction to run the feed update
const exampleAddress = "YOUR_CONTRACT_ADDRESS";
const updateTx = await client.aptos.transaction.build.simple({
  sender: signerAddress,
  data: {
    function: `${exampleAddress}::switchboard_example::my_function`,
    functionArguments: [updates],
  },
});

// Sign and submit the transaction
const res = await aptos.signAndSubmitTransaction({
  signer: account,
  transaction: updateTx!,
});

// Wait for the transaction to complete
const result = await aptos.waitForTransaction({
  transactionHash: res.hash,
  options: {
    timeoutSecs: 30,
    checkSuccess: true,
  },
});

// Log the transaction results
console.log(result);
```

### (optional) Migrating existing code to On-Demand from V2 without updating logic

#### 1. Update Move.toml

You'll need to update your `Move.toml` to include the new `switchboard_adapter` module and address. Replace the `switchboard` named address with the new `switchboard_adapter` address.

```toml
[addresses]

# remove the switchboard address
- switchboard = "0xb91d3fef0eeb4e685dc85e739c7d3e2968784945be4424e92e2f86e2418bf271"

# add the switchboard_adapter address
+ switchboard_adapter = "0x890fd4ed8a26198011e7923f53f5f1e5eeb2cc389dd50b938f16cb95164dc81c"

[dependencies]

# remove the switchboard v2 dependency
- [dependencies.Switchboard]
- git = "https://github.com/switchboard-xyz/sbv2-aptos.git"
- subdir = "move/switchboard/testnet/" # change to /mainnet/ if on mainnet - or fork and change deps for a specific commit hash
- rev = "main"

# add the on-demand adapter dependency
+ [dependencies.SwitchboardAdapter]
+ git = "https://github.com/switchboard-xyz/aptos.git"
+ subdir = "adapter/mainnet"
+ rev = "main"
```

#### 2. Update your Move Modules



You'll need to update named address `switchboard` to `switchboard_adapter` in dependencies.

```rust
module example::module {
-    use switchboard::aggregator;
-    use switchboard::math;
+    use switchboard_adapter::aggregator;
+    use switchboard_adapter::math;
    ...
}
```

The aggregator addresses you use will have to be updated to new On-Demand Aggregators that can be created from your V2 Aggregators on the Switchboard On-Demand App. Update references in your application to on-demand aggregators accordingly.

#### 3. Cranking



On-demand works on a pull-based mechanism, so you will have to crank feeds with your client-side code in order to get the latest data. This can be done using the Typescript SDK.

```typescript
import {
  Aggregator,
  SwitchboardClient,
  waitForTx,
} from "@switchboard-xyz/aptos-sdk";
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// get the aptos client
const config = new AptosConfig({
  network: Network.MAINNET, // network a necessary param / if not passed in, full node url is required
});
const aptos = new Aptos(config);

// create a SwitchboardClient using the aptos client
const client = new SwitchboardClient(aptos);

const aggregator = new Aggregator(sb, aggregatorId);

// update the aggregator every 10 seconds
setInterval(async () => {
  try {
    // fetch the latest update and tx to update the aggregator
    const { updateTx } = await aggregator.fetchUpdate({
      sender: signerAddress,
    });

    // send the tx to update the aggregator
    const tx = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: updateTx!,
    });
    const resultTx = await waitForTx(aptos, tx.hash);
    console.log(`Aggregator ${aggregatorId} updated!`);
  } catch (e) {
    console.error(`Error updating aggregator ${aggregatorId}: ${e}`);
  }
}, 10000);
```
