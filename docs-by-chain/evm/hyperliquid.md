# Hyperliquid Integration

Hyperliquid is a high-performance Layer 1 blockchain with native perpetual futures and spot trading. Switchboard On-Demand provides native oracle support for HyperEVM with the same security guarantees and ease of use as other EVM chains.

## Network Information

| Network | Chain ID | RPC URL | Switchboard Contract |
|---------|----------|---------|---------------------|
| **Mainnet** | 999 | `https://rpc.hyperliquid.xyz/evm` | `0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347` |
| **Testnet** | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` | TBD |

## Quick Start

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/evm
bun install
```

### 2. Configure Your Wallet

> **Security:** Never use `export PRIVATE_KEY=...` or pass private keys as command-line arguments—they appear in shell history and process listings.

Import your private key into Foundry's encrypted keystore:

```bash
cast wallet import mykey --interactive
# Enter your private key when prompted (hidden from terminal)
# Set a password to encrypt the keystore
```

Create a `.env` file for scripts (add to `.gitignore`):

```bash
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://rpc.hyperliquid.xyz/evm
NETWORK=hyperliquid-mainnet
CONTRACT_ADDRESS=0xyour_contract_address
```

### 3. Deploy Contract

```bash
# Mainnet
forge script script/DeploySwitchboardPriceConsumer.s.sol:DeploySwitchboardPriceConsumer \
  --rpc-url https://rpc.hyperliquid.xyz/evm \
  --account mykey \
  --broadcast -vvvv

# Testnet
forge script script/DeploySwitchboardPriceConsumer.s.sol:DeploySwitchboardPriceConsumer \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
  --account mykey \
  --broadcast -vvvv
```

### 4. Run Examples

```bash
# Price Feeds (reads from .env)
bun scripts/run.ts

# Randomness (reads from .env)
bun run randomness
```

## Integration Example

```typescript
import { ethers } from 'ethers';
import { CrossbarClient, SWITCHBOARD_ABI } from '@switchboard-xyz/common';

const provider = new ethers.JsonRpcProvider('https://rpc.hyperliquid.xyz/evm');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Switchboard contract on Hyperliquid Mainnet
const switchboardAddress = '0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347';
const switchboard = new ethers.Contract(switchboardAddress, SWITCHBOARD_ABI, signer);

// Fetch and update prices for perpetual futures
const crossbar = new CrossbarClient('https://crossbar.switchboard.xyz');
const btcFeedHash = '0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812'; // BTC/USD

const response = await crossbar.fetchOracleQuote([btcFeedHash], 'mainnet');
const fee = await switchboard.getFee([response.encoded]);

const tx = await priceConsumer.updatePrices([response.encoded], { value: fee });
const receipt = await tx.wait();

console.log(`Price updated on Hyperliquid! Block: ${receipt.blockNumber}`);

// Query the updated price
const [value, timestamp, slotNumber] = await priceConsumer.getPrice(btcFeedHash);
console.log(`BTC/USD Price: $${ethers.formatUnits(value, 18)}`);
```

## Resources

- [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs)
- [HyperEVM Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm)

## Getting Started

**Testnet:**
- Use the Hyperliquid testnet to test your integration
- Request testnet tokens through the official faucet

**Mainnet:**
- Bridge ETH to Hyperliquid using the official bridge
- Start with small amounts to test your integration
