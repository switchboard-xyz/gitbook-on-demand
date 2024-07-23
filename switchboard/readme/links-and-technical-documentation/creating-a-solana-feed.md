---
description: Initializing and configuring a feed on Solana
---

# Creating a Solana Feed

## Feed Configuration

If you're using the builder, you'll be confronted with a few inputs configured to some defaults, and an empty name field.&#x20;

The required fields are:

* **Name**: The identifier for the feed in the Switchboard UI. &#x20;
* **Authority**: The address with authority to modify this feed. Feeds are always initialized with the creator as authority, but they can later be set to something other than the creator. This feature can be useful for DAO controlled feeds.&#x20;
* **Max Variance**: The maximum allowed variance of the job results (as a percentage) for an update to be accepted on-chain.
* **Min Responses**: The minimum number of successful job responses required for an update to be accepted on-chain.
* **Sample Size**: The number of samples that will be considered when reading a feed.&#x20;
* **Max Staleness**: The maximum staleness a sample is allowed when reading a feed on-chain.&#x20;

## Configuring Feeds in the Builder

Setting these configs in the builder is as simple as filling in the inputs and clicking "Create Account" to make the feed:

<figure><img src="../../../.gitbook/assets/image (8).png" alt=""><figcaption><p>Configuring a feed via UI</p></figcaption></figure>

### Switchboard Feed Page

Once you create the feed, you'll be taken to a page where you can see the current value for the feed (waiting to be populated on-chain).&#x20;

Since this is an On-Demand feed, updates will be read in only when they're needed (alternatively with a pusher service).&#x20;

<figure><img src="../../../.gitbook/assets/image (16).png" alt=""><figcaption><p>Pull Feed Page</p></figcaption></figure>

Another important component is Switchboard's instance of Crossbar, a convenience server for using on-demand updates.&#x20;

## Creating a Feed in Typescript

