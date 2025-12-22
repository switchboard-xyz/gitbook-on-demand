# Price Feeds Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/evm/price-feeds](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/evm/price-feeds)

This tutorial walks you through integrating Switchboard oracle price feeds into your EVM smart contracts. You'll learn how to fetch oracle data, submit updates to your contract, and read verified prices.

## What You'll Build

A Solidity smart contract that:
- Receives and stores verified oracle price updates
- Validates price freshness and deviation
- Provides helper functions for DeFi use cases (collateral ratios, liquidations)

Plus a TypeScript client that fetches oracle data and submits it to your contract.

## Prerequisites

- **Foundry** for Solidity development (`forge`, `cast`)
- **Bun** or Node.js 18+
- Native tokens for gas (MON, ETH, etc.)
- Basic understanding of Solidity and ethers.js

## Key Concepts

### How Switchboard On-Demand Works on EVM

Switchboard uses an **on-demand** model where:

1. **Your client** fetches signed price data from Crossbar (Switchboard's gateway)
2. **Your contract** submits the signed data to the Switchboard contract for verification
3. **Switchboard verifies** the oracle signatures and stores the data
4. **Your contract** reads the verified data via `latestUpdate()`

This pattern ensures prices are cryptographically verified on-chain while keeping gas costs low.

### The CrossbarClient

The `CrossbarClient` from `@switchboard-xyz/common` is your interface to fetch oracle data:

```typescript
import { CrossbarClient } from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");
const { encoded } = await crossbar.fetchEVMResults({
  chainId: 999,  // Your chain ID
  aggregatorIds: [feedId],
});
```

### Fee Handling

Some networks require a fee for oracle updates. Always check before submitting:

```typescript
const fee = await switchboard.getFee(encoded);
await contract.updatePrices(encoded, { value: fee });
```

## The Smart Contract

Here's a complete example contract that integrates Switchboard price feeds:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ISwitchboard } from "./switchboard/interfaces/ISwitchboard.sol";
import { SwitchboardTypes } from "./switchboard/libraries/SwitchboardTypes.sol";

/**
 * @title SwitchboardPriceConsumer
 * @notice Example contract demonstrating Switchboard On-Demand oracle integration
 *
 * Key Features:
 * - Secure price updates with signature verification
 * - Staleness checks to prevent old data usage
 * - Price deviation validation
 * - Multi-feed support
 */
contract SwitchboardPriceConsumer {
    // ========== State Variables ==========

    /// @notice The Switchboard contract interface
    ISwitchboard public immutable switchboard;

    /// @notice Stored price data for each feed
    mapping(bytes32 => PriceData) public prices;

    /// @notice Maximum age for price data (default: 5 minutes)
    uint256 public maxPriceAge = 300;

    /// @notice Maximum price deviation in basis points (default: 10% = 1000 bps)
    uint256 public maxDeviationBps = 1000;

    /// @notice Contract owner
    address public owner;

    // ========== Structs ==========

    /**
     * @notice Stored price information for a feed
     * @param value The price value (18 decimals)
     * @param timestamp When the price was last updated
     * @param slotNumber Solana slot number of the update
     */
    struct PriceData {
        int128 value;
        uint256 timestamp;
        uint64 slotNumber;
    }

    // ========== Events ==========

    event PriceUpdated(
        bytes32 indexed feedId,
        int128 oldPrice,
        int128 newPrice,
        uint256 timestamp,
        uint64 slotNumber
    );

    event PriceValidationFailed(bytes32 indexed feedId, string reason);

    // ========== Errors ==========

    error InsufficientFee(uint256 expected, uint256 received);
    error PriceTooOld(uint256 age, uint256 maxAge);
    error PriceDeviationTooHigh(uint256 deviation, uint256 maxDeviation);
    error InvalidFeedId();
    error Unauthorized();

    // ========== Constructor ==========

    constructor(address _switchboard) {
        switchboard = ISwitchboard(_switchboard);
        owner = msg.sender;
    }

    // ========== External Functions ==========

    /**
     * @notice Update price feeds with oracle data
     * @param updates Encoded Switchboard updates with signatures
     * @param feedIds Array of feed IDs to process from the update
     */
    function updatePrices(
        bytes[] calldata updates,
        bytes32[] calldata feedIds
    ) external payable {
        // Get the required fee
        uint256 fee = switchboard.getFee(updates);
        if (msg.value < fee) {
            revert InsufficientFee(fee, msg.value);
        }

        // Submit updates to Switchboard (verifies signatures)
        switchboard.updateFeeds{ value: fee }(updates);

        // Process each feed ID
        for (uint256 i = 0; i < feedIds.length; i++) {
            bytes32 feedId = feedIds[i];

            // Get the latest verified update from Switchboard
            SwitchboardTypes.LegacyUpdate memory update = switchboard.latestUpdate(feedId);

            // Store the price with validation
            _processFeedUpdate(
                feedId,
                update.result,
                uint64(update.timestamp),
                update.slotNumber
            );
        }

        // Refund excess payment
        if (msg.value > fee) {
            (bool success, ) = msg.sender.call{ value: msg.value - fee }("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Get the current price for a feed
     * @param feedId The feed identifier
     * @return value The price value
     * @return timestamp The update timestamp
     * @return slotNumber The Solana slot number
     */
    function getPrice(
        bytes32 feedId
    ) external view returns (int128 value, uint256 timestamp, uint64 slotNumber) {
        PriceData memory priceData = prices[feedId];
        if (priceData.timestamp == 0) revert InvalidFeedId();
        return (priceData.value, priceData.timestamp, priceData.slotNumber);
    }

    /**
     * @notice Check if a price is fresh (within maxPriceAge)
     */
    function isPriceFresh(bytes32 feedId) public view returns (bool) {
        PriceData memory priceData = prices[feedId];
        if (priceData.timestamp == 0) return false;
        return block.timestamp - priceData.timestamp <= maxPriceAge;
    }

    // ========== Internal Functions ==========

    function _processFeedUpdate(
        bytes32 feedId,
        int128 newValue,
        uint64 timestamp,
        uint64 slotNumber
    ) internal {
        PriceData memory oldPrice = prices[feedId];

        // Validate price deviation if we have a previous price
        if (oldPrice.timestamp != 0) {
            uint256 deviation = _calculateDeviation(oldPrice.value, newValue);
            if (deviation > maxDeviationBps) {
                emit PriceValidationFailed(feedId, "Deviation too high");
                revert PriceDeviationTooHigh(deviation, maxDeviationBps);
            }
        }

        // Store the new price
        prices[feedId] = PriceData({
            value: newValue,
            timestamp: timestamp,
            slotNumber: slotNumber
        });

        emit PriceUpdated(feedId, oldPrice.value, newValue, timestamp, slotNumber);
    }

    function _calculateDeviation(
        int128 oldValue,
        int128 newValue
    ) internal pure returns (uint256) {
        if (oldValue == 0) return 0;

        uint128 absOld = oldValue < 0 ? uint128(-oldValue) : uint128(oldValue);
        uint128 absNew = newValue < 0 ? uint128(-newValue) : uint128(newValue);

        uint128 diff = absNew > absOld ? absNew - absOld : absOld - absNew;
        return (uint256(diff) * 10000) / uint256(absOld);
    }
}
```

### Contract Walkthrough

#### State Variables

```solidity
ISwitchboard public immutable switchboard;
mapping(bytes32 => PriceData) public prices;
uint256 public maxPriceAge = 300;
uint256 public maxDeviationBps = 1000;
```

- `switchboard` - Reference to the deployed Switchboard contract
- `prices` - Maps feed IDs to their latest price data
- `maxPriceAge` - Maximum acceptable age for price data (5 minutes default)
- `maxDeviationBps` - Maximum price change allowed (10% default, prevents manipulation)

#### The updatePrices Function

This is the main entry point for updating prices:

1. **Check fee** - Ensure caller sent enough to cover the oracle update fee
2. **Submit to Switchboard** - Call `updateFeeds()` which verifies oracle signatures
3. **Read verified data** - Call `latestUpdate()` to get the verified price
4. **Store locally** - Save the price in your contract's storage
5. **Refund excess** - Return any overpayment to the caller

#### Reading Prices

```solidity
(int128 value, uint256 timestamp, uint64 slotNumber) = consumer.getPrice(feedId);
```

Always check freshness before using a price:

```solidity
require(consumer.isPriceFresh(feedId), "Price is stale");
```

## The TypeScript Client

Here's a complete client that fetches oracle data and submits it to your contract:

```typescript
import * as ethers from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

async function main() {
  // Setup
  const privateKey = process.env.PRIVATE_KEY!;
  const contractAddress = process.env.CONTRACT_ADDRESS!;

  const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid.xyz/evm");
  const signer = new ethers.Wallet(privateKey, provider);

  // Contract ABI (minimal)
  const abi = [
    "function updatePrices(bytes[] calldata updates, bytes32[] calldata feedIds) external payable",
    "function getPrice(bytes32 feedId) external view returns (int128 value, uint256 timestamp, uint64 slotNumber)",
    "event PriceUpdated(bytes32 indexed feedId, int128 oldPrice, int128 newPrice, uint256 timestamp, uint64 slotNumber)",
  ];

  const contract = new ethers.Contract(contractAddress, abi, signer);
  const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

  // The feed ID you want to update (e.g., BTC/USD)
  const feedId = "0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812";

  // Step 1: Fetch signed oracle data from Crossbar
  const { encoded } = await crossbar.fetchEVMResults({
    chainId: 999,  // HyperEVM mainnet
    aggregatorIds: [feedId],
  });

  console.log("Fetched", encoded.length, "encoded updates");

  // Step 2: Submit to your contract
  const tx = await contract.updatePrices(encoded, [feedId]);
  console.log("Transaction hash:", tx.hash);

  // Step 3: Wait for confirmation
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Step 4: Parse events
  const iface = new ethers.Interface(abi);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === "PriceUpdated") {
        console.log("\n=== Price Updated ===");
        console.log("Feed ID:", parsed.args.feedId);
        console.log("New Price:", ethers.formatUnits(parsed.args.newPrice, 18));
        console.log("Timestamp:", new Date(Number(parsed.args.timestamp) * 1000).toISOString());
      }
    } catch (e) {
      // Skip non-matching logs
    }
  }

  // Step 5: Read the stored price
  const [value, timestamp, slotNumber] = await contract.getPrice(feedId);
  console.log("\n=== Current Price ===");
  console.log("Value:", ethers.formatUnits(value, 18));
  console.log("Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
  console.log("Slot:", slotNumber.toString());
}

main().catch(console.error);
```

### Client Walkthrough

#### Step 1: Fetch Oracle Data

```typescript
const { encoded } = await crossbar.fetchEVMResults({
  chainId: 999,
  aggregatorIds: [feedId],
});
```

The `fetchEVMResults` call returns encoded oracle data signed by Switchboard oracles. This data includes:
- The price value
- Timestamp
- Oracle signatures

#### Step 2: Submit to Contract

```typescript
const tx = await contract.updatePrices(encoded, [feedId]);
```

Your contract receives the encoded data, submits it to Switchboard for verification, then stores the result.

#### Step 3-5: Confirm and Read

After confirmation, you can:
- Parse `PriceUpdated` events from the receipt
- Read the stored price directly from your contract

## Deployment

### Using Foundry

Create a deploy script `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SwitchboardPriceConsumer.sol";

contract Deploy is Script {
    // Switchboard addresses by network
    address constant MONAD_TESTNET = 0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33;
    address constant MONAD_MAINNET = 0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67;
    address constant HYPERLIQUID_MAINNET = 0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347;

    function run() external {
        address switchboardAddress = MONAD_TESTNET; // Change as needed

        vm.startBroadcast();
        SwitchboardPriceConsumer consumer = new SwitchboardPriceConsumer(switchboardAddress);
        vm.stopBroadcast();

        console.log("Deployed at:", address(consumer));
    }
}
```

### Deploy Commands

```bash
# Monad Testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  -vvvv

# Monad Mainnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc-mainnet.monadinfra.com/rpc/YOUR_KEY \
  --broadcast \
  -vvvv

# HyperEVM Mainnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.hyperliquid.xyz/evm \
  --broadcast \
  -vvvv
```

## Running the Example

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/evm
```

### 2. Install Dependencies

```bash
bun install
forge install
```

### 3. Set Environment Variables

```bash
export PRIVATE_KEY=0x...
export EXAMPLE_ADDRESS=0x...  # Your deployed contract
```

### 4. Run the Example

```bash
bun run examples/updateFeed.ts
```

### Expected Output

```
Aggregator ID: 0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
Encoded updates length: 1
Transaction hash: 0x...
Transaction confirmed in block: 12345678

=== Feed Update Event ===
Price: 97234500000000000000000
Timestamp: 2024-12-18T10:30:00.000Z
Oracle ID: 0x...

=== Latest Update Details ===
Result: 97234500000000000000000
Timestamp: 2024-12-18T10:30:00.000Z
```

## Adding to Your Project

### 1. Install the Switchboard Interfaces

Copy the interface files from the examples repo:

```bash
cp -r sb-on-demand-examples/evm/src/switchboard your-project/src/
```

Or install via npm:

```bash
npm install @switchboard-xyz/on-demand-solidity
```

### 2. Import and Use

```solidity
import { ISwitchboard } from "./switchboard/interfaces/ISwitchboard.sol";
import { SwitchboardTypes } from "./switchboard/libraries/SwitchboardTypes.sol";

contract YourContract {
    ISwitchboard public switchboard;

    constructor(address _switchboard) {
        switchboard = ISwitchboard(_switchboard);
    }

    function yourFunction(bytes[] calldata updates, bytes32 feedId) external payable {
        // Submit to Switchboard
        uint256 fee = switchboard.getFee(updates);
        switchboard.updateFeeds{ value: fee }(updates);

        // Read verified data
        SwitchboardTypes.LegacyUpdate memory update = switchboard.latestUpdate(feedId);

        // Use update.result (the price)
        int128 price = update.result;
        // ... your logic here
    }
}
```

## Example: DeFi Business Logic

The example contract includes helper functions for common DeFi patterns:

### Calculate Collateral Ratio

```solidity
function calculateCollateralRatio(
    bytes32 feedId,
    uint256 collateralAmount,
    uint256 debtAmount
) external view returns (uint256 ratio) {
    require(isPriceFresh(feedId), "Price is stale");

    PriceData memory priceData = prices[feedId];

    // Calculate collateral value in USD
    uint256 collateralValue = (collateralAmount * uint128(priceData.value)) / 1e18;

    // Return ratio in basis points (15000 = 150%)
    ratio = (collateralValue * 10000) / debtAmount;
}
```

### Check Liquidation

```solidity
function shouldLiquidate(
    bytes32 feedId,
    uint256 collateralAmount,
    uint256 debtAmount,
    uint256 liquidationThreshold  // e.g., 11000 = 110%
) external view returns (bool) {
    if (!isPriceFresh(feedId)) return false;

    PriceData memory priceData = prices[feedId];
    uint256 collateralValue = (collateralAmount * uint128(priceData.value)) / 1e18;
    uint256 ratio = (collateralValue * 10000) / debtAmount;

    return ratio < liquidationThreshold;
}
```

## Switchboard Contract Addresses

| Network | Chain ID | Switchboard Contract |
|---------|----------|---------------------|
| Monad Testnet | 10143 | `0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33` |
| Monad Mainnet | 143 | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |
| HyperEVM Mainnet | 999 | `0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347` |
| Arbitrum One | 42161 | `0xAd9b8604b6B97187CDe9E826cDeB7033C8C37198` |
| Arbitrum Sepolia | 421614 | `0xA2a0425fA3C5669d384f4e6c8068dfCf64485b3b` |
| Core Mainnet | 1116 | `0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C` |

## Available Feeds

Find available price feeds at the [Switchboard Explorer](https://explorer.switchboard.xyz).

Popular feeds include:
- **BTC/USD**: `0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812`
- **ETH/USD**: `0xa0950ee5ee117b2e2c30f154a69e17bfb489a7610c508dc5f67eb2a14616d8ea`
- **SOL/USD**: `0x822512ee9add93518eca1c105a38422841a76c590db079eebb283deb2c14caa9`

## Troubleshooting

| Error | Solution |
|-------|----------|
| `InsufficientFee` | Query `switchboard.getFee(updates)` and send that amount as `msg.value` |
| `PriceDeviationTooHigh` | Normal during high volatility; adjust `maxDeviationBps` if needed |
| `PriceTooOld` | Fetch fresh data from Crossbar; adjust `maxPriceAge` if needed |
| `InvalidFeedId` | Ensure the feed ID exists and has been updated at least once |
| Build errors | Run `forge clean && forge build` |

## Next Steps

- Explore [randomness integration](../randomness.md) for gaming and NFTs
- Learn about [custom feeds](../../../custom-feeds/README.md) for specialized data
- Join the [Switchboard Discord](https://discord.gg/switchboardxyz) for support
