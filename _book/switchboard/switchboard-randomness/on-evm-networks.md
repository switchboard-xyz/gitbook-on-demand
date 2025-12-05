---
description: Tutorial for using Randomness on EVM
---

# On EVM Networks

### Randomness

There's a [Solidity-SDK](https://github.com/switchboard-xyz/evm-on-demand) that you can use to interact with the oracle contract on-chain and leverage customized oracle data within your smart contracts. For querying oracle randomness off-chain for on-chain submission, you can use the [Switchboard On-Demand Typescript-SDK](https://www.npmjs.com/package/@switchboard-xyz/on-demand/v/1.0.54-alpha.3).

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

## Step 1: Roll Randomness

The first step to using Switchboard randomness on EVM is to create the contract that will actually call into Switchboard. This requires an active Switchboard deployment. Switchboard is currently supported on the following networks:

### Deployments

* Core Mainnet: [0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C](https://scan.coredao.org/address/0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C)
* Core Testnet: [0x2f833D73bA1086F3E5CDE9e9a695783984636A76](https://scan.test.btcs.network/address/0x2f833D73bA1086F3E5CDE9e9a695783984636A76)
* Arbitrum Sepolia: [0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b](https://sepolia.arbiscan.io/address/0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b)
* Arbitrum One: [0xad9b8604b6b97187cde9e826cdeb7033c8c37198](https://arbiscan.io/address/0xad9b8604b6b97187cde9e826cdeb7033c8c37198)
* Morph Holesky: [0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5](https://explorer-holesky.morphl2.io/address/0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5)

### Making the Contract

1. Import the Switchboard interface:

```solidity
import {Structs} from "@switchboard-xyz/on-demand-solidity/structs/Structs.sol";
import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
```

2. Call **requestRandomness** with the right parameters. Here, randomnessId just has to be a unique `bytes32` of your choice. Pick the queue based on whether the network you're on is a mainnet network or not (Note: Morph Holesky uses mainnet queue).

<pre class="language-solidity"><code class="lang-solidity">// get the switchboard reference
ISwitchboard switchboard = ISwitchboard(_switchboard);

// [DEVNET] Switchoard Devnet Oracle Queue
bytes32 switchboardDevnetQueue =
    0xd9cd6a04191d6cd559a5276e69a79cc6f95555deeae498c3a2f8b3ee670287d1;

// [MAINNET] Switchoard Oracle Queue
bytes32 switchboardQueue =
    0x86807068432f186a147cf0b13a30067d386204ea9d6c8b04743ac2ef010b0752;

// Random Number to receive Switchboard Randomness
uint256 randomNumber;

// Record randomness id
bytes32 randomnessId;

/**
 * Create Request for Switchboard Randomness 
 */
function roll() public {
    // get some randomness id, this can be from anything
<strong>    randomnessId = keccak256(abi.encodePacked(msg.sender, block.timestamp));
</strong>    switchboard.requestRandomness(
        randomnessId, // randomnessId - unique ID identifying the randomness
        address(this), // authority - this contract will own it
        switchboardQueue, // queueId - pick the queue based on your network (mainnet networks use the switchboardQueue)
        30 // min settlement delay - the number of seconds until randomness can be settled
    ); 
    
    // ... do something with randomness request ...
}
</code></pre>

So let's break this down:

* Get the Switchboard interface, **`switchboard`**
* Create **`randomNumber`** to receive the random number
* Get the correct **`queueId`**, **`switchboardDevnetQueue`** for devnet/testnets and **`switchboardQueue`** for mainnets (and Morph Holesky)
* Create function **roll** to request Switchboard randomness.
* Get some **`randomnessId`** - this can be generated any way you want. There just can't be duplicates.
* Call **`requestRandomness`** with the id, authority address (which has the authority to re-roll randomness), queueId, and min settlement delay.&#x20;
* **`minSettlementDelay`** is set to 30 seconds, meaning the randomness can't be resolved by an oracle for 30 seconds from when this tx settles.

3. Make function for resolving randomness. This is done by passing encoded Switchboard updates (requested off-chain from oracles), and calling **`updateFeeds`**, which routes the encoded random number into the user's randomness request.&#x20;

Let's also add a function for resolving randomness:&#x20;

```solidity
/**
 * Resolve a random number through Switchboard
 */
function resolve(bytes[] calldata encoded) public {
    
    // Update randomness - encoded data gets routed to resolve randomness
    switchboard.updateFeeds(encoded);
    
    // Fetch the resolved randomness 
    Structs.RandomnessResult memory randomness = switchboard.getRandomness(randomnessId).result;
    
    // Check that it was settled 
    require(randomness.settledAt != 0, "Randomness failed to Settle");
    
    // Set the random number
    randomNumber = randomness.value;
    
    // ... do something with random number ...
}
```

Here we're just calling **`updateFeeds`** which is routing the encoded updates into the randomness feed update.&#x20;

## Step 2: Resolve Randomness Off-Chain

The next step is to get the encoded randomness resolution from Switchboard. Here's an example using [Crossbar](../crossbar-and-task-runner/) and its Typescript SDK.

<pre class="language-typescript"><code class="lang-typescript">import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";

// for initial testing and development, you can use the rate-limited 
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

// fetch simulated results
<strong>const { encoded } = await crossbar.resolveEVMRandomness({
</strong><strong>  chainId: 1115, // chainId (Core Testnet is 1115)
</strong><strong>  randomnessId: "0x...",
</strong><strong>});
</strong>
</code></pre>

Once you have the randomness resolved, you can put this into a function call for randomness resolution.&#x20;

Here's what a call using ethers could look like:

```typescript
// Target contract address
const exampleAddress = process.env.CONTRACT_ADDRESS as string;

// The Human Readable contract ABI
const abi = ["function resolve(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);

// Update feeds
await exampleContract.resolve(encoded);
```
