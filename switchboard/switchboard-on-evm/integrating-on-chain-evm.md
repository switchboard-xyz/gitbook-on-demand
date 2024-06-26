---
description: Solidity tutorial for getting started with Switchboard
---

# Integrating On-Chain (EVM)

### Switchboard Contract

Switchboard contracts use the [Diamond Pattern](https://www.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-1). This allowed has allowed Switchboard contracts to be built modularly while retaining a single contract address. However, this also means that traditional explorers cannot find the verified contract code, similar to ordinary proxies.

Using [Louper.dev](https://louper.dev), a custom diamond explorer, we're able to analyze the [Switchboard diamond contract](https://louper.dev/diamond/0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C?network=coreDao) and call functions as you would on an ordinary verified contract within a scanner.&#x20;

### Installation

You can install the Switchboard On-Demand [Solidity SDK](https://github.com/switchboard-xyz/evm-on-demand) by running:

<pre class="language-bash"><code class="lang-bash"><strong># Add the Switchboard Solidity interfaces
</strong><strong>npm add @switchboard-xyz/on-demand-solidity
</strong></code></pre>

#### Forge (Optional)

If you're using Forge, add following to your remappings.txt file: @switchboard-xyz/on-demand-solidity/=node\_modules/@switchboard-xyz/on-demand-solidity

**remappings.txt**

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

#### Alternatively,&#x20;

If you just want to call the Switchboard contract without dealing with any alternative interfaces, you can add only the necessary function signatures and structs. For example, in the following example we'll just be using the following:

```solidity
struct Update {
    bytes32 oracleId; // The publisher of the update
    int128 result; // The value of the recorded update
    uint256 timestamp; // The timestamp of the update
}

interface ISwitchboard {
    function latestUpdate(
        bytes32 feedId
    ) external view returns (Update memory);
    function latestUpdate(
        bytes32 feedId,
        uint256 toleratedTimestampDelta,
        uint256 minResponses
    ) external view returns (Update memory);
    function updateFeeds(bytes[] calldata updates) external payable;
    function getFee(bytes[] calldata updates) external view returns (uint256);
}
```

### Solidity Integration

The code below shows the flow for leveraging Switchboard feeds in Solidity.

#### Adding the Imports

```solidity
import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";
```

1.  Adding the interface for the Switchboard contract is the first step. If you're using the contract and interface from above it should just be a matter of pasting those in. \
    \
    `ISwitchboard`: The interface for the entire Switchboard Contract

    `Structs`:  A contract with all the structs used within Switchboard

#### Adding the Contract

```solidity
contract Example {
  ISwitchboard switchboard;

  // Every Switchboard Feed has a unique feed ID derived from the OracleJob definition and Switchboard Queue ID.
  bytes32 feedId;

  /**
   * @param _switchboard The address of the Switchboard contract
   * @param _feedId The feed ID for the feed you want to query
   */
  constructor(address _switchboard, bytes32 _feedId) {
    // Initialize the target _switchboard
    // Get the existing Switchboard contract address on your preferred network from the Switchboard Docs
    switchboard = ISwitchboard(_switchboard);
    feedId = _feedId;
  }

}
```

2. Here we're creating a contract and keeping a reference to both the Switchboard diamond address, `switchboard`, and `feedId`.&#x20;

* `switchboard` is the reference to the diamond contract, it can be found in [Links and Technical Docs](links-and-technical-docs.md)
* `feedId` that we're interested in reading. The `feedId` on EVM chains will be equivalent to the feedHash on Solana. It's a Sha256 hash of the feed definition and queue. If you don't have a feedId yet, create a feed by following: [Designing a Feed (EVM)](designing-a-feed-evm.md) and [Creating Feeds](creating-a-feed.md).

#### Adding the function boilerplate

```solidity
  /**
   * getFeedData is a function that uses an encoded Switchboard update
   * If the update is successful, it will read the latest price from the feed
   * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
   * @param updates Encoded feed updates to update the contract with the latest result
   */
  function getFeedData(bytes[] calldata updates) public payable {
    //...
  }
```

3. Here we're adding the function to get feed data. The idea is that we'll pass in an encoded Switchboard update (or set of updates) that will be used to update the `feedId` of our choice. We can then read our recently-written update safely.&#x20;

#### Adding a fee

```solidity
contract Example { 
  
  // ...

  // If the transaction fee is not paid, the update will fail.
  error InsufficientFee(uint256 expected, uint256 received);

  function getFeedData(bytes[] calldata updates) public payable {
    // Get the fee for updating the feeds.
    uint256 fee = switchboard.getFee(updates);

    // If the transaction fee is not paid, the update will fail.
    if (msg.value < fee) {
      revert InsufficientFee(fee, msg.value);
    }

    // ...
```

4. Here we're doing a few things relating to update fees. \
   \
   We're adding a new error, `InsufficientFee(uint256 expected, uint256 received)`, that will be used if the submitted transaction value isn't enough to cover the update. \
   \
   We're calling `getFee(bytes[] calldata updates)` to get the cost of submitting a Switchboard update programmatically from the Switchboard program.  \
   \
   We're enforcing that users pay for fees before submitting any updates.

#### Submitting  Updates&#x20;

```solidity
    // Submit the updates to the Switchboard contract
    switchboard.updateFeeds{ value: fee }(updates);
```

5. This line updates feed values in the Switchboard contract, and sends the required fee. Internally, each update is parsed and encoded signatures are verified and checked against the list of valid oracles on a given chain. \
   \
   This `bytes[] calldata` parameter keeps things simple by making common Switchboard updates into one data-type. Everything is handled behind the scenes. \
   \
   The `{ value: fee }` in the call sends `fee` [wei](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#ether-units) over to the Switchboard contract as payment for updates.  The intent here is to pay for the updates.&#x20;

```solidity
    // Read the current value from a Switchboard feed.
    // This will fail if the feed doesn't have fresh updates ready (e.g. if the feed update failed)
    Structs.Update memory latestUpdate = switchboard.latestUpdate(feedId);
```

6. This line pulls the latest update for the specified feedId (or aggregatorId).  This will fill in the fields `uint64 maxStaleness`, `uint32 minSamples`.&#x20;

#### Checking the Data&#x20;

```solidity
  // If the feed result is invalid, this error will be emitted.
  error InvalidResult(int128 result);

  // If the Switchboard update succeeds, this event will be emitted with the latest price.
  event FeedData(int128 price);

  // ...
  
  function getFeedData(bytes[] calldata updates) public payable {
      
      // ...
      
      // Get the latest feed result
      // This is encoded as decimal * 10^18 to avoid floating point issues
      // Some feeds require negative numbers, so results are int128's, but this example uses positive numbers
      int128 result = latestUpdate.result;

      // In this example, we revert if the result is negative
      if (result < 0) {
          revert InvalidResult(result);
      }

      // Emit the latest result from the feed
      emit FeedData(latestUpdate.result);
  }
```

7. Here we're pulling the result out of the latest update. Switchboard updates are encoded as int128's. Another important fact is that values are decimals scaled up by 10^18. \
   \
   For example, the value `1477525556338078708` would represent `1.4775..8708`\
   \
   Next, we check that the value is positive and revert with an `InvalidResult` if it isn't.  Finally, if the update was successful, we emit a FeedData event.

#### Putting It All Together

#### Example.sol

<pre class="language-solidity"><code class="lang-solidity">pragma solidity ^0.8.0;

import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";

contract Example {
  ISwitchboard switchboard;

  // Every Switchboard Feed has a unique feed ID derived from the OracleJob definition and Switchboard Queue ID.
  bytes32 feedId;

  // If the transaction fee is not paid, the update will fail.
  error InsufficientFee(uint256 expected, uint256 received);

  // If the feed result is invalid, this error will be emitted.
  error InvalidResult(int128 result);

  // If the Switchboard update succeeds, this event will be emitted with the latest price.
  event FeedData(int128 price);

  /**
   * @param _switchboard The address of the Switchboard contract
   * @param _feedId The feed ID for the feed you want to query
   */
  constructor(address _switchboard, bytes32 _feedId) {
    // Initialize the target _switchboard
    // Get the existing Switchboard contract address on your preferred network from the Switchboard Docs
    switchboard = ISwitchboard(_switchboard);
    feedId = _feedId;
  }

<strong>  /**
</strong>   * getFeedData is a function that uses an encoded Switchboard update
   * If the update is successful, it will read the latest price from the feed
   * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
   * @param updates Encoded feed updates to update the contract with the latest result
   */
  function getFeedData(bytes[] calldata updates) public payable {


    // Get the fee for updating the feeds. If the transaction fee is not paid, the update will fail.
    uint256 fee = switchboard.getFee(updates);
    if (msg.value &#x3C; fee) {
      revert InsufficientFee(fee, msg.value);
    }

    // Submit the updates to the Switchboard contract
    switchboard.updateFeeds{ value: fee }(updates);

    // Read the current value from a Switchboard feed.
    // This will fail if the feed doesn't have fresh updates ready (e.g. if the feed update failed)
    Structs.Update memory latestUpdate = switchboard.latestUpdate(feedId);

    // Get the latest feed result
    // This is encoded as decimal * 10^18 to avoid floating point issues
    // Some feeds require negative numbers, so results are int128's, but this example uses positive numbers
    int128 result = latestUpdate.result;

    // In this example, we revert if the result is negative
    if (result &#x3C; 0) {
      revert InvalidResult(result);
    }

    // Emit the latest result from the feed
    emit FeedData(latestUpdate.result);
  }
}
</code></pre>

#### Review

This contract:

1. Sets the Switchboard contract address and feed ID in the constructor
2. Defines a function `getFeedData`
3. Checks if the transaction fee is paid, using `switchboard.getFee(bytes[] calldata updates)`.
4. Submits the updates to the Switchboard contract using `switchboard.updateFeeds(bytes[] calldata updates)`.
5. Reads the latest value from the feed using `switchboard.getLatestValue(bytes32 feedId)`.
6. Emits the latest result from the feed.



***

## Using On-Demand Feeds with Typescript

After the feed has been initialized, we can now request price signatures from oracles!

So now that we have the contract ready to read and use Switchboard update data, we need a way to fetch these encoded values. Using Crossbar, we can get an encoded feed update with just a fetch. For simplicity, we'll demonstrate a fetch using both.

We'll be working from the Typescript portion of [Designing a Feed (EVM)](designing-a-feed-evm.md):

#### Adding Imports

```bash
bun add ethers
```

#### index.ts

```typescript
import { EVM } from "@switchboard-xyz/on-demand";
import * as ethers from "ethers";
```

1. We'll be using [ethers](https://github.com/ethers-io/ethers.js) to write updates to the example contract. Add it to the project and import the Switchboard EVM call.&#x20;

#### Setting up the call

```typescript
// Get the latest update data for the feed
// feedId: `bytes32` string of the feed ID, ex: 0x0f762b759dca5b4421fba1cf6fba452cdf76fb9cc6d8183722a78358a8339d10
// encoded: `bytes` string of the encoded update for the feed which can be used in your contract
const { feedId, encoded } = await EVM.fetchResult({
  feedId: "0x0f762b759dca5b4421fba1cf6fba452cdf76fb9cc6d8183722a78358a8339d10",
  chainId: 1115, // 1115 here is the chainId for CORE Testnet
});
```

2. Here we're getting the results for the `feedId` from Switchboard using the default crossbar deployment.&#x20;

#### Creating contract bindings

```typescript
// Target contract address
const exampleAddress = "0xc65f0acf9df6b4312d3f3ce42a778767b3e66b8a";

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const abi = ["function getFeedData(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);
```

3. Add the example contract binding with the `getFeedData` call in the ABI.&#x20;

#### Adding the call

```typescript
// Update feeds
await exampleContract.getFeedData(encoded);
```

4. Pass the encoded updates `bytes[] calldata` into the getFeedData call. This will send the transaction over the wire.&#x20;

#### Getting the provider

```typescript
// Pull the private key from the environment 0x..
const pk = process.env.PRIVATE_KEY;
if (!pk) {
  throw new Error("Missing PRIVATE_KEY environment variable.");
}

// Provider 
const provider = new ethers.JsonRpcProvider(
  "https://ethereum.rpc.example"
);
const signerWithProvider = new ethers.Wallet(pk, provider);
```

5. In order to submit transactions on the target chain, you need to plug in the right RPC and private key. The `signerWithProvider` will be what we pass into the contract.&#x20;

#### Putting it together

Here we're connecting all of these components. We're compiling all of calls into a system where we can pull the encoded updates, and calling the contract.&#x20;

<pre class="language-typescript"><code class="lang-typescript">import { EVM } from "@switchboard-xyz/on-demand";
import {
  // ...
} from "@switchboard-xyz/on-demand";
import * as ethers from "ethers";

// ... simulation logic ... 

// Create a Switchboard On-Demand job
<strong>const chainId = 1115; // Core Devnet (as an example)
</strong>
// Get the latest update data for the feed
// feedId: `bytes32` string of the feed ID, ex: 0x0f762b759dca5b4421fba1cf6fba452cdf76fb9cc6d8183722a78358a8339d10
// encoded: `bytes` string of the encoded update for the feed which can be used in your contract
const { feedId, encoded } = await EVM.fetchResult({
  feedId: "0x0f762b759dca5b4421fba1cf6fba452cdf76fb9cc6d8183722a78358a8339d10",
  chainId,
});

// Target contract address
const exampleAddress = "0xc65f0acf9df6b4312d3f3ce42a778767b3e66b8a";

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const abi = ["function getFeedData(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);

// Update feeds
await exampleContract.getFeedData(encoded);
</code></pre>
