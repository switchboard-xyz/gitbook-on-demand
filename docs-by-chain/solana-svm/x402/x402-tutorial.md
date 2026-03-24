# X402 Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/x402](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/x402)

> **Version source of truth:** [SDK Version Matrix](../../../tooling/sdk-version-matrix.md)

## The Problem: Accessing Paywalled Data in Oracles

Many valuable data sources—premium RPC endpoints, institutional APIs, proprietary market data—require payment or authentication. Traditional oracles can't access these sources because:

1. **No way to pay**: Oracles can't hold funds or make payments on your behalf
2. **Static credentials**: Storing API keys in feed definitions (on IPFS or on-chain) exposes them publicly
3. **Per-request pricing**: Many premium services charge per-request, incompatible with polling oracles

**X402 solves this** by enabling micropayments directly in HTTP requests. The oracle authenticates with the paywalled API using a PAYMENT-SIGNATURE header you provide at runtime, without ever exposing credentials or requiring the oracle to hold funds.

## What We're Building

In this tutorial, we'll fetch data from a **paywalled Helius RPC endpoint** using X402 micropayments. The flow works like this:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              X402 Oracle Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   YOUR APP                           ORACLE (TEE)           PAYWALLED API   │
│   ────────                           ────────────           ─────────────   │
│                                                                             │
│   1. Derive PAYMENT-SIGNATURE ─────┐                                        │
│      (USDC auth)                   │                                        │
│                               ▼                                             │
│   2. Define feed with    ┌─────────┐                                        │
│      ${PLACEHOLDER}  ───►│Crossbar │                                        │
│      variables           └────┬────┘                                        │
│                               │                                             │
│   3. Pass headers as          │    4. Oracle makes               ┌────────┐ │
│      variable overrides ──────┼─────► authenticated ────────────►│ Helius │ │
│                               │       HTTP request               │  RPC   │ │
│                               │       with PAYMENT-SIGNATURE     └───┬────┘ │
│                               │       header                         │      │
│                               │                                      │      │
│                               │    5. Paywalled data ◄───────────────┘      │
│                               │       returned                              │
│                               ▼                                             │
│   6. Signed oracle data  ┌─────────┐                                        │
│      in quote account ◄──│ Oracle  │                                        │
│                          │Response │                                        │
│                          └─────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifically, we'll:**
- Call `getBlockHeight` on a paywalled Helius RPC endpoint
- Pay for the request using USDC micropayments via the X402 protocol
- Receive the block height as verified oracle data on-chain

This pattern works for any paywalled HTTP API—you're not limited to RPC endpoints.

## Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) installed and configured
- Node.js 20+
- A Solana keypair with **USDC on mainnet-beta** (the X402 payment token)
  - Ensure the wallet has a USDC associated token account (ATA) with balance

## Installation

