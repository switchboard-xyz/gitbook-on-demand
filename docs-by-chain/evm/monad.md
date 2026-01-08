# Monad Integration

Monad is a high-performance EVM-compatible blockchain optimized for speed and efficiency. Switchboard On-Demand provides native oracle support for Monad with the same security guarantees and ease of use as other EVM chains.

## Network Information

| Network | Chain ID | RPC URL | Switchboard Contract |
|---------|----------|---------|---------------------|
| **Mainnet** | 143 | `https://rpc-mainnet.monadinfra.com/rpc/YOUR_API_KEY` | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |
| **Testnet** | 10143 | `https://testnet-rpc.monad.xyz` | `0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33` |

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
RPC_URL=https://testnet-rpc.monad.xyz
NETWORK=monad-testnet
CONTRACT_ADDRESS=0xyour_contract_address
```

### 3. Deploy Contract

```bash
# Testnet
forge script script/DeploySwitchboardPriceConsumer.s.sol:DeploySwitchboardPriceConsumer \
  --rpc-url https://testnet-rpc.monad.xyz \
  --account mykey \
  --broadcast -vvvv

# Mainnet
forge script script/DeploySwitchboardPriceConsumer.s.sol:DeploySwitchboardPriceConsumer \
  --rpc-url https://rpc-mainnet.monadinfra.com/rpc/YOUR_API_KEY \
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

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Switchboard contract on Monad Testnet
const switchboardAddress = '0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33';
const switchboard = new ethers.Contract(switchboardAddress, SWITCHBOARD_ABI, signer);

// Fetch and update prices
const crossbar = new CrossbarClient('https://crossbar.switchboard.xyz');
const feedHash = '0xa0950ee5ee117b2e2c30f154a69e17bfb489a7610c508dc5f67eb2a14616d8ea'; // ETH/USD

const response = await crossbar.fetchOracleQuote([feedHash], 'mainnet');
const fee = await switchboard.getFee([response.encoded]);

const tx = await priceConsumer.updatePrices([response.encoded], { value: fee });
const receipt = await tx.wait();

console.log(`Price updated on Monad! Block: ${receipt.blockNumber}`);
```

## Monad-Specific Considerations

- **Native Token**: MON (for gas fees)
- **High Performance**: Monad's optimized execution enables faster oracle updates
- **Low Fees**: Efficient gas usage for frequent price updates
- **EVM Compatibility**: All existing Ethereum tooling works seamlessly

## Getting MON Tokens

**Testnet:**
- Use the [Monad Testnet Faucet](https://faucet.monad.xyz) to get testnet MON

**Mainnet:**
- Acquire MON tokens through supported exchanges
- Bridge from other networks using official Monad bridges
