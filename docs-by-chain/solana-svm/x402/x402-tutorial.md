# X402 Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/x402](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/x402)

## The Problem: Accessing Paywalled Data in Oracles

Many valuable data sources—premium RPC endpoints, institutional APIs, proprietary market data—require payment or authentication. Traditional oracles can't access these sources because:

1. **No way to pay**: Oracles can't hold funds or make payments on your behalf
2. **Static credentials**: Storing API keys in feed definitions (on IPFS or on-chain) exposes them publicly
3. **Per-request pricing**: Many premium services charge per-request, incompatible with polling oracles

**X402 solves this** by enabling micropayments directly in HTTP requests. The oracle authenticates with the paywalled API using payment headers you provide at runtime, without ever exposing credentials or requiring the oracle to hold funds.

## What We're Building

In this tutorial, we'll fetch data from a **paywalled Helius RPC endpoint** using X402 micropayments. The flow works like this:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              X402 Oracle Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   YOUR APP                           ORACLE (TEE)           PAYWALLED API   │
│   ────────                           ────────────           ─────────────   │
│                                                                              │
│   1. Derive X402 payment ─────┐                                              │
│      headers (USDC auth)      │                                              │
│                               ▼                                              │
│   2. Define feed with    ┌─────────┐                                         │
│      ${PLACEHOLDER}  ───►│Crossbar │                                         │
│      variables           └────┬────┘                                         │
│                               │                                              │
│   3. Pass headers as          │    4. Oracle makes               ┌────────┐ │
│      variable overrides ──────┼─────► authenticated ────────────►│ Helius │ │
│                               │       HTTP request               │  RPC   │ │
│                               │       with X-PAYMENT             └───┬────┘ │
│                               │       header                         │      │
│                               │                                      │      │
│                               │    5. Paywalled data ◄───────────────┘      │
│                               │       returned                               │
│                               ▼                                              │
│   6. Signed oracle data  ┌─────────┐                                         │
│      in quote account ◄──│ Oracle  │                                         │
│                          │Response │                                         │
│                          └─────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifically, we'll:**
- Call `getBlockHeight` on a paywalled Helius RPC endpoint
- Pay for the request using USDC micropayments via the X402 protocol
- Receive the block height as verified oracle data on-chain

This pattern works for any paywalled HTTP API—you're not limited to RPC endpoints.

## Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) installed and configured
- Node.js 18+
- A Solana keypair with **USDC on mainnet-beta** (the X402 payment token)

## Installation

Clone the examples repository and install dependencies:

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/solana/x402
npm install
```

### Dependencies

The example uses these X402-specific packages:

```json
{
  "@faremeter/payment-solana": "^0.8.0",
  "@faremeter/wallet-solana": "^0.8.0",
  "@switchboard-xyz/x402-utils": "0.3.0"
}
```

## How X402 Authentication Works

Unlike standard oracle feeds (stored on IPFS with a feed hash), X402 feeds are defined **inline** in your code with placeholder variables. At runtime, you:

1. **Derive payment headers** from the X402 protocol (these authorize your USDC payment)
2. **Replace placeholders** with actual headers via `variableOverrides`
3. **Oracle executes** the authenticated request inside a TEE (Trusted Execution Environment)

The oracle never sees your wallet or credentials—it just receives the pre-signed authentication headers.

## Implementation

### Step 1: Set Up Imports and Constants

```typescript
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";
import { FeedHash, OracleJob } from "@switchboard-xyz/common";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { exact } from "@faremeter/payment-solana";
import { X402FetchManager } from "@switchboard-xyz/x402-utils";
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
                key: "X-PAYMENT",
                value: "${X402_PAYMENT_HEADER}",
              },
              {
                // Switchboard-specific header for oracle verification
                key: "X-SWITCHBOARD-PAYMENT",
                value: "${X402_SWITCHBOARD_PAYMENT_HEADER}",
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
- `${X402_PAYMENT_HEADER}` and `${X402_SWITCHBOARD_PAYMENT_HEADER}` are placeholders that get replaced at runtime
- The oracle sees the actual header values, but they're never stored permanently anywhere
- `minJobResponses: 1` and `minOracleSamples: 1` because X402 payments are single-use (you can't have multiple oracles reuse the same payment header)

### Step 3: Initialize Payment Infrastructure

Faremeter is the payment infrastructure powering X402. We create a wallet and payment handler that will authorize USDC payments:

```typescript
// Load Solana environment from `solana config get`
const { program, keypair, connection, crossbar } = await sb.AnchorUtils.loadEnv();
console.log("Wallet:", keypair.publicKey.toBase58());

// Create Faremeter wallet for X402 payments on mainnet
// This wraps your Solana keypair with X402 payment capabilities
const wallet = await createLocalWallet("mainnet-beta", keypair);

// Configure USDC payment handler
// "exact" means you pay exactly what the API charges (no tips/overpayment)
const paymentHandler = exact.createPaymentHandler(wallet, USDC, connection);
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

### Step 5: Derive X402 Payment Headers

This is where the magic happens. The `X402FetchManager` derives cryptographic payment headers that:
- Prove you've authorized a USDC payment for this specific request
- Are bound to the exact URL, method, and body (can't be reused for different requests)
- Are single-use (can't be replayed)

```typescript
// Initialize X402 manager with your payment handler
const x402Manager = new X402FetchManager(paymentHandler);

// Derive payment headers for the specific request
// The headers are cryptographically bound to this exact request
const paymentHeaders = await x402Manager.derivePaymentHeaders(URL, {
  method: "POST",
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: RPC_METHOD,
  }),
});

