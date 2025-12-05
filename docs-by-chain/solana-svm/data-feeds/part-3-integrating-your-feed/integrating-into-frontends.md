# Integrating into Frontends

This section outlines common methods for integrating Switchboard feeds into your client-side code.

For most feed use-cases, developing your frontend with JavaScript/TypeScript serves as the common approach for handling encoded updates. Client code can package a feed-update instruction _before_ an instruction that reads the feed, enforcing constraints around staleness of the oracle report within that transaction.

#### Installation

To begin working with Switchboard On-Demand on your frontend, you'll need the [`@switchboard-xyz/on-demand`](https://www.npmjs.com/package/@switchboard-xyz/on-demand) package. Install it, as well as the [`@switchboard-xyz/common`](https://www.npmjs.com/package/@switchboard-xyz/common) dependency, using npm (or bun, yarn, or pnpm):

```bash
npm add @switchboard-xyz/on-demand
npm add @switchboard-xyz/common
```

#### Reading a Feed

Displaying a feed's current value can be helpful in providing an estimated execution price. Because oracle nodes are heavily rate-limited, simulating using a [Crossbar server](../../../../tooling-and-resources/crossbar/) is incredibly useful during the stages of development.

#### What's a Crossbar Server?

A Crossbar server is a utility server that interacts with Switchboard. Anyone can run their own instance, and everyone is encouraged to do so! Key features include:

* Storing and pulling feeds from IPFS (using centralised providers or your own instance).
* Getting encoded updates.
* Simulating feeds using a local instance of a Task-Runner.

**Why run your own instance?** The public Crossbar node is heavily rate-limited, as are the oracle nodes. In the future, oracle providers may offer API keys that you can plug into Crossbar for elevated rates. But for the moment, if you want to hammer a Crossbar server with simulations, it's recommended that you [run your own instance](../../../../tooling-and-resources/crossbar/run-crossbar-with-docker-compose.md).

#### Streaming Simulations

```tsx
import {CrossbarClient} from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");

/**
 * Print out the results of a feed simulation to the console and return them
 * @param feeds - the feed public keys encoded as base58 strings
 * @returns results - the output of each job in each feed
 */
async function printFeedResults(
  feeds: string[]
): Promise<{feed: string; results: number[]; feedHash: string}[]> {
  const results = await crossbar.simulateSolanaFeeds(
    "mainnet", // network "mainnet" | "devnet"
    feeds // feed pubkeys as base58
  );

  for (let simulation of results) {
    console.log(`Feed Public Key ${simulation.feed} job outputs: ${simulation.results}`);
  }

  return results;
}

// Periodically do something with feed results
setInterval(async () => {

  // drop your solana pull-feed account key here
  const btcFeed = "6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83";
  const someOtherFeed = "B3ZwcSoNo75VNbABMd8bdjrEaLj87EMQ3TkDWnVrFkcX";
  const results = await printFeedResults([btcFeed, someOtherFeed]);

  // do something with results
  console.log(results.length, "results found");
}, 10_000);

```

In the above code block, we're printing feed values to the console every 10 seconds. Here's a breakdown:

```tsx
import {CrossbarClient} from "@switchboard-xyz/common";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");
```

This section imports `CrossbarClient` and instantiates an instance of it, pointing to a Crossbar server instance at `http://myCrossbarDeployment.com`. You will likely need to replace this address with your own.

```tsx
/**
 * Print out the results of a feed simulation to the console and return them
 * @param feeds - the feed public keys encoded as base58 strings
 * @returns results - the output of each job in each feed
 */
async function printFeedResults(
  feeds: string[]
): Promise<{feed: string; results: number[]; feedHash: string}[]> {
  const results = await crossbar.simulateSolanaFeeds(
    "mainnet", // network "mainnet" | "devnet"
    feeds // feed pubkeys as base58
  );

  for (let simulation of results) {
    console.log(`Feed Public Key ${simulation.feed} job outputs: ${simulation.results}`);
  }

  return results;
}
```

This code block defines an asynchronous function to send a simulate request for passed-in feeds to Crossbar, returning the simulation result after printing each of them.

