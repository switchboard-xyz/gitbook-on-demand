# X402 Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/x402](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/x402)

This tutorial walks you through implementing Switchboard with X402 micropayments to access paywalled data sources on Solana.

## Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) installed and configured
- Node.js 18+
- A Solana keypair with USDC on mainnet-beta (for micropayments)

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

## Understanding the Flow

The X402 integration follows these steps:

1. **Initialize Faremeter wallet** - Create a local wallet for USDC micropayments
2. **Derive X402 headers** - Generate authentication headers for the paywalled endpoint
3. **Define oracle feed inline** - Create feed definition with placeholder variables
4. **Fetch managed update** - Pass X402 headers as variable overrides
5. **Read oracle data** - Access verified data from the quote account

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

The feed is defined inline with placeholder variables that will be replaced at runtime:

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
          httpTask: {
            url: URL,
            method: OracleJob.HttpTask.Method.METHOD_POST,
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: RPC_METHOD,
            }),
            headers: [
              {
                key: "X-PAYMENT",
                value: "${X402_PAYMENT_HEADER}",
              },
              {
                key: "X-SWITCHBOARD-PAYMENT",
                value: "${X402_SWITCHBOARD_PAYMENT_HEADER}",
              },
            ],
          },
        },
        {
          jsonParseTask: {
            path: "$.result",
          },
        },
      ],
    },
  ],
};
```

Note the `${X402_PAYMENT_HEADER}` and `${X402_SWITCHBOARD_PAYMENT_HEADER}` placeholders - these get replaced with actual authentication headers at runtime.

### Step 3: Initialize Payment Infrastructure

```typescript
// Load Solana environment from `solana config get`
const { program, keypair, connection, crossbar } = await sb.AnchorUtils.loadEnv();
console.log("Wallet:", keypair.publicKey.toBase58());

// Create Faremeter wallet for X402 payments on mainnet
const wallet = await createLocalWallet("mainnet-beta", keypair);

// Configure USDC payment handler
const paymentHandler = exact.createPaymentHandler(wallet, USDC, connection);
```

### Step 4: Check USDC Balance

Before making payments, verify you have sufficient USDC:

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

The X402FetchManager derives authentication headers for the paywalled endpoint:

```typescript
// Initialize X402 manager
const x402Manager = new X402FetchManager(paymentHandler);

// Derive payment headers for the specific request
const paymentHeaders = await x402Manager.derivePaymentHeaders(URL, {
  method: "POST",
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: RPC_METHOD,
  }),
});

const paymentHeader = paymentHeaders.xPaymentHeader;
const switchboardPaymentHeader = paymentHeaders.xSwitchboardPayment;
```

### Step 6: Fetch Managed Update with Variable Overrides

Pass the X402 headers as variable overrides when fetching oracle instructions:

```typescript
// Load Switchboard queue
const queue = await sb.Queue.loadDefault(program);

// Compute the feed ID (hash of the protobuf)
const feedId = FeedHash.computeOracleFeedId(ORACLE_FEED);
console.log("Feed ID:", `0x${feedId.toString("hex")}`);

// Derive the canonical quote account
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);
console.log("Quote Account:", quoteAccount.toBase58());

// Fetch managed update instructions with X402 variable overrides
const instructions = await queue.fetchManagedUpdateIxs(
  crossbar,
  [ORACLE_FEED],
  {
    // CRITICAL: numSignatures MUST BE 1 for X402 requests
    numSignatures: 1,
    // Pass X402 headers as variable overrides
    variableOverrides: {
      X402_PAYMENT_HEADER: paymentHeader,
      X402_SWITCHBOARD_PAYMENT_HEADER: switchboardPaymentHeader,
    },
    instructionIdx: 0,
    payer: keypair.publicKey,
  }
);
```

### Step 7: Build and Send Transaction

```typescript
// Build transaction with oracle update and your program instruction
const tx = await sb.asV0Tx({
  connection,
  ixs: [
    ...instructions,  // Managed update instructions
    readOracleIx,     // Your instruction to read from quote account
  ],
  signers: [keypair],
  computeUnitPrice: 20_000,
  computeUnitLimitMultiple: 1.1,
});

// Simulate first (optional)
const sim = await connection.simulateTransaction(tx);
console.log(sim.value.logs?.join("\n"));

// Send transaction
const signature = await connection.sendTransaction(tx);
console.log("Transaction:", signature);
```

## Key Points

### numSignatures Must Be 1

When using X402, you **must** set `numSignatures: 1` in the managed update options. This is a critical requirement for X402 requests to work correctly.

```typescript
const instructions = await queue.fetchManagedUpdateIxs(crossbar, [ORACLE_FEED], {
  numSignatures: 1,  // REQUIRED for X402
  // ...
});
```

### Don't Reuse Payment Headers

Each X402 payment header is valid for a single request. If you simulate a transaction with an X402 header and then send the actual transaction, you may be charged twice. Either:

- Skip simulation for X402 transactions, or
- Generate separate headers for simulation and execution

```typescript
// WARNING: Don't simulate with the same X402 header you'll use for execution
// const simFeed = await crossbar.simulateFeed(ORACLE_FEED, true, {
//   X402_PAYMENT_HEADER: paymentHeader
// });
```

### Inline Feed Definition

Unlike standard managed updates (which use feed IDs from IPFS), X402 feeds are defined inline in your code. This allows for dynamic configuration without on-chain or IPFS storage.

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
- Join our [Discord](https://discord.gg/switchboard) for support
