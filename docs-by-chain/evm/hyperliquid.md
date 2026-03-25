# Hyperliquid Integration

Switchboard supports HyperEVM with the same encoded-update flow used on other EVM chains. The current examples repo does not ship a dedicated Hyperliquid runner script, but you should reuse the `evm/price-feeds` contract and deployment flow with Hyperliquid-specific chain settings.

## Network Information

| Network | Chain ID | RPC URL | Switchboard Contract |
|---------|----------|---------|---------------------|
| **Mainnet** | 999 | `https://rpc.hyperliquid.xyz/evm` | `0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347` |
| **Testnet** | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` | TBD |

## Quick Start

Clone the examples repo and build the shared price-consumer project:

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/evm/price-feeds
bun install
forge build
```

Deploy the consumer contract to HyperEVM with the packaged Foundry script:

```bash
SWITCHBOARD_ADDRESS=0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347 \
forge script deploy/DeploySwitchboardPriceConsumer.s.sol:DeploySwitchboardPriceConsumer \
  --rpc-url https://rpc.hyperliquid.xyz/evm \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv
```

## Integration Example

```typescript
import { ethers } from "ethers";
import { CrossbarClient } from "@switchboard-xyz/common";

const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid.xyz/evm");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const switchboard = new ethers.Contract(
  "0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347",
  ["function getFee(bytes[] calldata updates) external view returns (uint256)"],
  signer
);

const priceConsumer = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  ["function updatePrices(bytes[] calldata updates, bytes32[] calldata feedIds) external payable"],
  signer
);

const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");
const btcFeedHash = "0x4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812";

await crossbar.simulateFeed(btcFeedHash, false, undefined, "mainnet");

const response = await crossbar.fetchV2Update([btcFeedHash], {
  chain: "evm",
  network: "mainnet",
  use_timestamp: true,
});

if (!response.encoded) {
  throw new Error("Crossbar returned no encoded update payload");
}

const updates = [response.encoded];
const fee = await switchboard.getFee(updates);
const tx = await priceConsumer.updatePrices(updates, [btcFeedHash], { value: fee });
await tx.wait();
```

## Notes

- The packaged `evm/price-feeds/scripts/run.ts` currently includes Monad presets, not Hyperliquid presets.
- For Hyperliquid, reuse the same contract and encoded-update flow shown above with chain ID `999`.
- Hyperliquid network docs: [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs) and [HyperEVM](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm).