// These headers will replace the placeholders in our feed definition
const paymentHeader = paymentHeaders.xPaymentHeader;
const switchboardPaymentHeader = paymentHeaders.xSwitchboardPayment;
```

**Important:** These headers are single-use. Once the oracle uses them, they can't be used again.

### Step 6: Fetch Managed Update with Variable Overrides

Now we bring it all together. We pass our payment headers as **variable overrides**, which replace the `${PLACEHOLDER}` values in our feed definition:

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
    // (payment headers are single-use, can't be shared across oracles)
    numSignatures: 1,

    // Variable overrides replace ${PLACEHOLDER} values in the feed
    variableOverrides: {
      X402_PAYMENT_HEADER: paymentHeader,
      X402_SWITCHBOARD_PAYMENT_HEADER: switchboardPaymentHeader,
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

X402 payment headers are **single-use**. Each header can only authenticate one oracle request. If you set `numSignatures: 2`, the second oracle would try to reuse the same payment header and fail.

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
//   X402_PAYMENT_HEADER: paymentHeader
// });

// This is SAFE - simulates the transaction, not the HTTP request
const sim = await connection.simulateTransaction(tx);
```

### Why Inline Feeds?

Standard Switchboard feeds are stored on IPFS and referenced by hash. X402 feeds must be defined inline because:

1. Payment headers change with every request
2. Headers contain sensitive payment authorization
3. The feed definition contains runtime placeholders, not static values

## Running the Example

```bash
npm run start
```

Expected output:

```
Wallet: <your-wallet-address>
RPC Method: getBlockHeight
Payment token: USDC
USDC balance: 10.500000 USDC
X402 manager initialized

Deriving X402 payment headers...
X402 payment headers generated
Feed ID: 0x<feed-hash>
Quote Account: <quote-account-address>

Fetching managed update instructions with X402 variable overrides...
Generated instructions: 2
   - Ed25519 signature verification
   - Quote program verified_update
   - Variable overrides: X402_PAYMENT_HEADER, X402_SWITCHBOARD_PAYMENT_HEADER

Building transaction...
Simulating transaction...
<transaction logs>

Simulation succeeded!
```

## Next Steps

- Learn about [Variable Overrides](../../../custom-feeds/advanced-feed-configuration/data-feed-variable-overrides.md) for other dynamic patterns
- Explore [Custom Feeds](../../../custom-feeds/build-and-deploy-feed/README.md) for building your own oracle jobs
- Check out other [Solana examples](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana)
- Join our [Discord](https://discord.gg/EyBm9a3bYm) for support
