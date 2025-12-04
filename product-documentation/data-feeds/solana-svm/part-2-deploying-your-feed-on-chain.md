# Part 2: Deploying your Feed On-Chain

## **Deploying Your Feed On-Chain using Typescript**

This section provides the steps necessary to take your simulated feed definition and deploy it live to Solana/SVM, building on the design steps completed previously.

**Prerequisites:**

* Successful completion of Section 1 (Designing and Simulating Your Feed).
*   A funded Solana Keypair file. Use the Solana CLI tool: Alternatively, you should note that each solana keypair file is essentially the representation of a private key in the format of an array with numbers like this: `[66,46,178,32,49, ...]`

    ```
    solana-keygen new --outfile path/to/solana-keypair.json
    ```

**Steps**

1.  **Import Dependencies:** Add the necessary `@switchboard-xyz/on-demand` dependencies to your `index.ts` file, which allow for Solana commands. Make sure you replace the `index.ts` which you'll want to deploy:

    ```typescript
    import {
      AnchorUtils,
      PullFeed,
      getDefaultQueue,
      getDefaultDevnetQueue,
      asV0Tx,
    } from "@switchboard-xyz/on-demand";
    import { CrossbarClient, OracleJob } from "@switchboard-xyz/common";
    ```
2.  **Get the Queue:** Obtain an instance of the Switchboard queue. This is typically done after a successful simulation step. **Remember**, queues in the context of Switchboard are subnets of Oracles that respond to feed updates.

    Call `getDefaultQueue(solanaRPCUrl: string)` to pull the Switchboard Mainnet Queue. Calling `getDefaultDevnetQueue(solanaRPCUrl: string)` will pull the Switchboard Devnet queue.

    ```typescript
    // Get the queue for the network you're deploying on
    let queue = await getDefaultQueue(connection.rpcUrl);
    ```
3.  **\[Optional] Store with Crossbar:** For ease of use, and displaying your Jobs on the [Explorer](https://ondemand.switchboard.xyz/solana/mainnet), you should store your feeds with CrossBar. This is a service that will store valid Job definitions on [IPFS](https://ipfs.io/).

    ```typescript
    // Get the default crossbar server client
    const crossbarClient = CrossbarClient.default();

    // Upload jobs to Crossbar, which pins valid feeds on ipfs
    // Feeds are associated with a specific queue, which is why we need to pass it in
    const { feedHash } = await crossbarClient.store(queue.pubkey.toBase58(), jobs);
    ```
4.  **Load the Payer Keypair:** Retrieve your Solana payer's loaded account. Ensure that it’s funded for pull feed creation to work.

    ```typescript
    // Get the payer keypair
    const payer = await AnchorUtils.initKeypairFromFile(
      "path/to/solana-keypair.json"
    );
    console.log("Using Payer:", payer.publicKey.toBase58(), "\n");
    ```
5.  **Generate a new pull feed object:** This is just generating a new keypair associated with the PullFeedAccountData, and creating a wrapper object

    ```typescript
    const [pullFeed, feedKeypair] = PullFeed.generate(queue.program);
    ```
6.  **Initialise the feed:** Now, create the feed with all the required specs. Be mindful of parameters such as maximum variance and other values which determine the data feed.

    ```typescript
    // Get the initialization for the pull feeds
    const ix = await pullFeed.initIx({
      name: "BTC Price Feed", // the feed name (max 32 bytes)
      queue: queue.pubkey, // the queue of oracles to bind to
      maxVariance: 1.0, // the maximum variance allowed for the feed results
      minResponses: 1, // minimum number of responses of jobs to allow
      feedHash: Buffer.from(feedHash.slice(2), "hex"), // the feed hash
      minSampleSize: 1, // The minimum number of samples required for setting feed value
      maxStaleness: 60, // The maximum number of slots that can pass before a feed value is considered stale.
      payer: payer.publicKey, // the payer of the feed
    });
    ```
7.  **Create the Transaction and Simulation Check**: Create the transaction and configure it so it can be sent to a Solana Validator. This example uses the `asV0Tx`, a convenience function that's not necessary (but can be useful) for building transactions with priority fees.

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

Congratulations, you have now created and fully deployed a feed using typescript on chain.

**NOTE:** If you need some help make sure to look at our update examples repo[ here](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sb-on-demand-feeds).

### Final Result

The assembled contract should go through the steps we've built:

1. Configure the OracleJobs and Simulate
2. Pick the queue for the target network (Mainnet or Devnet)
3. Store with Crossbar so it's visible in the explorer
4. Build the PullFeed's `initIx` instruction
5. Build and send the transaction on Solana

#### index.ts

```typescript
import { 
  CrossbarClient,
  OracleJob
} from "@switchboard-xyz/common";
import {
  AnchorUtils,
  PullFeed,
  getDefaultQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";

const jobs: OracleJob[] = [
  OracleJob.create({
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
const response = await fetch("https://crossbar.switchboard.xyz/api/simulate", {
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
let queue = await getDefaultQueue(solanaRpcUrl);

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
const initIx = await pullFeed.initIx({
  name: "BTC Price Feed", // the feed name (max 32 bytes)
  queue: queue.pubkey, // the queue of oracles to bind to
  maxVariance: 1.0, // the maximum variance allowed for the feed results
  minResponses: 1, // minimum number of responses of jobs to allow
  feedHash: Buffer.from(feedHash.slice(2), "hex"), // the feed hash
  minSampleSize: 1, // The minimum number of samples required for setting feed value
  maxStaleness: 300, // The maximum number of slots that can pass before a feed value is considered stale.
  payer: payer.publicKey, // the payer of the feed
});

const initTx = await asV0Tx({
  connection: queue.program.provider.connection,
  ixs: [initIx],
  payer: payer.publicKey,
  signers: [payer, feedKeypair],
  computeUnitPrice: 200_000,
  computeUnitLimitMultiple: 1.5,
});

// simulate the transaction
const simulateResult =
  await queue.program.provider.connection.simulateTransaction(initTx, {
    commitment: "processed",
  });
console.log(simulateResult);

const initSig = await queue.program.provider.connection.sendTransaction(
  initTx,
  {
    preflightCommitment: "processed",
    skipPreflight: false,
  }
);

console.log(`Feed ${feedKeypair.publicKey} initialized: ${initSig}`);
```

#### Example output:

If it's successful, you should see a successful simulation in the console. Just to verify that the account was initialised correctly, search for the printed key or signature on a Solana Explorer.

```json5
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

Once your feed has been successfully created, take note of your feed's public key and move on to [part 3.](../../../docs-by-chain/solana-svm/data-feeds/part-3-integrating-your-feed/)