```tsx
// Periodically do something with feed results
setInterval(async () => {

  // drop your solana pull-feed account key here
  const btcFeed = "6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83";
  const someOtherFeed = "B3ZwcSoNo75VNbABMd8bdjrEaLj87EMQ3TkDWnVrFkcX";
  const results = await printFeedResults([btcFeed, someOtherFeed]);
  // ...

}, 1000 * 10); // ten seconds (in milliseconds)
```

Here, the simulation is called every 10 seconds with some different feeds. This logic can be adapted into React code with the relevant hooks.

#### Updating Feeds on the Frontend

Updating feeds is a straightforward process, assuming that you have the relevant keys and the `@switchboard-xyz/on-demand` package installed in your frontend code.

#### Calling Switchboard to Update Feeds

```tsx
import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import { PullFeed, ON_DEMAND_DEVNET_PID } from "@switchboard-xyz/on-demand";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

// Load the Switchboard Anchor Program
const wallet = useAnchorWallet();
const { connection } = useConnection();
const provider = new AnchorProvider(connection, wallet!);
const sbProgram = await Program.at(ON_DEMAND_DEVNET_PID, provider);

// Replace with your feed pubkey
const feed = new web3.PublicKey("6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83");
const feedAccount = new PullFeed(sbProgram, feed);
```

Create the `PullFeed` account object. This is an off-chain wrapper class that contains many utility functions useful for working with pull feeds. Here `useConnection` and `useAnchorWallet` is coming from Anza's Wallet Adapter, but any Anchor provider would work.

```tsx
// Get Anchor Program
const demo = await myAnchorProgram(program.provider, demoPath);

// Instruction to example program using the switchboard feed
const myIx = await demo.methods.test().accounts({ feed }).instruction();
```

Get the instruction that uses reads from a Switchboard feed (along with your Anchor program). In this example it's loaded from a file called `program.provider`.

```tsx
// Get the update instruction for switchboard and lookup tables to make the instruction lighter
const { pullIx, responses, numSuccess, luts } = await feedAccount.fetchUpdateIx({
  crossbarClient: crossbar,
  chain: 'solana',
  network: 'devnet',
});
```

Get the instruction for updating the desired feed account. _This will only work if the feed has been stored and is available on IPFS with Crossbar (as the job definitions need to be fetched to resolve them)._

#### Putting it all together

```tsx
import { fetchMyAnchorProgram, crossbar } from "../";

import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import { PullFeed, ON_DEMAND_DEVNET_PID } from "@switchboard-xyz/on-demand";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

// Load the Switchboard Anchor Program
const wallet = useAnchorWallet();
const { connection } = useConnection();
const provider = new AnchorProvider(connection, wallet!);
const sbProgram = await Program.at(ON_DEMAND_DEVNET_PID, provider);

// Replace with your feed pubkey
const feed = new web3.PublicKey("6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83");
const feedAccount = new PullFeed(sbProgram, feed);

// If using a wallet adapter of some sort
const { publicKey, sendTransaction } = useWallet();

// Write update to program
const updateFeedAndCallProgram = async () => {
  // Get my custom anchor program
  const demo = await fetchMyAnchorProgram();
  // Instruction to example program using the switchboard feed
  const myIx = await demo.methods
    .test()
    .accounts({feed})
    .instruction();

  // Get the update instruction for switchboard and lookup tables to make the instruction lighter
  const [pullIx, responses, success, luts] = await feedAccount.fetchUpdateIx({
    crossbarClient: crossbar,
  });

  // Set priority fee for that the tx
  const priorityFeeIx = web3.ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 100_000,
  });

  // Get the latest context
  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext();

  // Get Transaction Message
  const message = new web3.TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions: [priorityFeeIx, pullIx, myIx],
  }).compileToV0Message(luts);

  // Get Versioned Transaction
  const vtx = new web3.VersionedTransaction(message);
  const signed = await wallet.signTransaction(vtx);

  // Send the transaction via rpc
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    maxRetries: 0,
    skipPreflight: true,
  });

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
};

// ...

```

Perhaps the ideal way to use Switchboard on the frontend, is to simulate on a private Crossbar server as often as is needed to propagate the correct and accurate data. Then pull a signature from oracles _only_ when the time comes to commit a trade, or create a transaction of any kind. This is the best balance of performance, cost-effectiveness, and security.
