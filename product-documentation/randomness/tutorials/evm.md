# EVM

## Switchboard Randomness for EVM applications

Switchboard On-Demand Randomness provides verifiable, tamper-proof random numbers for EVM smart contracts. This guide covers both the smart contract implementation and the off-chain resolution process.

### Use Cases

- **Gaming**: Fair loot drops, random encounters, card shuffling
- **NFTs**: Random trait generation, blind box reveals
- **DeFi**: Random liquidation selection, lottery mechanisms

### Prerequisites

* Basic understanding of Ethereum and smart contracts.
* Familiarity with common smart contract development tools (e.g., Hardhat, Foundry).
* A development environment set up and ready to go.

### Supported Networks

| Network | Chain ID | Switchboard Contract | Block Explorer |
|---------|----------|---------------------|----------------|
| **Monad Testnet** | 10143 | `0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33` | [testnet.monadexplorer.com](https://testnet.monadexplorer.com) |
| **Monad Mainnet** | 143 | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` | [monadexplorer.com](https://monadexplorer.com) |
| **Hyperliquid Mainnet** | 999 | `0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347` | [explorer.hyperliquid.xyz](https://explorer.hyperliquid.xyz) |

For a complete list of deployments, see [EVM Identifiers](../../../tooling-and-resources/technical-resources-and-documentation/evm-identifiers.md).

### Installation

1.  **Solidity SDK:**

    ```bash
    npm install @switchboard-xyz/on-demand-solidity
    ```

2.  **TypeScript SDK:** (For off-chain randomness resolution)

    ```bash
    npm install @switchboard-xyz/common
    ```

3.  **Forge (If applicable):** Add the following lines to your `remappings.txt` file:

    ```
    @switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
    ```

---

## Smart Contract Implementation

### Step 1: Contract Setup (Solidity)

1.  **Import Switchboard Interfaces:**

    ```solidity
    import {Structs} from "@switchboard-xyz/on-demand-solidity/structs/Structs.sol";
    import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
    ```

2.  **Implementation:**

    ```solidity
    // Address of the Switchboard contract
    address private immutable _switchboard;

    // Random Number to receive Switchboard Randomness
    uint256 public randomNumber;

    // Reference to the Switchboard contract
    ISwitchboard switchboard;

    // Queue IDs
    bytes32 constant MAINNET_QUEUE = 0x86807068432f186a147cf0b13a30067d386204ea9d6c8b04743ac2ef010b0752;
    bytes32 constant TESTNET_QUEUE = 0xc9477bfb5ff1012859f336cf98725680e7705ba2abece17188cfb28ca66ca5b0;

    // Choose chain-appropriate queue
    bytes32 public queue;

    constructor(address switchboardAddress, bool isMainnet) {
       _switchboard = switchboardAddress;
       switchboard = ISwitchboard(switchboardAddress);

       // setup the chain selection for mainnet or testnet
       if(isMainnet){
           queue = MAINNET_QUEUE;
       } else {
           queue = TESTNET_QUEUE;
       }
    }

    // Unique identifier for each randomness request
    bytes32 public randomnessId;
    ```

Note that one has to inject the address of the Switchboard contract on deployment and select the appropriate network for the queue. For reference, the latest deployments can be found in [EVM Identifiers](../../../tooling-and-resources/technical-resources-and-documentation/evm-identifiers.md).

### Step 2: Request Randomness

Call the `requestRandomness` function within your smart contract:

```solidity
function roll() external {
    ...
    // Make it unique and random
    randomnessId = keccak256(abi.encodePacked(msg.sender, block.timestamp));

    // Invoke the on-demand contract reference
    switchboard.requestRandomness(
         randomnessId,            // randomnessId (bytes32): Unique ID for the request.
         address(this),           // authority (address): Only this contract should manage randomness.
         queue,                   // queueId (bytes32): Chain selection for requesting randomness.
         1                        // minSettlementDelay (uint16): Minimum seconds to settle the request.
     );
 }
```

`randomnessId` has to be unique for tracking your request. Then inject it into your chain-appropriate `queue` using the deployed Switchboard's `address` and `requestRandomness` function.

**IMPORTANT: Ensure sufficient delay time for randomness to be resolved by oracles! The minimum settlement delay must pass and the request data must propagate on-chain.**

### Step 3: Setup Update Feed Handler

```solidity
// Function for resolving randomness within the same contract.
function resolve(bytes[] calldata switchboardUpdateFeeds) external {
       // invoke
       switchboard.updateFeeds(switchboardUpdateFeeds);

       // store value for later use
       Structs.RandomnessResult memory randomness = switchboard.getRandomness(randomnessId).result;
       require(randomness.settledAt != 0, "Randomness failed to Settle");

       // update the number for state changes
       randomNumber = randomness.value;
 }
```

Given all the correct parameters, you are now able to call into the Switchboard oracle to resolve your randomness.

---

## Off-Chain Resolution (TypeScript)

### Complete Working Example

This example demonstrates the full randomness flow from request to settlement:

```typescript
import { ethers } from 'ethers';
import { CrossbarClient } from '@switchboard-xyz/common';

// Network configuration
const NETWORKS = {
  'monad-testnet': {
    chainId: 10143,
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    switchboard: '0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33',
    blockExplorer: 'https://testnet.monadexplorer.com',
  },
  'monad-mainnet': {
    chainId: 143,
    rpcUrl: 'https://rpc.monad.xyz',
    switchboard: '0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67',
    blockExplorer: 'https://monadexplorer.com',
  },
  'hyperliquid-mainnet': {
    chainId: 999,
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    switchboard: '0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347',
    blockExplorer: 'https://explorer.hyperliquid.xyz',
  },
};

// Switchboard ABI for randomness functions
const SWITCHBOARD_ABI = [
  'function createRandomness(bytes32 randomnessId, uint64 minSettlementDelay) external returns (address oracle)',
  'function getRandomness(bytes32 randomnessId) external view returns (tuple(bytes32 randId, uint256 createdAt, address authority, uint256 rollTimestamp, uint64 minSettlementDelay, address oracle, uint256 value, uint256 settledAt))',
  'function isRandomnessReady(bytes32 randomnessId) external view returns (bool ready)',
  'function settleRandomness(bytes calldata encodedRandomness) external payable',
  'function updateFee() external view returns (uint256)',
];
```

### Step-by-Step Flow

#### 1. Create Randomness Request

```typescript
const networkName = 'monad-testnet';
const network = NETWORKS[networkName];

const provider = new ethers.JsonRpcProvider(network.rpcUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const switchboard = new ethers.Contract(network.switchboard, SWITCHBOARD_ABI, wallet);

// Generate a unique randomness ID
const randomnessId = ethers.keccak256(
  ethers.toUtf8Bytes(`randomness-${Date.now()}-${Math.random()}`)
);

// Min delay before settlement (5 seconds is safe for clock skew)
const minSettlementDelay = 5;

// Create the randomness request
const createTx = await switchboard.createRandomness(randomnessId, minSettlementDelay);
const createReceipt = await createTx.wait();

console.log(`Randomness created in block ${createReceipt.blockNumber}`);
```

#### 2. Wait for Settlement Delay

```typescript
// Get randomness data to check roll timestamp
const randomnessData = await switchboard.getRandomness(randomnessId);

const settlementTime = Number(randomnessData.rollTimestamp) + Number(randomnessData.minSettlementDelay);
const now = Math.floor(Date.now() / 1000);
// Add buffer for clock skew between local machine and oracle
const waitTime = Math.max(0, settlementTime - now + 10);

console.log(`Waiting ${waitTime} seconds for settlement delay...`);
await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
```

#### 3. Fetch Randomness Reveal from Crossbar

```typescript
const crossbar = new CrossbarClient('https://crossbar.switchboard.xyz');

const { encoded: encodedRandomness, response: crossbarResponse } = await crossbar.resolveEVMRandomness({
  chainId: network.chainId,
  randomnessId,
  timestamp: Number(randomnessData.rollTimestamp),
  minStalenessSeconds: Number(randomnessData.minSettlementDelay),
  oracle: randomnessData.oracle,
});

console.log(`Received encoded randomness from Crossbar`);
console.log(`Preview value: ${crossbarResponse.value}`);
```

#### 4. Settle Randomness On-Chain

```typescript
const updateFee = await switchboard.updateFee();

const settleTx = await switchboard.settleRandomness(encodedRandomness, { value: updateFee });
const settleReceipt = await settleTx.wait();

console.log(`Randomness settled in block ${settleReceipt.blockNumber}`);
console.log(`TX: ${network.blockExplorer}/tx/${settleTx.hash}`);
```

#### 5. Read and Use the Random Value

```typescript
const finalData = await switchboard.getRandomness(randomnessId);

console.log(`Random Value: ${finalData.value}`);
console.log(`Settled At: ${new Date(Number(finalData.settledAt) * 1000).toISOString()}`);

// Convert to usable random numbers
console.log(`0-99: ${Number(finalData.value % 100n)}`);
console.log(`Coin flip: ${finalData.value % 2n === 0n ? 'Heads' : 'Tails'}`);
console.log(`D6 roll: ${Number((finalData.value % 6n) + 1n)}`);
console.log(`D20 roll: ${Number((finalData.value % 20n) + 1n)}`);
```

---

## Simple Resolution Example

For a simpler approach using an existing contract with `randomnessId` exposed:

```typescript
import { CrossbarClient } from "@switchboard-xyz/common";
import { ethers } from "ethers";

const exampleAddress = "0xYOUR_CONTRACT_ADDRESS";
const abi = [
  "function randomnessId() external view returns (bytes32)",
  "function resolve(bytes[] calldata updates)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const yourContract = new ethers.Contract(exampleAddress, abi, signer);

// Get the randomness ID from the contract
const randomnessId = await yourContract.randomnessId();

const crossbar = CrossbarClient.default();

const { encoded } = await crossbar.resolveEVMRandomness({
  chainId: 1114, // Your chain ID
  randomnessId: randomnessId,
});

// Submit to contract
const tx = await yourContract.resolve([encoded]);
await tx.wait();

console.log("Randomness resolved in transaction:", tx.hash);
console.log("The random number is:", await yourContract.randomNumber());
```

---

## Integration Tips

- Use the raw 256-bit value for maximum entropy
- Apply modulo for bounded ranges: `value % range`
- For multiple random values, hash the result with different salts
- Store `randomnessId` to verify the result matches your request
- Always add a buffer (5-10 seconds) to the settlement delay for clock skew

## Summary

Integrate Switchboard randomness to get secure, verifiable randomness in your EVM smart contracts. The flow is:

1. **Create** a randomness request on-chain
2. **Wait** for the settlement delay
3. **Fetch** the randomness reveal from Crossbar
4. **Settle** the randomness on-chain
5. **Read** and use the verified random value

You've now implemented a secure and verifiable way to get randomness in your EVM smart contracts!
