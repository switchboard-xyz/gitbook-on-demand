# Monad Integration

Monad is the primary EVM network exercised by the current `sb-on-demand-examples` repo. The runnable EVM examples now share a single network switch:

- `NETWORK=monad-testnet`
- `NETWORK=monad-mainnet`

If `NETWORK` is unset, the examples default to `monad-testnet`.

## Network Information

| Network | Chain ID | Default RPC | Switchboard Contract |
| --- | --- | --- | --- |
| Monad Testnet | `10143` | `https://testnet-rpc.monad.xyz` | `0x6724818814927e057a693f4e3A172b6cC1eA690C` |
| Monad Mainnet | `143` | `https://rpc.monad.xyz` | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |

`RPC_URL` remains available as an override, but it must still resolve to the chain implied by `NETWORK`.

## Shared Env Contract

The runnable EVM examples use the same env model:

```bash
PRIVATE_KEY=0xyour_private_key_here
NETWORK=monad-testnet
RPC_URL=
SWITCHBOARD_ADDRESS=
```

Per-example contract addresses stay separate:

- `CONTRACT_ADDRESS` for `evm/price-feeds`
- `COIN_FLIP_CONTRACT_ADDRESS` for `evm/randomness/coin-flip`
- `PANCAKE_STACKER_CONTRACT_ADDRESS` for `evm/randomness/pancake-stacker`

## Guardrails

Before broadcasting transactions, the packaged scripts verify:

- `NETWORK` is supported
- the RPC chain ID matches `NETWORK`
- the resolved Switchboard contract has bytecode
- Monad `SWITCHBOARD_ADDRESS` overrides match the canonical address for the selected network
- any reused contract address already has deployed bytecode

## Quick Start: Price Feeds

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/evm/price-feeds
bun install
forge build
cp .env.example .env
```

Run on testnet:

```bash
bun run deploy
bun run example
```

Flip to mainnet with one env var:

```bash
NETWORK=monad-mainnet bun run deploy
NETWORK=monad-mainnet bun run example
```

The packaged script handles the current Crossbar Monad testnet rollout by falling back to the network-agnostic oracle quote endpoint if the chain-specific feed lookup is unavailable.

## Quick Start: Direct Randomness

```bash
cd ../randomness
bun install
PRIVATE_KEY=0xyour_private_key_here bun run example
```

That helper talks directly to the Switchboard proxy, creates a randomness request, waits for the settlement window, resolves through Crossbar, and settles on-chain. It also supports `hyperliquid-mainnet` in addition to Monad.

## Quick Start: Coin Flip

```bash
cd coin-flip
bun install
forge build
cp .env.example .env
```

Run on testnet:

```bash
bun run deploy
bun run flip
```

Run on mainnet:

```bash
NETWORK=monad-mainnet bun run deploy
NETWORK=monad-mainnet bun run flip
```

After deployment, fund the example contract with a small bankroll so it can pay winning flips:

```bash
cast send $COIN_FLIP_CONTRACT_ADDRESS \
  --rpc-url ${RPC_URL:-https://testnet-rpc.monad.xyz} \
  --private-key $PRIVATE_KEY \
  --value 0.05ether
```

## Quick Start: Pancake Stacker

```bash
cd ../pancake-stacker
bun install
forge build
cp .env.example .env
```

Run on testnet:

```bash
bun run deploy
bun run flip
```

Run on mainnet:

```bash
NETWORK=monad-mainnet bun run deploy
NETWORK=monad-mainnet bun run flip
```

If a previous run already created a pending flip, the packaged script resumes settlement instead of failing.

## Integration Example

```typescript
import { ethers } from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

const networkName = process.env.NETWORK || "monad-testnet";
const chainId = networkName === "monad-mainnet" ? 143 : 10143;
const rpcUrl =
  process.env.RPC_URL ||
  (networkName === "monad-mainnet"
    ? "https://rpc.monad.xyz"
    : "https://testnet-rpc.monad.xyz");
const switchboardAddress =
  networkName === "monad-mainnet"
    ? "0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67"
    : "0x6724818814927e057a693f4e3A172b6cC1eA690C";

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const switchboard = new ethers.Contract(
  switchboardAddress,
  ["function getFee(bytes[] calldata updates) external view returns (uint256)"],
  signer
);

const priceConsumer = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  ["function updatePrices(bytes[] calldata updates, bytes32[] calldata feedIds) external payable"],
  signer
);

const feedHash = "0xa0950ee5ee117b2e2c30f154a69e17bfb489a7610c508dc5f67eb2a14616d8ea";
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");
const { encoded } = await crossbar.fetchEVMResults({
  chainId,
  aggregatorIds: [feedHash],
});

const fee = await switchboard.getFee(encoded);
const tx = await priceConsumer.updatePrices(encoded, [feedHash], { value: fee });
await tx.wait();
```

## Notes

- `MON` is the native gas token on Monad.
- Testnet MON is available from the [Monad faucet](https://faucet.monad.xyz).
- The generic randomness helper at `evm/randomness/randomness.ts` still supports `hyperliquid-mainnet` in addition to Monad.
- The current examples repo is organized as standalone subprojects under `evm/price-feeds`, `evm/randomness`, `evm/randomness/coin-flip`, and `evm/randomness/pancake-stacker`.
