# Integrating your Feed with Typescript

After the feed has been initialized from the last step of [Integrating your Feed On-Chain](https://www.notion.so/Docs-1808fb22cfab80f5b05dd7507d05b391?pvs=21), we can now request price signatures from oracles!

So now that we have the contract ready to read and use Switchboard update data, we need a way to fetch these encoded values. Using Crossbar, we can get an encoded feed update with just a fetch. For simplicity, we'll demonstrate a fetch using both.

We'll be working from the Typescript portion of [Designing a Feed (EVM)](https://crossbar.switchboard.xyz):

#### Adding Imports

`bun add ethers`

#### index.ts

```jsx
import { CrossbarClient } from "@switchboard-xyz/common";
import * as ethers from "ethers";
```

1. We'll be using [ethers](https://github.com/ethers-io/ethers.js) to write updates to the example contract. Add it to the project and import the Switchboard EVM call.

#### Setting up the call

```jsx
// for initial testing and development, you can use the rate-limited 
// <https://crossbar.switchboard.xyz> instance of crossbar
const crossbar = CrossbarClient.default();

// Get the latest update data for the feed
const { encoded } = await crossbar.fetchEVMResults({
  aggregatorIds: ["0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71"],
  chainId: 1115, // 1115 here is the chainId for Core Testnet
});
```

1. Here we're getting the results for the `aggregatorId` from Switchboard using the default crossbar deployment.

#### Creating contract bindings

```jsx
// Target contract address
const exampleAddress = process.env.CONTRACT_ADDRESS as string;

// (this is the readable ABI format)
const abi = ["function getFeedData(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);
```

1. Pass the encoded updates `bytes[] calldata` into the getFeedData call. This will send the transaction over the wire.
2. In order to submit transactions on the target chain, you need to plug in the right RPC and private key. The `signerWithProvider` will be what we pass into the contract.

#### Getting the provider

```jsx
// Pull the private key from the environment 0x..
const pk = process.env.PRIVATE_KEY;
if (!pk) {
  throw new Error("Missing PRIVATE_KEY environment variable.");
}

// Provider 
const provider = new ethers.JsonRpcProvider(
  "https://ethereum.rpc.example"
);
const signerWithProvider = new ethers.Wallet(pk, provider);
```

1. Add the example contract binding with the `getFeedData` call in the ABI.

#### Adding the call

```jsx
// Update feeds
await exampleContract.getFeedData(encoded);
```

#### Putting it together

Here we're connecting all of these components. We're compiling all of calls into a system where we can pull the encoded updates, and calling the contract.\


```typescript
import { CrossbarClient } from "@switchboard-xyz/common";
import * as ethers from "ethers";

// ... simulation logic ...

// Create a Switchboard On-Demand job
const chainId = 1115; // Core Devnet (as an example)

// for initial testing and development, you can use the rate-limited
// https://crossbar.switchboard.xyz instance of crossbar
const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

// Get the latest update data for the feed
const { encoded } = await crossbar.fetchEVMResults({
  aggregatorIds: ["0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71"],
  chainId, // 1115 here is the chainId for Core Testnet
});

// Target contract address
const exampleAddress = "0xc65f0acf9df6b4312d3f3ce42a778767b3e66b8a";

// The Human Readable contract ABI
const abi = ["function getFeedData(bytes[] calldata updates) public payable"];

// ... Setup ethers provider ...

// The Contract object
const exampleContract = new ethers.Contract(exampleAddress, abi, provider);

// Update feeds
await exampleContract.getFeedData(encoded);
```
