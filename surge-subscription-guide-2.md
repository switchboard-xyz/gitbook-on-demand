# Programmatic Surge Subscription Guide (LLMs and Agents)

This guide explains how an automated client can subscribe to Switchboard Surge on Solana without using the explorer UI. It is designed for LLMs, AI agents, bots, and other programmatic workflows.

## Flow Overview

1. Choose a tier.
2. Ensure the payer has SWTCH tokens.
3. Call `subscription_init` with a fresh SWTCH/USDT oracle quote.
4. The program prices the tier in SWTCH at the live rate and transfers tokens to the vault.
5. A subscription PDA is created and becomes active through its end epoch.

```
Wallet (has SWTCH)
-> pick tier
-> fetch SWTCH/USDT quote
-> call subscription_init
-> program transfers SWTCH to vault
-> subscription PDA active until end epoch
```

## Step 1: Choose a Tier

Tiers are on-chain PDA accounts created by admins with seed `[TIER, tier_id_bytes]`. Each tier defines:

| Field | Description |
| --- | --- |
| `cost_per_epoch_usd_cents` | Price in USD cents per epoch |
| `max_connections` | Maximum concurrent connections |
| `max_feeds` | Maximum feeds per subscription |
| `max_feeds_per_ix` | Maximum feeds per instruction |
| `min_delay_ms` | Minimum update delay in milliseconds |
| `is_public` | Whether anyone can subscribe |

Public tiers are tier IDs 1-9. Tier IDs 10+ require admin approval.

## Step 2: Get SWTCH Tokens

Payments must be made in SWTCH. The program enforces this at `subscription_init_action.rs:76`:

```rust
require!(payment_mint.key() == state.swtch_mint, SubscriberError::MustPayWithSwtch);
```

Make sure the payer wallet has a SWTCH token account funded before calling `subscription_init`.

## Step 3: Call `subscription_init`

The transaction must include `subscription_init` with these parameters (`subscription_init_action.rs:54-59`):

| Parameter | Type | Description |
| --- | --- | --- |
| `tier_id` | `u32` | Tier to subscribe to |
| `epoch_amount` | `u16` | Number of epochs to pay for (1-146) |
| `contact_name` | `Option<String>` | Optional metadata |
| `contact_email` | `Option<String>` | Optional metadata |

Required accounts:

| Account | Description |
| --- | --- |
| State | Program global state PDA |
| Tier | PDA for the chosen tier |
| Owner | Wallet that owns the subscription |
| Payer | Signer paying rent and SWTCH |
| Payment Mint | SWTCH mint (must match `state.swtch_mint`) |
| Payer Token Account | Payer's SWTCH associated token account |
| Token Vault | Program vault PDA for SWTCH |
| Quote Account | Switchboard oracle quote for SWTCH/USDT |

## Step 4: On-Chain Pricing (Oracle Quote)

The program uses a live SWTCH/USDT price from the quote account (not a hardcoded rate). In `subscription_init_action.rs:89-117`, it:

1. Deserializes the quote account.
2. Validates the feed ID matches `state.swtch_feed_id`.
3. Extracts the USD price (for example, `$0.11246` per SWTCH).
4. Converts the tier cost from USD cents to SWTCH lamports:

```
lamports_per_cent = (0.01 / swtch_price) * 1e9
```

5. Multiplies by `epoch_amount * cost_per_epoch_usd_cents`.
6. Transfers that amount of SWTCH from the payer token account to the vault.

The quote must be fresh, so include the quote verification instruction in the same transaction as `subscription_init`.

## Step 5: Subscription Created

A subscription PDA is created at `[SUBSCRIPTION, owner_pubkey]`. The subscription includes:

- A free bonus for the current epoch (+1 epoch on top of what was paid for).
- Tracking via `subscription_start_epoch` and `subscription_end_epoch`.
- Support for up to 16 authorized users via `subscription_manage_users`.

## Summary

Wallet -> has SWTCH tokens
-> picks tier (public or admin-approved)
-> calls `subscription_init` with a fresh SWTCH/USDT quote
-> program calculates cost in SWTCH at the live price
-> transfers SWTCH to vault
-> subscription PDA created and active until end epoch
