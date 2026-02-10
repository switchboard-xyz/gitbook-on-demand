# Programmatic Surge Subscription Guide

This guide explains how to subscribe to Switchboard Surge programmatically on Solana, without using the explorer UI. It is intended for AI agents, bots, and automated systems that need to create or manage Surge subscriptions via on-chain transactions.

## Overview

Surge subscriptions are managed entirely on Solana via the Surge program (`orac1eFjzWL5R3RbbdMV68K9H6TaCVVcL6LjvQQWAbz`). The subscription flow is:

1. Choose a tier
2. Acquire SWTCH tokens
3. Call `subscription_init` with a live SWTCH/USDT oracle quote
4. Program calculates cost in SWTCH at the live price, transfers tokens to the vault
5. Subscription PDA is created and active until the end epoch

```
Wallet (has SWTCH tokens)
  → picks tier (Plug / Pro / Enterprise)
  → calls subscription_init with a fresh SWTCH/USDT oracle quote
  → program calculates cost in SWTCH at live price
  → transfers SWTCH to vault
  → subscription PDA created, active until end epoch
```

---

## Step 1: Choose a Tier

Tiers are on-chain PDA accounts with the seed `[TIER, tier_id_bytes]`, created by Switchboard admins. Each tier defines:

| Field | Description |
|-------|-------------|
| `cost_per_epoch_usd_cents` | Price in USD cents per epoch |
| `max_connections` | Maximum concurrent WebSocket connections |
| `max_feeds` | Maximum feeds per subscription |
| `max_feeds_per_ix` | Maximum feeds per instruction |
| `min_delay_ms` | Minimum update delay in milliseconds |
| `is_public` | Whether anyone can subscribe |

**Public tiers** (tier IDs 1-9) are open to all wallets. Tier IDs 10+ require admin approval.

### Current Tiers

| Tier | Tier ID | Approx. Cost | Quote Interval | Max Feeds | Max Connections |
|------|---------|---------------|----------------|-----------|-----------------|
| **Plug** | 1 | Free | 10s | 2 | 1 |
| **Pro** | 2 | ~$3,000/mo | 450ms | 100 | 10 |
| **Enterprise** | 3 | ~$7,500/mo | 0ms | 300 | 15 |

To read tier details on-chain, derive the tier PDA:

```typescript
const [tierPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("TIER"), new BN(tierId).toArrayLike(Buffer, "le", 4)],
  SURGE_PROGRAM_ID
);
```

---

## Step 2: Get SWTCH Tokens

All subscription payments must be in **SWTCH tokens**. The program enforces this check:

```rust
require!(payment_mint.key() == state.swtch_mint, SubscriberError::MustPayWithSwtch);
```

Acquire SWTCH tokens via any Solana DEX (e.g., Jupiter, Raydium) before initiating the subscription.

---

## Step 3: Call `subscription_init`

Send a transaction with the `subscription_init` instruction. The instruction takes the following parameters:

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tier_id` | `u32` | Which tier to subscribe to (e.g., 1, 2, 3) |
| `epoch_amount` | `u16` | Number of epochs to pay for (1-146, i.e., up to ~1 year) |
| `contact_name` | `Option<String>` | Optional contact name metadata |
| `contact_email` | `Option<String>` | Optional contact email metadata |

### Required Accounts

| Account | Description | Derivation |
|---------|-------------|------------|
| **State** | The program's global state PDA | Seed: `[STATE]` |
| **Tier** | The chosen tier's PDA | Seed: `[TIER, tier_id_bytes]` |
| **Owner** | The wallet subscribing | Your wallet pubkey |
| **Payer** | Signer paying for rent + SWTCH tokens | Typically same as owner |
| **Payment Mint** | The SWTCH token mint | Stored in `state.swtch_mint` |
| **Payer Token Account** | Payer's SWTCH associated token account | Standard ATA derivation |
| **Token Vault** | Program's vault for the payment mint | PDA from program state |
| **Quote Account** | A Switchboard oracle quote with the live SWTCH/USDT price | Fetched from Switchboard oracle |

### Deriving PDAs

```typescript
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

const SURGE_PROGRAM_ID = new PublicKey("orac1eFjzWL5R3RbbdMV68K9H6TaCVVcL6LjvQQWAbz");

// State PDA
const [statePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("STATE")],
  SURGE_PROGRAM_ID
);

// Tier PDA (e.g., tier_id = 2 for Pro)
const tierId = 2;
const [tierPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("TIER"), new BN(tierId).toArrayLike(Buffer, "le", 4)],
  SURGE_PROGRAM_ID
);

