# Movement

### Examples and Source Code

Source code for the Switchboard On-Demand Movement integration can be found in the [github repo](https://github.com/switchboard-xyz/movement) along with examples.

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Mainnet:
  * [0x465e420630570b780bd8bfc25bfadf444e98594357c488fe397a1142a7b11ffa](https://explorer.movementlabs.xyz/object/0x465e420630570b780bd8bfc25bfadf444e98594357c488fe397a1142a7b11ffa/modules/packages/OnDemand?network=mainnet)
* Testnet (Bardock):
  * [0x465e420630570b780bd8bfc25bfadf444e98594357c488fe397a1142a7b11ffa](https://explorer.movementlabs.xyz/object/0x465e420630570b780bd8bfc25bfadf444e98594357c488fe397a1142a7b11ffa/modules/packages/OnDemand?network=bardock+testnet)

#### Adapter Addresses

* Mainnet:
  * [0xb3654a69ba2a252849a89fa70845ad8e713a28c322dc580ae457df1f747bb74a](https://explorer.movementlabs.xyz/object/0xb3654a69ba2a252849a89fa70845ad8e713a28c322dc580ae457df1f747bb74a/modules/packages/Switchboard?network=mainnet)
* Testnet (Bardock):
  * [0xfe38ecf6fc57e742327af6e951e9fe2fcadcd6d1f1327ba2bee5a31e43d6637f](https://explorer.movementlabs.xyz/object/0xfe38ecf6fc57e742327af6e951e9fe2fcadcd6d1f1327ba2bee5a31e43d6637f/modules/packages/Switchboard?network=bardock+testnet)

***

### Typescript-SDK Installation

To use Switchboard On-Demand, add the following dependencies to your project:

#### NPM

```bash
npm install @switchboard-xyz/aptos-sdk --save
```

#### Bun

```bash
bun add @switchboard-xyz/aptos-sdk
```

#### PNPM

```bash
pnpm add @switchboard-xyz/aptos-sdk
```

### Adding Switchboard to Move Code

To integrate Switchboard with Move, add the following dependencies to Move.toml:

```toml
[addresses]
on_demand = "0x465e420630570b780bd8bfc25bfadf444e98594357c488fe397a1142a7b11ffa"

# ...

[dependencies.OnDemand]
git = "https://github.com/switchboard-xyz/movement.git"
subdir = "on_demand/"
rev = "main"
```

### Example Move Code for Using Switchboard Values

In the example.move module, use the Aggregator and CurrentResult types to access the latest feed data.

```rust
module example::switchboard_example {
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::object::{Self, Object};
    use on_demand::aggregator::{Self, Aggregator, CurrentResult};
    use on_demand::decimal::Decimal;
    use on_demand::update_action;

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

### Creating an Aggregator and Sending Transactions

Building a feed in Switchboard can be done using the Typescript SDK, or it can be done with the [Switchboard Web App](https://ondemand.switchboard.xyz/aptos/mainnet). Visit our [docs](https://docs.switchboard.xyz/docs) for more on designing and creating feeds.

#### Building Feeds in Typescript \[optional]

```typescript
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
const aptos = new Aptos(config);

const account = Account.generate(); // Or plug in your account

// create a SwitchboardClient using the aptos client
const client = new SwitchboardClient(aptos, "movement"); // "bardock" for testnet

// for initial testing and development, you can use the public
// https://crossbar.switchboard.xyz instance of crossbar
const crossbarClient = new CrossbarClient("https://crossbar.switchboard.xyz");

// ... define some jobs ...

const isMainnet = true; // set to false for testnet
const queue = isMainnet
  ? ON_DEMAND_MAINNET_QUEUE
  : ON_DEMAND_TESTNET_QUEUE;

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

### Updating Feeds

```typescript
// replace with your feed address
const aggregatorId = "YOUR_FEED_ADDRESS";
const aggregator = new Aggregator(client, aggregatorId);

// Fetch and log the oracle responses
const { updates } = await aggregator.fetchUpdate();

// Create a transaction to run the feed update
// your contract address
const exampleAddress = "0x1234567890abcdef1234567890abcdef12345678";
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
  transaction: updateTx,
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

### (optional) Using On-Demand with V2 interface

If you have existing code using the [Switchboard V2 interface](https://github.com/switchboard-xyz/sbv2-aptos), you can use the On-Demand adapter for full compatibility with the new On-Demand service.

#### 1. Update Move.toml

You'll need to update your `Move.toml` to include the new `switchboard` adapter address. Pick the correct one for your target network.

```diff
[addresses]
+ switchboard = "0xb3654a69ba2a252849a89fa70845ad8e713a28c322dc580ae457df1f747bb74a" # mainnet
# switchboard = "0xfe38ecf6fc57e742327af6e951e9fe2fcadcd6d1f1327ba2bee5a31e43d6637f" # testnet

[dependencies]

# nothing has to change in the switchboard v2 dependency
[dependencies.Switchboard]
git = "https://github.com/switchboard-xyz/sbv2-aptos.git"
subdir = "move/switchboard/testnet/" # change to /mainnet/ if on mainnet - or fork and change deps for a specific commit hash
rev = "main"
```

#### 2. Cranking

On-demand works on a pull-based mechanism, so you will have to crank feeds with your client-side code in order to get the latest data. This can be done using the Typescript SDK.

```typescript
const aggregator = new Aggregator(client, aggregatorId);

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