Clone the examples repository and install dependencies:

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/solana/x402
pnpm install
```

### Dependencies

The example uses these X402-specific packages:

```json
{
  "@x402/fetch": "^2.2.0",
  "@x402/svm": "^2.2.0"
}
```

## How X402 Authentication Works

Unlike standard oracle feeds (stored on IPFS with a feed hash), X402 feeds are defined **inline** in your code with placeholder variables. At runtime, you:

1. **Derive a PAYMENT-SIGNATURE header** from the X402 protocol (this authorizes your USDC payment)
2. **Replace placeholders** with the header via `variableOverrides`
3. **Oracle executes** the authenticated request inside a TEE (Trusted Execution Environment)

The oracle never sees your wallet or credentials—it just receives the pre-signed authentication headers.

## Implementation

### Step 1: Set Up Imports and Constants

```typescript
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";
import { FeedHash, OracleJob } from "@switchboard-xyz/common";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { toClientSvmSigner } from "@x402/svm";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const URL = "https://helius.api.corbits.dev";
const RPC_METHOD = "getBlockHeight";
const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
```

### Step 2: Define the Oracle Feed with Placeholders

This is the key difference from standard feeds. Instead of storing the feed on IPFS, we define it inline with **placeholder variables** for the authentication headers:

```typescript
const ORACLE_FEED = {
  name: "X402 Paywalled RPC Call",
  minJobResponses: 1,
  minOracleSamples: 1,
  maxJobRangePct: 0,
  jobs: [
    {
      tasks: [
        {
          // Task 1: Make an authenticated HTTP POST request to the paywalled RPC
          httpTask: {
            url: URL,
            method: OracleJob.HttpTask.Method.METHOD_POST,
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: RPC_METHOD,  // "getBlockHeight"
            }),
            headers: [
              {
                // X402 payment proof - proves you've authorized the USDC payment
                key: "PAYMENT-SIGNATURE",
                value: "${X402_PAYMENT_SIGNATURE}",
              },
            ],
          },
        },
        {
          // Task 2: Extract the result from the JSON-RPC response
          // Response format: { "jsonrpc": "2.0", "result": 123456789, "id": 1 }
          jsonParseTask: {
            path: "$.result",
          },
        },
      ],
    },
  ],
};
```

**Key points:**
- `${X402_PAYMENT_SIGNATURE}` is a placeholder that gets replaced at runtime
- The oracle sees the actual header values, but they're never stored permanently anywhere
- `minJobResponses: 1` and `minOracleSamples: 1` because X402 payments are single-use (you can't have multiple oracles reuse the same payment signature)

### Step 3: Initialize the x402 v2 Client

Create an x402 v2 client that can sign Solana payments:

```typescript
// Load Solana environment from `solana config get`
const { program, keypair, connection, crossbar } = await sb.AnchorUtils.loadEnv();
console.log("Wallet:", keypair.publicKey.toBase58());

// Create a Solana signer for x402 v2
const signer = await createKeyPairSignerFromBytes(keypair.secretKey);

// Register the Exact SVM scheme (supports v2 + v1)
const client = new x402Client();
registerExactSvmScheme(client, { signer: toClientSvmSigner(signer) });
```

### Step 4: Check USDC Balance

X402 payments are made in USDC. Verify you have sufficient balance before proceeding:

```typescript
async function checkUsdcBalance(
  connection: Connection,
  keypair: Keypair,
  usdcMint: PublicKey
): Promise<void> {
  const usdcTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    keypair.publicKey
  );
  const tokenAccountInfo = await getAccount(connection, usdcTokenAccount);
  const usdcBalance = Number(tokenAccountInfo.amount) / 1_000_000;
  console.log("USDC balance:", usdcBalance.toFixed(6), "USDC");
}

await checkUsdcBalance(connection, keypair, USDC);
```

### Step 5: Derive PAYMENT-SIGNATURE

This is where the magic happens. The x402 v2 client derives a `PAYMENT-SIGNATURE` header that:
- Proves you've authorized a USDC payment for this specific request
- Is bound to the exact URL, method, and body (can't be reused for different requests)
- Is single-use (can't be replayed)

```typescript
// Fetch the payment requirements (402) and derive a signature header
const response = await fetch(URL, {
  method: "POST",
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: RPC_METHOD,
  }),
});

const httpClient = new x402HTTPClient(client);
const paymentRequired = httpClient.getPaymentRequiredResponse(
  name => response.headers.get(name),
  await response.json().catch(() => undefined)
);
const paymentPayload = await client.createPaymentPayload(paymentRequired);
const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
const paymentSignature = paymentHeaders["PAYMENT-SIGNATURE"];
```

**Important:** These headers are single-use. Once the oracle uses them, they can't be used again.

### Step 6: Fetch Managed Update with Variable Overrides

Now we bring it all together. We pass our PAYMENT-SIGNATURE header as **variable overrides**, which replace the `${PLACEHOLDER}` values in our feed definition:

```typescript
// Load Switchboard queue
const queue = await sb.Queue.loadDefault(program);

// Compute the feed ID (hash of the inline feed definition)
// This is deterministic - same feed definition = same ID
const feedId = FeedHash.computeOracleFeedId(ORACLE_FEED);
console.log("Feed ID:", `0x${feedId.toString("hex")}`);

// Derive the quote account where verified data will be stored
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);
console.log("Quote Account:", quoteAccount.toBase58());

