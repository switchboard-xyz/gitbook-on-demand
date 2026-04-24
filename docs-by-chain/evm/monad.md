# Monad Integration

Monad is the primary EVM network exercised by the current `sb-on-demand-examples` repo. The packaged EVM examples now share a single network switch:

- `NETWORK=monad-testnet`
- `NETWORK=monad-mainnet`

If `NETWORK` is unset, the examples default to `monad-testnet`.

## Network Information

| Network | Chain ID | Default RPC | Switchboard Proxy |
| --- | --- | --- | --- |
| Monad Testnet | `10143` | `https://testnet-rpc.monad.xyz` | `0x6724818814927e057a693f4e3A172b6cC1eA690C` |
| Monad Mainnet | `143` | `https://rpc.monad.xyz` | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |

`RPC_URL` remains available as an override, but it must still resolve to the chain implied by `NETWORK`.

## Monad Mainnet Contract Details

Monad mainnet uses an ERC1967 proxy. The address apps integrate with is the proxy at `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67`, and the user-facing ABI is the Switchboard implementation ABI.

| Item | Value |
| --- | --- |
| Proxy address | `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67` |
| Proxy code page | [MonadScan proxy code](https://monadscan.com/address/0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67#code) |
| Current implementation | `0x140E3f2E66619FE1113D971291990caC0b5b72Fd` |
| Implementation code page | [MonadScan implementation code](https://monadscan.com/address/0x140E3f2E66619FE1113D971291990caC0b5b72Fd#code) |
| Canonical ABI | `@switchboard-xyz/on-demand-solidity/abis/Switchboard.json` |
| ABI source | [Switchboard ABI in `on-demand-solidity`](https://github.com/switchboard-xyz/sbv3/blob/main/javascript/on-demand-solidity/abis/Switchboard.json) |

> MonadScan code visibility for the live mainnet implementation is still being repaired from the exact deployment source. Until that is finished, use the package ABI above instead of guessing from an empty or stale explorer ABI.

## Randomness API Note

The current EVM randomness interface is:

- `createRandomness`
- `settleRandomness`
- `getRandomness`

`revealRandomness` and `getRandomnessResult` are not part of the current Switchboard EVM interface on Monad.

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
(
  cd ../randomness/coin-flip
  [ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git --shallow
)
forge build
cp .env.example .env
```

Fastest testnet path:

```bash
bun run example
```

If `CONTRACT_ADDRESS` is unset, `bun run example` deploys a fresh consumer before submitting the v2 update. If you want to deploy separately first:

```bash
bun run deploy
# Save the emitted address into CONTRACT_ADDRESS in .env, then rerun:
bun run example
```

Flip to mainnet with one env var:

```bash
NETWORK=monad-mainnet bun run example
```

## Quick Start: Coin Flip

```bash
cd ../randomness/coin-flip
bun install
[ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git --shallow
forge build
cp .env.example .env
```

Run on testnet:

```bash
bun run deploy
```

Save the emitted contract address into `COIN_FLIP_CONTRACT_ADDRESS`, then fund the contract bankroll before the first flip. The contract accepts any positive wager, and the packaged CLI uses `0.01 MON` by default:

```bash
cast send $COIN_FLIP_CONTRACT_ADDRESS \
  --rpc-url ${RPC_URL:-https://testnet-rpc.monad.xyz} \
  --private-key $PRIVATE_KEY \
  --value 0.01ether
```

Then run the CLI flow:

```bash
bun run flip
```

Run on mainnet:

```bash
NETWORK=monad-mainnet bun run deploy
# Save COIN_FLIP_CONTRACT_ADDRESS in .env, fund the bankroll on mainnet, then:
NETWORK=monad-mainnet bun run flip
```

## Integration Example

```typescript
import { ethers } from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

const networkName = process.env.NETWORK || "monad-testnet";
const crossbarNetwork = networkName === "monad-mainnet" ? "mainnet" : "testnet";
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

// Useful when validating a custom Feed Builder feed before sending a transaction.
await crossbar.simulateFeed(feedHash, false, undefined, crossbarNetwork);

const response = await crossbar.fetchV2Update([feedHash], {
  chain: "evm",
  network: crossbarNetwork,
  use_timestamp: true,
});

if (!response.encoded) {
  throw new Error("Crossbar returned no encoded update payload");
}

const updates = [response.encoded];
const fee = await switchboard.getFee(updates);
const tx = await priceConsumer.updatePrices(updates, [feedHash], { value: fee });
await tx.wait();
```

## Custom Feed Troubleshooting

- Feed Builder custom feeds do not require a separate activation or permission toggle on Monad.
- Use the same `bytes32` feed hash/feed ID from Feed Builder or Explorer for the full v2 flow:
  - `GET /v2/fetch/{feedId}`
  - `GET /v2/simulate/{feedId}?network=testnet|mainnet`
  - `GET /v2/update/{feedId}?chain=evm&network=testnet|mainnet&use_timestamp=true`
- If `v2/fetch` and `v2/simulate` succeed but `v2/update` returns `ORACLE_UNAVAILABLE`, the issue is managed oracle or gateway availability for that feed, not a missing deployment step or permission.

## Notes

- Testnet MON is available from the [Monad faucet](https://faucet.monad.xyz).
- The generic randomness helper at `evm/randomness/randomness.ts` still supports `hyperliquid-mainnet` in addition to Monad. Run it from `evm/randomness` after `bun install`, `cp .env.example .env`, and `bun run example`.
