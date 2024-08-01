---
description: Migrating to Switchboard, using Pyth, on EVM Networks
---

# With EVM Networks

## Add Switchboard Dependencies <a href="#install-pyth-sdks" id="install-pyth-sdks"></a>

Switchboard provides two SDKs, one for using the SDK with Typescript, another in Solidity for reading prices on-chain.&#x20;

#### Typescript SDK <a href="#typescript-sdk" id="typescript-sdk"></a>

You can replace these packages with the single Switchboard Typescript SDK, [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand) with has a similar responsibility.

Get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

#### Solidity SDK

You can install the Switchboard On-Demand [Solidity SDK](https://github.com/switchboard-xyz/evm-on-demand) by running:

```bash
# Add the Switchboard Solidity interfaces
npm add @switchboard-xyz/on-demand-solidity
```

#### Forge

If you're using Forge, add following to your **remappings.txt** file:

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

## Updating On-Chain Code

### 1. Updating Imports

#### Pyth

```solidity
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
```

#### Switchboard

```solidity
import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";
```

### 2. Creating the Interface

Saving a reference to the Switchboard contract is quite easy, all you have to do is keep a reference to the Switchboard deployment address (which you can find [here in the docs](../../on-evm-networks/#deployments)). Migrating to using Pyth through Switchboard is simple:&#x20;

#### Pyth

```solidity
IPyth pyth;

constructor(address pythContract) {
  // https://docs.pyth.network/price-feeds/contract-addresses/evm
  pyth = IPyth(pythContract);
}  
```

#### Switchboard

```solidity
ISwitchboard switchboard

constructor(address switchboardContract) {
  // https://docs.switchboard.xyz/docs/switchboard/readme/on-evm-networks#deployments
  switchboard = ISwitchboard(switchboardContract);
}
```

### Step 3: Updating the Feed

#### Pyth

<pre class="language-solidity"><code class="lang-solidity"><strong>function exampleMethod(bytes[] calldata priceUpdate) public payable {
</strong>  uint fee = pyth.getUpdateFee(priceUpdate);
  pyth.updatePriceFeeds{ value: fee }(priceUpdate);
  bytes32 priceFeedId = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // ETH/USD
  PythStructs.Price memory price = pyth.getPrice(priceFeedId);
}
</code></pre>

#### Switchboard

```solidity
function exampleMethod(bytes[] calldata priceUpdate) public payable {
  uint256 fees = switchboard.getFee(updates);
  switchboard.updateFeeds{ value: fees }(updates);
  bytes32 aggregatorId = "0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c";
  Structs.Update memory latestUpdate = switchboard.latestUpdate(aggregatorId);

  // Get the latest feed result (int128)
  // This is encoded as decimal * 10^18
  result = latestUpdate.result;
}
```

The important thing to note about switchboard results is that they'll be stored as a decimal with a scale factor of 18.&#x20;

## Updating Off-Chain Code

### Step 1: Update Imports

Pyth provides an SDK for connecting to Hermes for price updates. Switchboard has the on-demand ts-sdk for interacting with oracles and updating feeds.

#### **Pyth**

```typescript
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import * as ethers from "ethers";
```

#### Switchboard

```typescript
import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";
import * as ethers from "ethers";
```

### Step 2: Connect the Client

The next step is connecting the Crossbar Client. [Crossbar](../../../running-crossbar/) is a utility server that allows us to easily simulate feeds (thereby getting an estimated result), query oracles for prices, and a few other utility functions used to make using Switchboard easier. The Pyth Hermes server has a similar function of brokering data from pythnet.&#x20;

#### Pyth

```typescript
const connection = new PriceServiceConnection("https://hermes.pyth.network", {
  priceFeedRequestConfig: {
    binary: true,
  },
});
const priceIds = [
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", 
];
const encoded = await connection.getLatestVaas(priceIds);
```

#### Switchboard

```typescript
// for initial testing and development, you can use the rate-limited 
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

// Get the latest update data for the feed
const { encoded } = await crossbar.fetchEVMResults({
  aggregatorIds: ["0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71"],
  chainId: 1115, // Replace this with the chainId for the target EVM network 
});
```

### Step 3: Submitting the Updates

Submitting updates with Switchboard from here should be pretty similar to how you'd do them with Pyth. Here's an example of what that might look like:

#### Pyth and Switchboard

```typescript
// Target contract address
const exampleAddress = "0xc65f0acf9df6b4312d3f3ce42a778767b3e66b8a";

// The Human Readable contract ABI
const abi = ["function exampleMethod(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);

// Update feeds
await exampleContract.exampleMethod(encoded);
```

