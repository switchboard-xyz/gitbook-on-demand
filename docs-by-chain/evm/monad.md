# Monad Integration

Monad is the primary EVM test network exercised by the current `sb-on-demand-examples` repo. The verified Monad testnet Switchboard proxy is `0x6724818814927e057a693f4e3A172b6cC1eA690C`.

## Network Information

| Network | Chain ID | RPC URL | Switchboard Contract |
|---------|----------|---------|---------------------|
| **Mainnet** | 143 | `https://rpc-mainnet.monadinfra.com/rpc/YOUR_API_KEY` | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |
| **Testnet** | 10143 | `https://testnet-rpc.monad.xyz` | `0x6724818814927e057a693f4e3A172b6cC1eA690C` |

## Quick Start

### Price Feeds

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/evm/price-feeds
bun install
forge build
cp .env.example .env
```

Set your `.env` like this:

```bash
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://testnet-rpc.monad.xyz
NETWORK=monad-testnet
# Optional: if omitted, the example deploys a new consumer contract for you
CONTRACT_ADDRESS=0xyour_existing_consumer
```

Then run:

```bash
bun run example
```

This flow was verified on Monad testnet. The packaged script now handles the current Crossbar Monad testnet rollout by falling back to the network-agnostic oracle quote endpoint if the chain-specific feed lookup is unavailable.

### Direct Randomness

```bash
cd ../randomness
bun install
PRIVATE_KEY=0xyour_private_key_here bun run example
```

That example talks directly to the Switchboard proxy, creates a randomness request, waits for the settlement window, resolves through Crossbar, and settles on-chain.

### Coin Flip

```bash
cd coin-flip
bun install
forge build
forge script deploy/CoinFlip.s.sol:CoinFlipScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

After deployment, fund the example contract with a small bankroll so it can pay winning flips:

```bash
cast send $COIN_FLIP_CONTRACT_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --value 0.05ether
```

Set your `.env`:

```bash
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://testnet-rpc.monad.xyz
COIN_FLIP_CONTRACT_ADDRESS=0xyour_deployed_contract
WAGER_AMOUNT=0.01
```

Run the game script:

```bash
bun run flip
```

### Pancake Stacker

```bash
cd ../pancake-stacker
bun install
forge build
forge script deploy/PancakeStacker.s.sol:PancakeStackerScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Set your `.env`:

```bash
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://testnet-rpc.monad.xyz
PANCAKE_STACKER_CONTRACT_ADDRESS=0xyour_deployed_contract
```

Then run:

```bash
bun run flip
```

If a previous run already created a pending flip, the packaged script resumes settlement instead of failing.

## Integration Example

```typescript
import { ethers } from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const switchboard = new ethers.Contract(
  "0x6724818814927e057a693f4e3A172b6cC1eA690C",
  ["function getFee(bytes[] calldata updates) external view returns (uint256)"],
  signer
);

const priceConsumer = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  ["function updatePrices(bytes[] calldata updates, bytes32[] calldata feedIds) external payable"],
  signer
);

const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");
const feedHash = "0xa0950ee5ee117b2e2c30f154a69e17bfb489a7610c508dc5f67eb2a14616d8ea";

const response = await crossbar.fetchOracleQuote([feedHash], "mainnet");
const updates = [response.encoded];
const fee = await switchboard.getFee(updates);

await priceConsumer.updatePrices(updates, [feedHash], { value: fee });
```

## Monad Notes

- `MON` is the native gas token on Monad.
- The current examples repo is organized as standalone subprojects under `evm/price-feeds`, `evm/randomness`, `evm/randomness/coin-flip`, and `evm/randomness/pancake-stacker`.
- Testnet MON is available from the [Monad faucet](https://faucet.monad.xyz).
