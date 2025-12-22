# Randomness Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/evm/randomness/pancake-stacker](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/evm/randomness/pancake-stacker)

This tutorial walks you through building **Pancake Stacker**, a simple on-chain game that demonstrates Switchboard's randomness system. You'll learn how to request, resolve, and use verifiable randomness in your EVM smart contracts.

## What You'll Build

A game where players flip pancakes onto a stack:
- Each flip has a **2/3 chance** of landing successfully
- Successful flips increase your stack height
- A failed flip knocks over your entire stack (resets to 0)
- Randomness is generated off-chain by Switchboard oracles and verified on-chain

## Mapping to the Randomness Flow

Before diving into code, let's connect this example to the [conceptual flow](README.md#how-to-use-switchboard-randomness) described in the Randomness Overview. The five parties are:

| Conceptual Party | In Pancake Stacker |
|------------------|-------------------|
| **Alice** | You (running the script or using the UI) |
| **App** | `PancakeStacker` smart contract |
| **Switchboard Contract** | `ISwitchboard` interface |
| **Crossbar** | `CrossbarClient` from `@switchboard-xyz/common` |
| **Oracle** | Switchboard oracle (generates the randomness) |

The two-stage flow maps directly to our two main functions:
- **Request Randomness** → `flipPancake()`
- **Resolve Randomness** → `catchPancake()`

## Prerequisites

- **Foundry** installed for Solidity development
- **Bun** or Node.js 18+
- Native tokens for gas (e.g., MON for Monad)
- Basic understanding of Solidity and ethers.js

## Installation

1. **Solidity SDK:**

```bash
npm install @switchboard-xyz/on-demand-solidity
```

2. **TypeScript SDK** (for off-chain randomness resolution):

```bash
npm install @switchboard-xyz/common ethers
```

3. **Forge remappings** - Add to `remappings.txt`:

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

---

## The Smart Contract

### Imports and State Variables

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { ISwitchboard } from '@switchboard-xyz/on-demand-solidity/interfaces/ISwitchboard.sol';
import { SwitchboardTypes } from '@switchboard-xyz/on-demand-solidity/libraries/SwitchboardTypes.sol';

contract PancakeStacker {

    // Pending flip randomness ID for each user (bytes32(0) = no pending flip)
    mapping(address => bytes32) public pendingFlips;

    // Current stack height for each player
    mapping(address => uint256) public stackHeight;

    // Reference to the Switchboard contract
    ISwitchboard public switchboard;

    constructor(address _switchboard) {
        require(_switchboard != address(0), "Invalid switchboard address");
        switchboard = ISwitchboard(_switchboard);
    }
```

The contract tracks:
- `pendingFlips`: Maps each user to their pending randomness request ID
- `stackHeight`: Maps each user to their current pancake stack count
- `switchboard`: Reference to the Switchboard contract for randomness operations

### Events

```solidity
    event PancakeFlipRequested(address indexed user, bytes32 randomnessId);
    event PancakeLanded(address indexed user, uint256 newStackHeight);
    event StackKnockedOver(address indexed user);
    event SettlementFailed(address indexed user);
```

Events allow the off-chain script (or UI) to track the outcome of each flip.

### Requesting Randomness: flipPancake()

This function implements the **Request Randomness** phase from the overview:

```solidity
    function flipPancake() public {
        // Check no pending flip exists
        require(pendingFlips[msg.sender] == bytes32(0), "Already have pending flip");

        // Generate unique randomnessId using sender address and last blockhash
        bytes32 randomnessId = keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)));

        // Ask Switchboard to create a new randomness request with 1 second settlement delay
        switchboard.createRandomness(randomnessId, 1);

        // Store the randomness request as a pending flip
        pendingFlips[msg.sender] = randomnessId;

        emit PancakeFlipRequested(msg.sender, randomnessId);
    }
