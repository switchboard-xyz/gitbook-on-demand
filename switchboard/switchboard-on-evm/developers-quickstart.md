---
description: 'NOTICE: Switchboard On-Demand on EVM is currently an unaudited alpha.'
---

# Developers: Quickstart!

### Current Deployments

Explore the Switchboard contract [here](https://louper.dev/diamond/0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C?network=coreDao), and find its contract addresses at:

* Core Mainnet: [0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C](https://scan.coredao.org/address/0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C)
* Core Testnet: [0x2f833D73bA1086F3E5CDE9e9a695783984636A76](https://scan.test.btcs.network/address/0x2f833D73bA1086F3E5CDE9e9a695783984636A76)
* Arbitrum Sepolia: [0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b](https://sepolia.arbiscan.io/address/0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b)
* Arbitrum One: [0xad9b8604b6b97187cde9e826cdeb7033c8c37198](https://arbiscan.io/address/0xad9b8604b6b97187cde9e826cdeb7033c8c37198)
* Morph Holesky: [0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5](https://explorer-holesky.morphl2.io/address/0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5)

### First Steps!

There's a [Solidity-SDK](https://github.com/switchboard-xyz/evm-on-demand) that you can use to interact with the oracle contract on-chain and leverage customized oracle data within your smart contracts. For querying oracle updates off-chain for on-chain submission, you can use the [Switchboard On-Demand Typescript-SDK](https://www.npmjs.com/package/@switchboard-xyz/on-demand/v/1.0.54-alpha.3).

### Prerequisites

To use Switchboard On-Demand, you will need to have a basic understanding of Ethereum and smart contracts. For more on Switchboard's Architecture, see the [docs](https://switchboardxyz.gitbook.io/switchboard-on-demand/architecture-design) (EVM docs will be consolidated with main docs upon completion of audit).

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

If you're using Forge, add following to your remappings.txt file:&#x20;

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

### Usage

#### Designing a Switchboard On-Demand Feed

To design a Switchboard On-Demand feed, you can use the [On-Demand Builder](https://app.switchboard.xyz/solana/mainnet). Switchboard Feeds are created by specifying data sources and aggregation methods in an [OracleJob](https://docs.switchboard.xyz/api/next/protos/OracleJob) format.

Here's an example of creating a feed for querying ETH/USDC on Binance:

```typescript
import { OracleJob } from "@switchboard-xyz/on-demand";

const jobs: OracleJob[] = [
  new OracleJob({
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

console.log("Running simulation...\n");

// Print the jobs that are being run.
const jobJson = JSON.stringify({ jobs: jobs.map((job) => job.toJSON()) });
console.log(jobJson);
console.log();

// Serialize the jobs to base64 strings.
const serializedJobs = jobs.map((oracleJob) => {
  const encoded = OracleJob.encodeDelimited(oracleJob).finish();
  const base64 = Buffer.from(encoded).toString("base64");
  return base64;
});

// Call the simulation server.
const response = await fetch("https://api.switchboard.xyz/api/simulate", {
  method: "POST",
  headers: [["Content-Type", "application/json"]],
  body: JSON.stringify({ cluster: "Mainnet", jobs: serializedJobs }),
});

// Check response.
if (response.ok) {
  const data = await response.json();
  console.log(`Response is good (${response.status})`);
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log(`Response is bad (${response.status})`);
  console.log(await response.text());
}
```

#### Solidity

The code below shows the flow for leveraging Switchboard feeds in Solidity.

```solidity
pragma solidity ^0.8.0;

import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@@switchboard-xyz/on-demand-solidity/Structs.sol";

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

  /**
   * getFeedData is a function that uses an encoded Switchboard update
   * If the update is successful, it will read the latest price from the feed
   * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
   * @param updates Encoded feed updates to update the contract with the latest result
   */
  function getFeedData(bytes[] calldata updates) public payable {


    // Get the fee for updating the feeds. If the transaction fee is not paid, the update will fail.
    uint256 fee = switchboard.getFee(updates);
    if (msg.value < fee) {
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
    if (result < 0) {
      revert InvalidResult(result);
    }

    // Emit the latest result from the feed
    emit FeedData(latestUpdate.result);
  }
}
```

This contract:

1. Sets the Switchboard contract address and feed ID in the constructor
2. Defines a function `getFeedData`
3. Checks if the transaction fee is paid, using `switchboard.getFee(bytes[] calldata updates)`.
4. Submits the updates to the Switchboard contract using `switchboard.updateFeeds(bytes[] calldata updates)`.
5. Reads the latest value from the feed using `switchboard.getLatestValue(bytes32 feedId)`.
6. Emits the latest result from the feed.

#### Getting the Encoded Updates

To get the encoded updates for the feed, you can use the Switchboard Typescript SDK. Here's an example of how to get the encoded updates:

```typescript
import { EVM } from "@switchboard-xyz/on-demand";

// Create a Switchboard On-Demand job
const chainId = 1115; // Core Devnet (as an example)

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
```