// Fetch managed update instructions
// This sends our feed definition + variable overrides to Crossbar,
// which coordinates with an oracle to execute the authenticated request
const instructions = await queue.fetchManagedUpdateIxs(
  crossbar,
  [ORACLE_FEED],  // Our inline feed definition with placeholders
  {
    // CRITICAL: numSignatures MUST BE 1 for X402 requests
    // (payment signatures are single-use, can't be shared across oracles)
    numSignatures: 1,

    // Variable overrides replace ${PLACEHOLDER} values in the feed
    variableOverrides: {
      X402_PAYMENT_SIGNATURE: paymentSignature,
    },
    instructionIdx: 0,
    payer: keypair.publicKey,
  }
);
```

The returned `instructions` contain:
1. **Ed25519 signature verification** - Proves the oracle signed the response
2. **Quote program update** - Writes verified data to the quote account

### Step 7: Build and Send Transaction

Finally, bundle the oracle instructions with your program's instruction and submit:

```typescript
// Build transaction with oracle update and your program instruction
const tx = await sb.asV0Tx({
  connection,
  ixs: [
    ...instructions,  // Oracle update (Ed25519 verify + quote write)
    readOracleIx,     // Your program reads from the quote account
  ],
  signers: [keypair],
  computeUnitPrice: 20_000,
  computeUnitLimitMultiple: 1.1,
});

// Simulate to verify everything works
// (safe here because this is the same transaction we'll send)
const sim = await connection.simulateTransaction(tx);
console.log(sim.value.logs?.join("\n"));

// Send the transaction
const signature = await connection.sendTransaction(tx);
console.log("Transaction:", signature);
```

After the transaction confirms, the `quoteAccount` contains the verified block height from the paywalled RPC.

## Important Constraints

### Why numSignatures Must Be 1

X402 payment signatures are **single-use**. Each signature can only authenticate one oracle request. If you set `numSignatures: 2`, the second oracle would try to reuse the same signature and fail.

```typescript
const instructions = await queue.fetchManagedUpdateIxs(crossbar, [ORACLE_FEED], {
  numSignatures: 1,  // REQUIRED for X402 - headers can't be shared
  // ...
});
```

### Simulation Warning: Don't Pay Twice

The X402 payment is charged when the oracle makes the HTTP request, not when your transaction lands on-chain. This means:

- **Crossbar simulation** (`crossbar.simulateFeed()`) will charge you
- **On-chain simulation** (`connection.simulateTransaction()`) is safe (no HTTP call)

```typescript
// DON'T DO THIS - you'll pay for the request but get no on-chain result
// const simFeed = await crossbar.simulateFeed(ORACLE_FEED, true, {
//   X402_PAYMENT_SIGNATURE: paymentSignature
// });

// This is SAFE - simulates the transaction, not the HTTP request
const sim = await connection.simulateTransaction(tx);
```

### Why Inline Feeds?

Standard Switchboard feeds are stored on IPFS and referenced by hash. X402 feeds must be defined inline because:

1. Payment signatures change with every request
2. Headers contain sensitive payment authorization
3. The feed definition contains runtime placeholders, not static values

## Running the Example

```bash
pnpm start
```

Expected output:

```
Wallet: <your-wallet-address>
RPC Method: getBlockHeight
USDC balance: 10.500000 USDC
X402 v2 client initialized

Deriving X402 PAYMENT-SIGNATURE...
X402 PAYMENT-SIGNATURE generated
Feed ID: 0x<feed-hash>
Quote Account: <quote-account-address>

Fetching managed update instructions with X402 variable overrides...
Generated instructions: 2
   - Ed25519 signature verification
   - Quote program verified_update
   - Variable overrides: X402_PAYMENT_SIGNATURE

Building transaction...
Simulating transaction...
<transaction logs>

Simulation succeeded!
```

## Next Steps

- Learn about [Variable Overrides](../../../custom-feeds/advanced-feed-configuration/data-feed-variable-overrides.md) for other dynamic patterns
- Explore [Custom Feeds](../../../custom-feeds/build-and-deploy-feed/README.md) for building your own oracle jobs
- Check out other [Solana examples](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana)
- Join our [Discord](https://discord.gg/TJAv6ZYvPC) for support