```

**Flow mapping:**
1. Alice calls the App (`flipPancake()`)
2. App generates a unique `randomnessId` and calls Switchboard Contract (`createRandomness`)
3. Switchboard Contract assigns an oracle and stores the request
4. App emits event with the `randomnessId` for Alice to use later

### Resolving Randomness: catchPancake()

This function implements the **Resolve Randomness** phase:

```solidity
    function catchPancake(bytes calldata encodedRandomness) public {
        // Make sure caller has a pending flip
        bytes32 randomnessId = pendingFlips[msg.sender];
        require(randomnessId != bytes32(0), "No pending flip");

        // Clear the pending flip BEFORE external calls (CEI pattern)
        delete pendingFlips[msg.sender];

        // Ask Switchboard to verify the randomness is correct
        try switchboard.settleRandomness(encodedRandomness) {

            // Verification succeeded, get the randomness value
            SwitchboardTypes.Randomness memory randomness = switchboard.getRandomness(randomnessId);

            // Verify the randomness ID matches what we requested
            require(randomness.randId == randomnessId, "Randomness ID mismatch");

            // 2/3 chance to land (0 or 1), 1/3 chance to knock over (2)
            bool landed = uint256(randomness.value) % 3 < 2;

            if (landed) {
                stackHeight[msg.sender]++;
                emit PancakeLanded(msg.sender, stackHeight[msg.sender]);
            } else {
                stackHeight[msg.sender] = 0;
                emit StackKnockedOver(msg.sender);
            }

        } catch {
            // Settlement failed - reset stack to be safe
            stackHeight[msg.sender] = 0;
            emit StackKnockedOver(msg.sender);
            emit SettlementFailed(msg.sender);
        }
    }
```

**Flow mapping:**
1. Alice sends the randomness object (obtained from Crossbar) to the App
2. App asks Switchboard Contract to verify the randomness (`settleRandomness`)
3. If valid, App retrieves the value (`getRandomness`) and applies game logic
4. App emits the outcome event

### Helper Function: getFlipData()

This view function provides the data needed for off-chain resolution:

```solidity
    function getFlipData(address user) public view returns (
        bytes32 randomnessId,
        address oracle,
        uint256 rollTimestamp,
        uint256 minSettlementDelay
    ) {
        randomnessId = pendingFlips[user];
        SwitchboardTypes.Randomness memory randomness = switchboard.getRandomness(randomnessId);
        return (randomnessId, randomness.oracle, randomness.rollTimestamp, randomness.minSettlementDelay);
    }
```

---

## The Off-Chain Script

The `stack-pancake.ts` script demonstrates how to interact with the contract from off-chain. While the example repository also includes a React UI, the script is simpler to understand and follows the exact same flow.

> **Note**: The UI code does the same thing as this script, but with React state management and a visual interface. Understanding this script is sufficient to understand how any client (UI, bot, etc.) interacts with the randomness system.

### Setup

```typescript
import { ethers } from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

// Contract ABI (only the functions we need)
const PANCAKE_STACKER_ABI = [
    "function flipPancake() public",
    "function catchPancake(bytes calldata encodedRandomness) public",
    "function getFlipData(address user) public view returns (bytes32 randomnessId, address oracle, uint256 rollTimestamp, uint256 minSettlementDelay)",
    "function getPlayerStats(address user) public view returns (uint256 currentStack, bool hasPendingFlip)",
    "event PancakeLanded(address indexed user, uint256 newStackHeight)",
    "event StackKnockedOver(address indexed user)",
    "event SettlementFailed(address indexed user)",
];