// Subscription PDA (derived from owner wallet)
const [subscriptionPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("SUBSCRIPTION"), ownerPublicKey.toBuffer()],
  SURGE_PROGRAM_ID
);
```

---

## Step 4: On-Chain Pricing

The program does **not** use a hardcoded SWTCH price. Instead, it reads the live SWTCH/USDT price from a Switchboard oracle quote passed as an account in the transaction.

### Pricing Logic

1. Deserializes the oracle quote account
2. Validates the feed ID matches the expected `swtch_feed_id` stored in program state
3. Extracts the USD price (e.g., $0.11246 per SWTCH)
4. Converts tier cost from USD cents to SWTCH lamports:

```
lamports = (0.01 / swtch_price) * 1e9
```

5. Multiplies by `epoch_amount * cost_per_epoch_usd_cents`
6. Transfers that amount of SWTCH from payer's token account to the program vault

### Example Cost Calculation

For a Pro tier at `cost_per_epoch_usd_cents = 700` (i.e., $7.00/epoch), buying 40 epochs, with SWTCH at $0.11:

```
cost_per_cent_in_lamports = (0.01 / 0.11) * 1e9 = 90,909,090 lamports
total = 90,909,090 * 40 * 700 = 2,545,454,520,000,000 lamports
```

The oracle quote must be **fresh** — stale quotes will be rejected.

---

## Step 5: Subscription Created

Once the transaction succeeds, a subscription PDA is created at `[SUBSCRIPTION, owner_pubkey]`. The subscription includes:

- **Bonus epoch**: The current epoch is free — you get +1 epoch on top of what you paid for
- **Epoch tracking**: Subscription validity is tracked via `subscription_start_epoch` and `subscription_end_epoch`
- **User management**: Up to 16 authorized users can be added later via `subscription_manage_users`

---

## Providing the Oracle Quote

The SWTCH/USDT price quote is the most important piece of the subscription transaction. You need to pass a valid, fresh Switchboard oracle quote for the SWTCH/USDT feed.

### Using the Switchboard SDK

```typescript
import * as sb from "@switchboard-xyz/on-demand";

const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new sb.Crossbar({
  rpcUrl: connection.rpcEndpoint,
  programId: queue.pubkey,
});

// Fetch the SWTCH/USDT oracle quote
// The swtch_feed_id is stored in the program state account
const swtchFeedHash = "<SWTCH/USDT feed hash from program state>";
const quoteIx = await queue.fetchQuoteIx(crossbar, [swtchFeedHash], {
  numSignatures: 1,
  payer: keypair.publicKey,
});
```

Include the quote instruction(s) in the same transaction as `subscription_init` to ensure the price data is fresh and verified.

---

## Full Transaction Assembly

A complete subscription transaction includes:

1. Oracle quote verification instruction(s) — ensures fresh SWTCH/USDT price on-chain
2. `subscription_init` instruction — creates the subscription using the verified price

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// 1. Setup
const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new sb.Crossbar({
  rpcUrl: connection.rpcEndpoint,
  programId: queue.pubkey,
});

// 2. Fetch SWTCH/USDT oracle quote instructions
const swtchFeedHash = "<SWTCH/USDT feed hash>";
const quoteIxs = await queue.fetchQuoteIx(crossbar, [swtchFeedHash], {
  numSignatures: 1,
  payer: keypair.publicKey,
});

// 3. Build subscription_init instruction
//    (using the Surge program's IDL / client)
const subscriptionInitIx = buildSubscriptionInitIx({
  tierId: 2,           // Pro tier
  epochAmount: 40,     // ~40 epochs
  contactName: null,
  contactEmail: null,
  accounts: {
    state: statePda,
    tier: tierPda,
    owner: keypair.publicKey,
    payer: keypair.publicKey,
    paymentMint: swtchMint,
    payerTokenAccount: payerSwtchAta,
    tokenVault: tokenVaultPda,
    quoteAccount: quoteAccountPubkey,
  },
});

// 4. Build and send versioned transaction
const tx = await sb.asV0Tx({
  connection,
  ixs: [quoteIxs, subscriptionInitIx],
  signers: [keypair],
  lookupTables: [],
});

const sig = await connection.sendTransaction(tx);
console.log(`Subscription created: ${sig}`);
```

---

## Verifying Your Subscription

After the transaction confirms, read the subscription PDA to verify:

```typescript
const [subscriptionPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("SUBSCRIPTION"), keypair.publicKey.toBuffer()],
  SURGE_PROGRAM_ID
);

const subscriptionAccount = await program.account.subscription.fetch(subscriptionPda);
console.log("Start epoch:", subscriptionAccount.subscriptionStartEpoch.toString());
console.log("End epoch:", subscriptionAccount.subscriptionEndEpoch.toString());
```

---

## Key Addresses

| Item | Value |
|------|-------|
| Surge Program ID | `orac1eFjzWL5R3RbbdMV68K9H6TaCVVcL6LjvQQWAbz` |
| SWTCH Token Mint | Stored in program state (`state.swtch_mint`) |
| SWTCH/USDT Feed ID | Stored in program state (`state.swtch_feed_id`) |

---

## Notes for AI Agents

- **Fresh quotes are mandatory**: The oracle quote account must contain a recent SWTCH/USDT price. Include the quote verification instruction in the same transaction.
- **Epoch amounts**: Valid range is 1-146 epochs. One Solana epoch is approximately 2-3 days, so 146 epochs covers roughly one year.
- **Free tier**: The Plug tier (tier ID 1) is free but still requires calling `subscription_init` with a valid oracle quote (the transfer amount will be zero).
- **Subscription PDA is unique per wallet**: Each wallet can have only one subscription at `[SUBSCRIPTION, owner_pubkey]`.
- **Managing users**: After subscribing, use `subscription_manage_users` to authorize up to 16 additional wallets to use the subscription.
