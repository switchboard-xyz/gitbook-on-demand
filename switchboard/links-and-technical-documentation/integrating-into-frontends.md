---
description: Common approaches to integrating on-demand into client code.
---

# Integrating into Frontends

For most Pull Feed use-cases, frontend development with JavaScript/TypeScript will be the primary method for handling encode updates. Client code can package a feed-update instruction before an instruction that reads the feed, enforcing some constraints around staleness.&#x20;

## Installation

Getting started with Switchboard on-demand on frontends requires the use of the package [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand). Install it with the following npm (or bun, or even pnpm!):

```sh
npm add @switchboard-xyz/on-demand # alias for `i --save`
```

## Reading a Feed

Showing a feed's current value can be helpful for demonstrating an estimated execution price. Since oracle nodes are heavily rate limited, it's useful to simulate using a [Crossbar Server](../running-crossbar/).&#x20;

### What's a Crossbar Server?

Crossbar is a utility server for interacting with Switchboard which anyone can run, and everybody is encouraged to run their own instance. It can store and pull feeds from IPFS (using centralized providers or your own now), it can get encoded updates, and it can simulate feeds using a local instance of a [Task-Runner](../switchboard-feeds/how-feeds-are-resolved.md). \
\
Why run your instance? The public crossbar node is fairly rate-limited, and oracle nodes are heavily rate-limited. In the future, oracle providers may offer API keys you may be able to plug into crossbar for elevated rates. But for now, if you want to hammer a crossbar server with simulates, it's recommended that you [run your own instance](../running-crossbar/installation.md).&#x20;

### Streaming Simulations

```typescript
import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";

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

In the above code block we're printing the feed values every 10 seconds to the console. Let's break down how it's happening:

```typescript
import {
  CrossbarClient,
} from "@switchboard-xyz/on-demand";

const crossbar = new CrossbarClient("http://myCrossbarDeployment.com");
```

1. In this section we're importing `CrossbarClient`, instantiating an instance of it pointing to our own crossbar server instance at `http://myCrossbarDeployment.com.`&#x20;

```typescript
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

2. In this code block we're creating an asynchronous function to send a simulate request for passed-in feeds to crossbar and returning the simulation result after printing them each.&#x20;

```typescript
// Periodically do something with feed results
setInterval(async () => {

  // drop your solana pull-feed account key here
  const btcFeed = "6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83";
  const someOtherFeed = "B3ZwcSoNo75VNbABMd8bdjrEaLj87EMQ3TkDWnVrFkcX";
  const results = await printFeedResults([btcFeed, someOtherFeed]);
  // ...
  
}, 1000 * 10); // ten seconds (in milliseconds)
```

3. Here we're actually calling the simulate every 10 seconds with some different feeds. It's fairly straightforward, but this is the kind of logic that one might port into react code with the relevant hooks.&#x20;

## Updating Feeds on the Frontend

Getting feed updates is a simple process if you have the relevant keys and the @switchboard-xyz/on-demand package installed in your frontend code.&#x20;

#### Calling Switchboard to Update Feeds

```typescript
import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  PullFeed,
  loadLookupTables,
  SB_ON_DEMAND_PID
} from "@switchboard-xyz/on-demand";
```

1. Add import  from[ @coral-xyz/anchor](https://www.npmjs.com/package/@coral-xyz/anchor).

```typescript
// Load the Switchboard Anchor Program
const wallet = useAnchorWallet();
const { connection } = useConnection();
const provider = new AnchorProvider(connection, wallet, {});
const idl = (await Program.fetchIdl(programId, provider))!;
const switchboard = new Program(idl, provider);

// Replace with your feed pubkey
const feed = new PublicKey("6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83");
const feedAccount = new PullFeed(switchboard, feed);
```

2. Create the PullFeed account object. This is an off-chain wrapper class with utility functions for interacting with pull feeds. Here `useConnection` and `useAnchorWallet` would be coming from [Anza's Wallet Adapter](https://anza-xyz.github.io/wallet-adapter/modules/\_solana\_wallet\_adapter\_react.html), but any anchor provider would work.&#x20;

```typescript
// Get anchor program
const demo = await myAnchorProgram(program.provider, demoPath);

