# Integrating into Frontends (EVM)

For most Pull Feed use-cases, frontend development with JavaScript/TypeScript will be the primary method for handling encode updates. Client code can package a feed-update instruction before an instruction that reads the feed, enforcing some constraints around staleness.

### Installation

Getting started with Switchboard on-demand on frontends requires the use of the package [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand). Install it with the following npm (or bun, or even pnpm!):

```bash
npm add @switchboard-xyz/on-demand @switchboard-xyz/common
```

### Reading a Feed

Showing a feed's current value can be helpful for demonstrating an estimated execution price. Since oracle nodes are heavily rate limited, it's useful to simulate using a [Crossbar Server](https://docs.switchboard.xyz/docs/switchboard/crossbar-and-task-runner).

#### What's a Crossbar Server?

Crossbar is a utility server for interacting with Switchboard which anyone can run, and everybody is encouraged to run their own instance. It can store and pull feeds from IPFS (using centralized providers or your own now), it can get encoded updates, and it can simulate feeds using a local instance of a [Task-Runner](https://docs.switchboard.xyz/docs/switchboard/readme/designing-feeds/how-feeds-are-resolved).

Why run your instance? The public crossbar node is fairly rate-limited, and oracle nodes are heavily rate-limited. In the future, oracle providers may offer API keys you may be able to plug into crossbar for elevated rates. But for now, if you want to hammer a crossbar server with simulates, it's recommended that you [run your own instance](https://docs.switchboard.xyz/docs/switchboard/crossbar-and-task-runner/run-crossbar-with-docker-compose).

#### Streaming Simulations

```tsx
import { CrossbarClient } from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");

/**
 * Print out the results of a feed simulation to the console and return them
 * @param feeds - the feed aggregator Ids encoded as hex strings
 * @returns results - the output of each job in each feed
 */
async function printFeedResults(
  feeds: string[]
): Promise<{feed: string; results: number[]; feedHash: string}[]> {
  const results = await crossbar.simulateEVMFeeds(
    1115, // chainId (Core Testnet is 1115)
    feeds // feed aggregatorIds 
  );
  
  for (let simulation of results) {
    console.log(`Feed Id ${simulation.feed} job outputs: ${simulation.results}`);
  }
  return results;
}

// Periodically do something with feed results
setInterval(async () => {

  // drop your evm aggregatorIds here
  const btcFeed = "0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71";
  const results = await printFeedResults([btcFeed]);
  
  // do something with results
  console.log(results.length, "results found");
}, 10_000);
```

In the above code block we're printing the feed values every 10 seconds to the console. Let's break down how it's happening:

```tsx
import { CrossbarClient } from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");
```

1. In this section we're importing `CrossbarClient`, instantiating an instance of it pointing to our own crossbar server instance at `http://myCrossbarDeployment.com.`

```tsx
/**
 * Print out the results of a feed simulation to the console and return them
 * @param feeds - the feeds' aggregatorIds
 * @returns results - the output of each job in each feed
 */
async function printFeedResults(
  feeds: string[]
): Promise<{feed: string; results: number[]; feedHash: string}[]> {
  const results = await crossbar.simulateEvmFeeds(
    1115, // chainId 
    feeds // aggregatorId (hex string 0x...)
  );
  
  for (let simulation of results) {
    console.log(`Feed Id ${simulation.feed} job outputs: ${simulation.results}`);
  }
  
  return results;
}
```

1. In this code block we're creating an asynchronous function to send a simulate request for passed-in feeds to crossbar and returning the simulation result after printing them each.

```tsx
// Periodically do something with feed results
setInterval(async () => {

  // drop your evm aggregatorIds here
  const btcFeed = "0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71";
  const someOtherFeed = "0xe2ba292a366ff6138ea8b66b12e49e74243816ad4edd333884acedcd0e0c2e9d";
  const results = await printFeedResults([btcFeed, someOtherFeed]);
  // ...
  
}, 1000 * 10); // ten seconds (in milliseconds)
```

1. Here we're actually calling the simulate every 10 seconds with some different feeds. It's fairly straightforward, but this is the kind of logic that one might port into react code with the relevant hooks.

### Updating Feeds

When you're ready to call a price update, you can fetch updates through the sdk.

```tsx
import { CrossbarClient } from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");

/**
 * Fetch the fresh encoded update to submit as part of your transaction
 * @param chainId - The EVM chain id, ex: 1115 (core testnet)
 * @param aggregatorIds - A list of each aggregator's id you want to update in this tx
 */
async function fetchEVMResult(chainId: number, aggregatorIds: string[]): Promise<string[]> {
  const results = await crossbar.fetchEVMResults({ chainId, aggregatorIds });
  return results.encoded;
}

async function callSomeEVMFunction(contractInstance: ethers.Contract) {
  const results: string[] = await fetchEVMResult(1115, "0x0eae481a0c635fdfa18ccdccc0f62dfc34b6ef2951f239d4de4acfab0bcdca71");

  // call the evm function to update data, alongside whatever business logic uses the data
  // function updateBusinessLogic(bytes[] calldata encoded) public payable;
  const tx = await contractInstance.updateBusinessLogic(results);
  console.log(tx);
}
```
