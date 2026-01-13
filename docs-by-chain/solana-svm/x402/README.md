# X402 Micropayments Overview

X402 is a micropayment protocol that enables pay-per-request access to premium data sources on Solana. By integrating X402 with Switchboard, you can access paywalled APIs and RPC endpoints directly from oracle jobs, paying only for the data you consume.

## What is X402?

X402 (named after the HTTP 402 "Payment Required" status code) is a protocol for micropayments on Solana. It allows data providers to monetize their APIs and services on a per-request basis, while consumers can access premium data without subscriptions or upfront commitments.

Key benefits:
- **Pay-per-use**: Only pay for the data you actually consume
- **No subscriptions**: Access premium data without monthly commitments
- **Instant payments**: USDC micropayments settle immediately on Solana
- **Seamless integration**: Works with standard HTTP APIs via authentication headers

## How It Works with Switchboard

Switchboard integrates with X402 through **variable overrides**, a powerful feature that allows you to inject dynamic values into oracle job definitions at runtime. This enables oracles to authenticate with paywalled endpoints without storing sensitive credentials on-chain or in IPFS.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           X402 + Switchboard Flow                       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐      1. Derive X402       ┌────────────────┐
  │   Your   │      payment headers      │  X402 Manager  │
  │   App    │ ────────────────────────► │  (Faremeter)   │
  └──────────┘                           └────────────────┘
       │                                         │
       │ 2. Pass headers as                      │
       │    variable overrides                   │
       ▼                                         │
  ┌──────────┐                                   │
  │Crossbar  │ ◄─────────────────────────────────┘
  │          │       X-PAYMENT header
  └──────────┘
       │
       │ 3. Fetch oracle update
       │    with auth headers
       ▼
  ┌──────────┐      4. Authenticated     ┌────────────────┐
  │  Oracle  │      HTTP request         │  Paywalled     │
  │  (TEE)   │ ────────────────────────► │  RPC/API       │
  └──────────┘                           └────────────────┘
       │                                         │
       │ 5. Return signed                        │
       │    oracle data                          │
       ▼                                         │
  ┌──────────┐                                   │
  │  Quote   │ ◄─────────────────────────────────┘
  │ Account  │       Verified data
  └──────────┘
```

The key innovation is that oracle feeds are defined **inline** (not stored on IPFS), with placeholder variables like `${X402_PAYMENT_HEADER}` that get replaced at runtime with actual authentication headers.

## Key Concepts

### Faremeter Wallet

Faremeter is the payment infrastructure behind X402. You create a local wallet that manages USDC payments:

```typescript
import { createLocalWallet } from "@faremeter/wallet-solana";
import { exact } from "@faremeter/payment-solana";

const wallet = await createLocalWallet("mainnet-beta", keypair);
const paymentHandler = exact.createPaymentHandler(wallet, USDC, connection);
```

### Variable Overrides

Instead of hardcoding authentication headers in your feed definition, you use placeholders:

```typescript
const ORACLE_FEED = {
  name: "X402 Paywalled RPC Call",
  jobs: [{
    tasks: [{
      httpTask: {
        url: "https://paywalled-api.example.com",
        headers: [
          { key: "X-PAYMENT", value: "${X402_PAYMENT_HEADER}" },
          { key: "X-SWITCHBOARD-PAYMENT", value: "${X402_SWITCHBOARD_PAYMENT_HEADER}" }
        ]
      }
    }]
  }]
};
```

At runtime, you derive the actual headers and pass them as overrides:

```typescript
const instructions = await queue.fetchManagedUpdateIxs(crossbar, [ORACLE_FEED], {
  variableOverrides: {
    X402_PAYMENT_HEADER: paymentHeader,
    X402_SWITCHBOARD_PAYMENT_HEADER: switchboardPaymentHeader
  }
});
```

### Quote Accounts

Verified oracle data is stored in a canonical **quote account** derived from the feed hash. This allows your on-chain program to read the authenticated data:

```typescript
const feedId = FeedHash.computeOracleFeedId(ORACLE_FEED);
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);
```

## Use Cases

- **Premium RPC Endpoints**: Access high-performance, paywalled Solana RPC nodes
- **Authenticated APIs**: Fetch data from APIs requiring micropayment authentication
- **Dynamic Authentication**: Support custom authentication schemes without storing credentials
- **Pay-per-Request Data**: Access expensive data sources only when needed

## Next Steps

- Follow the [X402 Tutorial](x402-tutorial.md) for a complete implementation walkthrough
- Explore [Variable Overrides](../../../custom-feeds/advanced-feed-configuration/data-feed-variable-overrides.md) for more dynamic feed patterns
- Learn about [Custom Feeds](../../../custom-feeds/build-and-deploy-feed/README.md) for building your own oracle jobs