async function main() {
    // Initialize providers
    const rpcUrl = process.env.RPC_URL || "https://rpc.monad.xyz";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

    const contract = new ethers.Contract(
        process.env.PANCAKE_STACKER_CONTRACT_ADDRESS!,
        PANCAKE_STACKER_ABI,
        wallet
    );
```

### Step 1: Check Current Stats

```typescript
    const [currentStack] = await contract.getPlayerStats(wallet.address);
    console.log(`Current stack: ${currentStack} pancakes`);
```

### Step 2: Request Randomness (Flip the Pancake)

```typescript
    // Call flipPancake() to request randomness
    const tx = await contract.flipPancake();
    await tx.wait();
    console.log("Flip requested:", tx.hash);
```

This triggers the **Request Randomness** phase on-chain.

### Step 3: Get Flip Data

```typescript
    // Retrieve the data needed for off-chain resolution
    const flipData = await contract.getFlipData(wallet.address);
```

The contract returns:
- `randomnessId`: Unique identifier for this request
- `oracle`: Address of the assigned oracle
- `rollTimestamp`: When the randomness was rolled
- `minSettlementDelay`: Minimum wait time before settlement

### Step 4: Resolve Randomness via Crossbar

```typescript
    // Get chain ID dynamically
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Ask Crossbar to get randomness from the oracle
    const { encoded } = await crossbar.resolveEVMRandomness({
        chainId,
        randomnessId: flipData.randomnessId,
        timestamp: Number(flipData.rollTimestamp),
        minStalenessSeconds: Number(flipData.minSettlementDelay),
        oracle: flipData.oracle,
    });
```

This is where **Crossbar** talks to the **Oracle** and returns the encoded randomness proof.

### Step 5: Settle On-Chain (Catch the Pancake)

```typescript
    // Submit the encoded randomness to the contract
    const tx2 = await contract.catchPancake(encoded);
    const receipt = await tx2.wait();
```

### Step 6: Parse Events for Outcome

```typescript
    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log);

            if (parsed?.name === "PancakeLanded") {
                console.log(`PANCAKE LANDED! Stack height: ${parsed.args.newStackHeight}`);
            }

            if (parsed?.name === "StackKnockedOver") {
                console.log("STACK KNOCKED OVER!");
            }

            if (parsed?.name === "SettlementFailed") {
                console.log("SETTLEMENT FAILED - stack reset");
            }
        } catch {}
    }
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REQUEST RANDOMNESS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  You (Alice)                                                        │
│      │                                                              │
│      │  1. Call flipPancake()                                       │
│      ▼                                                              │
│  PancakeStacker (App)                                               │
│      │                                                              │
│      │  2. Generate randomnessId                                    │
│      │  3. Call switchboard.createRandomness()                      │
│      ▼                                                              │
│  Switchboard Contract                                               │
│      │                                                              │
│      │  4. Assign oracle, store request                             │
│      │  5. Return to App                                            │
│      ▼                                                              │
│  PancakeStacker emits PancakeFlipRequested event                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RESOLVE RANDOMNESS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  You (Alice)                                                        │
│      │                                                              │
│      │  1. Call getFlipData() to get oracle info                    │
│      │  2. Call crossbar.resolveEVMRandomness()                     │
│      ▼                                                              │
│  Crossbar                                                           │
│      │                                                              │
│      │  3. Request randomness from Oracle                           │
│      ▼                                                              │
│  Oracle                                                             │
│      │                                                              │
│      │  4. Generate randomness, sign it                             │
│      │  5. Return encoded proof to Crossbar                         │
│      ▼                                                              │
│  Crossbar returns encoded randomness to You                         │
│      │                                                              │
│      │  6. Call catchPancake(encoded)                               │
│      ▼                                                              │
│  PancakeStacker (App)                                               │
│      │                                                              │
│      │  7. Call switchboard.settleRandomness()                      │
│      ▼                                                              │
│  Switchboard Contract verifies proof                                │
│      │                                                              │
│      │  8. Return success                                           │
│      ▼                                                              │
│  PancakeStacker applies game logic, emits result event              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### CEI Pattern (Checks-Effects-Interactions)

Notice that `catchPancake()` clears `pendingFlips[msg.sender]` **before** making external calls:

```solidity
// Clear the pending flip BEFORE external calls (CEI pattern)
delete pendingFlips[msg.sender];

// Then make external call
try switchboard.settleRandomness(encodedRandomness) { ... }
```

This prevents reentrancy attacks.

### Settlement Delay

The `minSettlementDelay` (set to 1 second in this example) ensures the randomness can't be resolved instantly. This gives the oracle time to generate the randomness after the request is made, preventing manipulation.

### Try-Catch for Settlement

The contract gracefully handles settlement failures by catching exceptions and resetting the player's state, rather than leaving them stuck with an unresolvable pending flip.

---

## Running the Example

### 1. Clone and Install

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/evm/randomness/pancake-stacker
bun install  # or npm install
```

### 2. Deploy the Contract

```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy (adjust for your target chain)
forge script script/PancakeStacker.s.sol --rpc-url https://rpc.monad.xyz --broadcast
```

### 3. Run the Script

```bash
export PANCAKE_STACKER_CONTRACT_ADDRESS=0x_your_deployed_address
export RPC_URL=https://rpc.monad.xyz

bun scripts/stack-pancake.ts
```

### Expected Output

```
Current stack: 0 pancakes

Flipping pancake...
Flip requested: 0x...

Resolving randomness...
Catching pancake...

========================================
PANCAKE LANDED!
Stack height: 1 pancakes
========================================

Your stack: 1 pancakes
```

---

## Summary

You've now learned how to integrate Switchboard randomness into an EVM smart contract:

1. **Request**: Call `switchboard.createRandomness()` with a unique ID
2. **Resolve**: Use `CrossbarClient.resolveEVMRandomness()` to get the oracle's signed randomness
3. **Settle**: Call `switchboard.settleRandomness()` to verify and `getRandomness()` to retrieve the value
4. **Use**: Apply the random value to your game logic

This pattern works for any application requiring verifiable randomness: games, NFT mints, lotteries, and more.
