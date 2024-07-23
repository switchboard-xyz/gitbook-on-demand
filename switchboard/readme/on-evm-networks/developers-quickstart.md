---
description: 'NOTICE: Switchboard On-Demand on EVM is currently an unaudited alpha.'
---

# Developers: Quickstart!

### First Steps!

There's a [Solidity-SDK](https://github.com/switchboard-xyz/evm-on-demand) that you can use to interact with the oracle contract on-chain and leverage customized oracle data within your smart contracts. For querying oracle updates off-chain for on-chain submission, you can use the [Switchboard On-Demand Typescript-SDK](https://www.npmjs.com/package/@switchboard-xyz/on-demand/v/1.0.54-alpha.3).

### Prerequisites

To use Switchboard On-Demand, you will need to have a basic understanding of Ethereum and smart contracts. For more on Switchboard's Architecture, see the [docs](https://switchboardxyz.gitbook.io/switchboard-on-demand/architecture-design).

### Installation

You can install the Switchboard On-Demand Solidity SDK by running:

```bash
npm install @switchboard-xyz/on-demand-solidity
```

And you can install the cross-chain Typescript SDK by running:

```bash
npm install @switchboard-xyz/on-demand
```

**Forge (Optional)**

If you're using Forge, add following to your **remappings.txt** file:&#x20;

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

## Step 1: Create a Feed (or get one from explorer)

**IMPORTANT:  Feeds will NOT work unless they been created on-chain.**&#x20;

#### Designing a Switchboard On-Demand Feed

To design a Switchboard On-Demand feed, you can use the [On-Demand Builder](https://app.switchboard.xyz/solana/mainnet). Switchboard Feeds are created by specifying data sources and aggregation methods in an [OracleJob](https://docs.switchboard.xyz/api/next/protos/OracleJob) format.

#### Get the `aggregatorId`

When you create a feed in the UI, you'll see a field titled **Address**, which corresponds to the **`aggregatorId`**. This is how feeds will be identified on the Switchboard contract.

#### Feeds only exist per network

**Feeds only exist on a single network.** A feed created on Arbitrum will not work if one tries to read its result onto Morph**. The feed would need to be re-created** on Morph for it to work.&#x20;

## Step 2: Solidity Integration

#### Solidity

The code below shows the flow for leveraging Switchboard feeds in Solidity.

<pre class="language-solidity"><code class="lang-solidity">pragma solidity ^0.8.0;

<strong>import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
</strong>
contract Example {
  ISwitchboard switchboard;

  // Every Switchboard feed has a unique aggregator id 
  bytes32 aggregatorId;
  
  // Store the latest value
  int128 public result;
  
  // If the transaction fee is not paid, the update will fail.
  error InsufficientFee(uint256 expected, uint256 received);

  // If the feed result is invalid, this error will be emitted.
  error InvalidResult(int128 result);

  // If the Switchboard update succeeds, this event will be emitted with the latest price.
  event FeedData(int128 price);

  /**
   * @param _switchboard The address of the Switchboard contract
   * @param _aggregatorId The feed ID for the feed you want to query
   */
  constructor(address _switchboard, bytes32 _aggregatorId) {
    // Initialize the target _switchboard
    // Get the existing Switchboard contract address on your preferred network from the Switchboard Docs
    switchboard = ISwitchboard(_switchboard);
    aggregatorId = _aggregatorId;
  }

  /**
   * getFeedData is a function that uses an encoded Switchboard update
   * If the update is successful, it will read the latest price from the feed
   * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
   * @param updates Encoded feed updates to update the contract with the latest result
   */
  function getFeedData(bytes[] calldata updates) public payable {

    // Get the fee for updating the feeds. If the transaction fee is not paid, the update will fail.
    uint256 fees = switchboard.getFee(updates);
    if (msg.value &#x3C; fee) {
      revert InsufficientFee(fee, msg.value);
    }

    // Submit the updates to the Switchboard contract
    switchboard.updateFeeds{ value: fees }(updates);

    // Read the current value from a Switchboard feed.
    // This will fail if the feed doesn't have fresh updates ready (e.g. if the feed update failed)
    // This is encoded as decimal * 10^18 to avoid floating point issues
    result = switchboard.latestUpdate(aggregatorId).result;

    // In this example, we revert if the result is negative
    if (result &#x3C; 0) {
      revert InvalidResult(result);
    }

    // Emit the latest result from the feed
    emit FeedData(latestUpdate.result);
  }
}
</code></pre>

This contract:

1. Sets the Switchboard contract address and aggregator ID in the constructor
2. Defines a function `getFeedData`
3. Checks if the transaction fee is paid, using `switchboard.getFee(bytes[] calldata updates)`.
4. Submits the updates to the Switchboard contract using `switchboard.updateFeeds(bytes[] calldata updates)`.
5. Reads the latest value from the feed using `switchboard.getLatestValue(bytes32 aggregatorId)`.
6. Emits the latest result from the feed.

## Step 3: Using the Feed&#x20;

#### Simulating a Result

You might want to show some ticker on a user interface for a particular Switchboard feed. Using [Crossbar](../../running-crossbar/) and its Typescript SDK.&#x20;

<pre class="language-typescript"><code class="lang-typescript">import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";

// for initial testing and development, you can use the rate-limited 
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

// fetch simulated results
<strong>const results = await crossbar.simulateEVMFeeds(
</strong><strong>  1115, // chainId (Core Testnet is 1115)
</strong><strong>  ["0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71"], // aggregator ID's
</strong><strong>);
</strong>
console.log(results);
</code></pre>

#### Using the Encoded Updates

To get the encoded updates for the feed, you can use the Switchboard Typescript SDK. Here's an example of how to get the encoded updates:

<pre class="language-typescript"><code class="lang-typescript">import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";

// Get Crossbar instance for querying updates 
// for initial testing and development, you can use the rate-limited 
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");

// Create a Switchboard On-Demand job
const chainId = 1115; // Core Devnet (as an example)

// Get the latest update data for a set of feeds
// encoded: `bytes` string of the encoded update for the feed which can be used in your contract
<strong>const { encoded } = await crossbar.fetchEVMResults({ chainId, aggregatorIds });
</strong>
// Target contract address
const exampleAddress = "&#x3C;MY_CONTRACT_ADDRESS>";

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const abi = ["function getFeedData(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);

// Update feeds
await exampleContract.getFeedData(encoded);

// Fetch the current value (for fun)
console.log(await exampleContract.result());

</code></pre>

For more on this example, see the [examples](https://github.com/switchboard-xyz/evm-on-demand).