This section will build on [Designing a Feed](designing-a-feed-svm.md#designing-a-feed-in-typescript). Before continuing, ensure you have a funded Solana Keypair file. The easiest way to create a new solana-keypair is using the [solana-keygen cli tool](https://docs.solanalabs.com/cli/wallets/file-system#generate-a-file-system-wallet-keypair).&#x20;

In this case you can create a local wallet with:

```
solana-keygen new --outfile path/to/solana-keypair.json
```

If you don't feel like dealing with this tool, remember that the solana keypair file is just the representation of the private key in the format of an array of numbers:

```json
[66,46,178,32,49, ...]
```

1. Add the dependencies for [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand) into the file:

```typescript
import {
  AnchorUtils,
  PullFeed,
  CrossbarClient,
  OracleJob,
  getDefaultQueue,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";
```

2. Get an instance of the Switchboard queue (after the simulation success). By default, Bun enables top-level async-await which is useful in this instance. \
   \
   **Note:** Queues in the context of Switchboard are subnets of Oracles that respond to feed updates.\
   \
   Call `getDefaultQueue(solanaRPCUrl: string)`  to pull the Switchboard Mainnet Queue. Calling `getDefaultDevnetQueue(solanaRPCUrl: string)` will pull the Switchboard Devnet queue.&#x20;

```typescript
// Get the queue for the network you're deploying on
let queue = await getDefaultQueue(); // or `getDefaultDevnetQueue()` for devnet,
```

3. For ease of use, and displaying your Jobs on the [Explorer](https://ondemand.switchboard.xyz/solana/mainnet), you should store your feeds with CrossBar. This is a service that will store valid Job definitions on [IPFS](https://ipfs.io).&#x20;

```typescript
// Get the default crossbar server client
const crossbarClient = CrossbarClient.default();

// Upload jobs to Crossbar, which pins valid feeds on ipfs
// Feeds are associated with a specific queue, which is why we need to pass it in
const { feedHash } = await crossbarClient.store(queue.pubkey.toBase58(), jobs);
```

4. Load your Solana payer's keypair from your keypair file.  Log the payer just to be certain that it's the right account. It must be funded on the target Solana network for pull feed creation to work.&#x20;

```typescript
// Get the payer keypair
const payer = await AnchorUtils.initKeypairFromFile(
  "path/to/solana-keypair.json"
);
console.log("Using Payer:", payer.publicKey.toBase58(), "\n");
```

5. Generate a new pull feed object, this is just generating a new keypair associated with the PullFeedAccountData, and creating a wrapper object:

```typescript
const [pullFeed, feedKeypair] = PullFeed.generate(queue.program);
```

6. Create the feed initialization instruction:

```typescript
// Get the initialization for the pull feeds
const ix = await pullFeed.initIx({
  name: "BTC Price Feed", // the feed name (max 32 bytes)
  queue: queue.pubkey, // the queue of oracles to bind to
  maxVariance: 1.0, // the maximum variance allowed for the feed results
  minResponses: 1, // minimum number of responses of jobs to allow
  feedHash: Buffer.from(feedHash.slice(2), "hex"), // the feed hash
  minSampleSize: 1; // The minimum number of samples required for setting feed value
  maxStaleness: 60; // The maximum number of slots that can pass before a feed value is considered stale.
  payer: payer.publicKey, // the payer of the feed
});
```

7. Create the transaction and configure it so it can be sent to a Solana validator. This example uses the `asV0Tx`, a convenience function that's not necessary (but can be useful) for building transactions with priority fees.&#x20;

```typescript
// Generate VersionedTransaction
const tx = await asV0Tx({
  connection: queue.program.provider.connection,
  ixs: [ix],
  payer: payer.publicKey,
  signers: [payer, feedKeypair],
  computeUnitPrice: 75_000,
  computeUnitLimitMultiple: 1.3,
});

// Simulate the transaction
const simulateResult = await queue.program.provider.connection.simulateTransaction(tx, {
  commitment: "processed",
});
console.log(simulateResult);

// Send transaction to validator
const sig = await queue.program.provider.connection.sendTransaction(tx, {
  preflightCommitment: "processed",
  skipPreflight: true,
});

// Finished!
console.log(`Feed ${feedKeypair.publicKey} initialized: ${sig}`);
```

## Final Result

The assembled contract should go through the steps we've built:

1. Configure the OracleJobs and Simulate
2. Pick the queue for the target network (Mainnet or Devnet)
3. Store with Crossbar so it's visible in the explorer
4. Build the PullFeed's `initIx` instruction
5. Build and send the transaction on Solana

#### index.ts

```typescript
import {
  AnchorUtils,
  PullFeed,
  CrossbarClient,
  OracleJob,
  getDefaultQueue,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";

const jobs: OracleJob[] = [
  new OracleJob({
    tasks: [
      {
        httpTask: {
          url: "https://binance.com/api/v3/ticker/price",
        },
      },
      {
        jsonParseTask: {
          path: "$[?(@.symbol == 'BTCUSDT')].price",
        },
      },
    ],
  }),
];

console.log("Running simulation...\n");

// Print the jobs that are being run.
const jobJson = JSON.stringify({ jobs: jobs.map((job) => job.toJSON()) });
console.log(jobJson);
console.log();

// Serialize the jobs to base64 strings.
const serializedJobs = jobs.map((oracleJob) => {
  const encoded = OracleJob.encodeDelimited(oracleJob).finish();
  const base64 = Buffer.from(encoded).toString("base64");
  return base64;
});

// Call the simulation server.
const response = await fetch("https://api.switchboard.xyz/api/simulate", {
  method: "POST",
  headers: [["Content-Type", "application/json"]],
  body: JSON.stringify({ cluster: "Mainnet", jobs: serializedJobs }),
});

// Check response.
if (response.ok) {
  const data = await response.json();
  console.log(`Response is good (${response.status})`);
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log(`Response is bad (${response.status})`);
  throw await response.text();
}

console.log("Storing and creating the feed...\n");

// Get the queue for the network you're deploying on
let queue = await getDefaultQueue(); // or `getDefaultDevnetQueue()` for devnet,

// Get the crossbar server client
const crossbarClient = CrossbarClient.default();

// Get the payer keypair
const payer = await AnchorUtils.initKeypairFromFile(
  "path/to/solana-keypair.json"
);
console.log("Using Payer:", payer.publicKey.toBase58(), "\n");

// Upload jobs to Crossbar, which pins valid feeds on ipfs
const { feedHash } = await crossbarClient.store(queue.pubkey.toBase58(), jobs);
const [pullFeed, feedKeypair] = PullFeed.generate(queue.program);
const ix = await pullFeed.initIx({
  name: "BTC Price Feed", // the feed name (max 32 bytes)
  queue: queue.pubkey, // the queue of oracles to bind to
  maxVariance: 1.0, // the maximum variance allowed for the feed results
  minResponses: 1, // minimum number of responses of jobs to allow
  feedHash: Buffer.from(feedHash.slice(2), "hex"), // the feed hash
  minSampleSize: 1; // The minimum number of samples required for setting feed value
  maxStaleness: 300; // The maximum number of slots that can pass before a feed value is considered stale.
  payer: payer.publicKey, // the payer of the feed
});

const tx = await asV0Tx({
  connection: queue.program.provider.connection,
  ixs: [ix],
  payer: payer.publicKey,
  signers: [payer, feedKeypair],
  computeUnitPrice: 200_000,
  computeUnitLimitMultiple: 1.5,
});

// simulate the transaction
const simulateResult =
  await queue.program.provider.connection.simulateTransaction(tx, {
    commitment: "processed",
  });
console.log(simulateResult);

const sig = await queue.program.provider.connection.sendTransaction(tx, {
  preflightCommitment: "processed",
  skipPreflight: false,
});

console.log(`Feed ${feedKeypair.publicKey} initialized: ${sig}`);

```

### Example output:

If it's successful, you should see a successful simulation in the console. Just to verify that the account was initialized correctly, search for the printed key or signature on a Solana Explorer.

```bash
Running simulation...

{"jobs":[{"tasks":[{"httpTask":{"url":"https://binance.com/api/v3/ticker/price?symbol=BTCUSDT"}},{"jsonParseTask":{"path":"$.price"}}]}]}

Response is good (200)
{
  "results": [
    "64312.01000000"
  ],
  "version": "RC_06_19_24_03_17"
}
Storing and creating the feed...

Using Payer: 7Z45XiowadbbMtGZhKnPmGVhQqB7dGVkqmRLYCbrpbkq 

{
  context: {
    apiVersion: "1.18.15",
    slot: 273383899,
  },
  value: {
    accounts: null,
    err: null,
    innerInstructions: null,
    logs: [
      "Program ComputeBudget111111111111111111111111111111 invoke [1]", "Program ComputeBudget111111111111111111111111111111 success",
      "Program ComputeBudget111111111111111111111111111111 invoke [1]", "Program ComputeBudget111111111111111111111111111111 success",
      "Program SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv invoke [1]", "Program log: Instruction: PullFeedInit",
      "Program 11111111111111111111111111111111 invoke [2]", "Program 11111111111111111111111111111111 success",
      "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]", "Program log: Create",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]", "Program log: Instruction: GetAccountDataSize",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 89176 compute units",
      "Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
      "Program 11111111111111111111111111111111 invoke [3]", "Program 11111111111111111111111111111111 success",
      "Program log: Initialize the associated token account", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
      "Program log: Instruction: InitializeImmutableOwner", "Program log: Please upgrade to SPL Token 2022 for immutable owner support",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 82589 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
      "Program log: Instruction: InitializeAccount3", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 78705 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success", "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 22408 of 97651 compute units",
      "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
      "Program log: Instruction: SetAuthority", "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2795 of 65359 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success", "Program AddressLookupTab1e1111111111111111111111111 invoke [2]",
      "Program 11111111111111111111111111111111 invoke [3]", "Program 11111111111111111111111111111111 success",
      "Program 11111111111111111111111111111111 invoke [3]", "Program 11111111111111111111111111111111 success",
      "Program 11111111111111111111111111111111 invoke [3]", "Program 11111111111111111111111111111111 success",
      "Program AddressLookupTab1e1111111111111111111111111 success", "Program AddressLookupTab1e1111111111111111111111111 invoke [2]",
      "Program 11111111111111111111111111111111 invoke [3]", "Program 11111111111111111111111111111111 success",
      "Program AddressLookupTab1e1111111111111111111111111 success", "Program SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv consumed 82880 of 124470 compute units",
      "Program SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv success"
    ],
    returnData: null,
    unitsConsumed: 83180,
  },
}
Feed B3ZwcSoNo75VNbABMd8bdjrEaLj87EMQ3TkDWnVrFkcX initialized: 4FEmSq146aV1oyuvnxauUAMwpmAx85peruFEfBeWy3E6hLFsHBCSHy9vp6RHnH3tyKzzeQT9dVKPQjNEEbsc6YZz
```

Once your feed has been successfully created, save your feed's public key and move onto the next section.&#x20;