// Instruction to example program using the switchboard feed
const myIx = await demo.methods.test().accounts({ feed }).instruction();
```

3. Get the instruction that uses reads from a Switchboard feed (along with your anchor program).&#x20;

```typescript
// Get the update instruction for switchboard and lookup tables to make the instruction lighter
const [pullIx, responses, success] = await feedAccount.fetchUpdateIx({ numSignatures: 1, crossbarClient: crossbar });
```

4. Get the instruction for updating the desired feed account. This will only work if the feed has been stored and is available on IPFS with Crossbar (as we need to fetch the job definitions to resolve them).&#x20;

```typescript
const lookupTables = await loadLookupTables([...responses.map((x) => x.oracle), feedAccount]);
```

5. Get the lookup tables for this switchboard feed so that we the transaction can be a bit smaller. [Address lookup tables](https://solana.com/docs/advanced/lookup-tables) are a useful tool for limiting the size-impact of Solana instructions.

```typescript
// Set priority fee for that the tx
const priorityFeeIx = web3.ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 100_000,
});

// Get the current context 
const {
  context: { slot: minContextSlot },
  value: { blockhash, lastValidBlockHeight },
} = await connection.getLatestBlockhashAndContext();
```

6. These days users can hardly get a transaction through without setting some priority fee. It's useful to set some number > 100. Here we're setting it to 100,000 micro-lamports because we're very determined to get an update through.&#x20;

<pre class="language-typescript"><code class="lang-typescript"><strong>// Get Transaction Message 
</strong>const message = new web3.TransactionMessage({
  payerKey: publicKey,
  recentBlockhash: blockhash,
  instructions: [addPriorityFee, pullIx, myIx],
}).compileMessageV0(lookupTables);
  
// Get Versioned Transaction
const vtx = new web3.VersionedTransaction(message);
const signed = await wallet.signTransaction(vtx);

// Send the transaction via rpc 
const signature = await connection.sendRawTransaction(signed.serialize(), {
  maxRetries: 0,
  skipPreflight: true,
});
  
// Wait for confirmation
await connection.confirm({
  signature,
  blockhash,
  lastValidBlockHeight,
});
</code></pre>

7. Here we're simulating and requesting a signature for the transaction using the wallet libraries, which conform to the same API that `web3.js` does.&#x20;

#### Putting it all together

```typescript
import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  PullFeed,
  loadLookupTables,
  SB_ON_DEMAND_PID
} from "@switchboard-xyz/on-demand";
import { fetchMyAnchorProgram, crossbar } from "../"

// ...

// <component>
   
// Load the Switchboard Anchor Program
const wallet = useAnchorWallet();
const { connection } = useConnection();
const provider = new AnchorProvider(connection, wallet, {});
const idl = (await Program.fetchIdl(programId, provider))!;
const switchboard = new Program(idl, provider);

// Replace with your feed pubkey
const feed = new PublicKey("6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83");
const feedAccount = new PullFeed(switchboard, feed);

// If using a wallet adapter of some sort
const { connection } = useConnection();
const { publicKey, sendTransaction } = useWallet();

// Write update to program
const updateFeedAndCallProgram = async () => {

  // Get my custom anchor program
  const demo = await fetchMyAnchorProgram();

  // Instruction to example program using the switchboard feed
  const myIx = await demo.methods.test().accounts({ feed }).instruction();

  // Get the update instruction for switchboard and lookup tables to make the instruction lighter
  const [pullIx, responses, success] = await feedAccount.fetchUpdateIx({ numSignatures: 1, crossbarClient: crossbar });
  const lookupTables = await loadLookupTables([...responses.map((x) => x.oracle), feedAccount]);

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
    instructions: [addPriorityFee, pullIx, myIx],
  }).compileMessageV0(lookupTables);
  
  // Get Versioned Transaction
  const vtx = new web3.VersionedTransaction(message);
  const signed = await wallet.signTransaction(vtx);

  // Send the transaction via rpc 
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    maxRetries: 0,
    skipPreflight: true,
  });
  
  // Wait for confirmation
  await connection.confirm({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
}

// </component>

// ...
```

Perhaps the best approach to using Switchboard on the frontend is to simulate on a private crossbar server extremely frequently and use the above to pull a signature from oracles when it comes time to make a trade or create some transaction.

