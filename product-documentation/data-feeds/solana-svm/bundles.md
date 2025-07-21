# Bundle Method Overview

## Overview

The bundle method represents a paradigm shift in how oracle data is delivered on Solana, eliminating write locks and reducing costs by 90%.

### 🚀 No Data Feed Accounts Required

Unlike traditional oracle solutions, bundles require **ZERO setup**:

* ❌ No need to create data feed accounts
* ❌ No need to fund accounts with SOL
* ❌ No need to manage account permissions
* ✅ Just fetch a feed hash and start using prices immediately!

## Why are bundles faster than other oracle solutions?

```
Traditional Approach (Higher Cost):
Oracle → Feed Account (write) → Your Program (read)
         ↑ Write Lock Required

Bundle Method (90% Lower Cost):
Oracle → Bundle → Your Program (direct use)
         ↑ No Write Lock!
```

## Key Benefits

| Feature              | Bundle Method | Traditional Feeds |
| -------------------- | ------------- | ----------------- |
| **Transaction Cost** | FREE          | \~0.0001 SOL      |
| **Write Locks**      | None          | Required          |
| **Parallelization**  | Unlimited     | Limited           |
| **Setup Time**       | Instant       | 5-10 minutes      |
| **Maintenance**      | None          | Crank required    |

## How Bundles Work

### 1. **Stateless Architecture**

* **No data feed accounts** - Start using prices without any account creation
* No on-chain accounts to create or maintain
* Prices are verified and used directly in your transaction
* Multiple programs can read the same price simultaneously

### 2. **Efficient Signature Verification**

```typescript
// Fetch the latest price bundle
const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(gateway, crossbar, [
  feedHash1,
  feedHash2,
  // ... batch multiple feeds
]);

// Create transaction with both instructions
const tx = await asV0Tx({
  connection,
  ixs: [
    sigVerifyIx,        // Verify oracle signatures via precompile
    yourProgramIx       // Use verified prices immediately
  ],
  signers: [keypair],
});
```

### 3. **On-Chain Verification**

```rust
let verified_bundle = BundleVerifierBuilder::from(&bundle)
    .queue(&queue)
    .slothash_sysvar(&slothashes)
    .ix_sysvar(&instructions)
    .clock(&Clock::get()?)
    .max_age(50) // Maximum age in slots
    .verify()
    .unwrap();

// Extract verified price
let price = verified_bundle.feed(FEED_HASH)?.value();
```

## Bundle Size Optimization

Understanding bundle sizes helps optimize your transactions:

**Base Formula**: `Total bytes = 34 + (n × 96) + (m × 49)`

Where:

* `n` = number of oracles
* `m` = number of feeds

**Examples:**

* 1 oracle, 1 feed: \~179 bytes
* 3 oracles, 5 feeds: \~563 bytes
* 3 oracles, 10 feeds: \~812 bytes

## Quick Start with Bundles

```bash
# Clone the examples repository
git clone https://github.com/switchboard-xyz/sb-on-demand-examples.git
cd sb-on-demand-examples/solana

# Install dependencies
bun install

# Run with your feed hash
bun run scripts/runBundle.ts --feedHash YOUR_FEED_HASH
```

## Real-World Use Cases

### DeFi Lending Protocol

```rust
pub fn liquidate_position(ctx: Context<Liquidate>, bundle: Vec<u8>) -> Result<()> {
    // Verify the bundle
    let verified_bundle = BundleVerifierBuilder::from(&bundle)
        .queue(&ctx.accounts.queue)
        .slothash_sysvar(&ctx.accounts.slothashes)
        .ix_sysvar(&ctx.accounts.instructions)
        .clock(&Clock::get()?)
        .max_age(50)
        .verify()?;

    // Extract BTC price
    let btc_feed = verified_bundle.feed(BTC_FEED_ID)?;
    let btc_price = btc_feed.value();

    // Check if position is underwater
    let ltv = calculate_ltv(ctx.accounts.position, btc_price);
    require!(ltv > LIQUIDATION_THRESHOLD, ErrorCode::PositionHealthy);

    // Execute liquidation...
}
```

### Perpetual DEX

```typescript
async function executeTrade(
  amount: number,
  leverage: number,
  feedHashes: string[]
) {
  // Fetch multiple prices in one bundle
  const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(
    gateway,
    crossbar,
    feedHashes // ["BTC/USD", "ETH/USD", "SOL/USD"]
  );

  // Create your trading instruction
  const tradeIx = await program.methods
    .openPosition(amount, leverage, bundle)
    .accounts({
      trader: wallet.publicKey,
      market: marketPda,
      queue: queue.pubkey,
      // ... other accounts
    })
    .instruction();

  // Execute atomically
  const tx = await asV0Tx({
    connection,
    ixs: [sigVerifyIx, tradeIx],
    signers: [wallet],
    computeUnitPrice: 50_000, // Higher priority for MEV protection
  });

  await connection.sendTransaction(tx);
}
```

### Stablecoin Minting

```typescript
async function mintStablecoin(collateralAmount: number) {
  // Fetch collateral asset prices
  const collateralFeeds = [
    "0x...", // wBTC feed hash
    "0x...", // wETH feed hash
    "0x...", // SOL feed hash
  ];

  const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(
    gateway,
    crossbar,
    collateralFeeds
  );

  const mintIx = await stablecoinProgram.methods
    .mint(collateralAmount, bundle)
    .accounts({
      user: wallet.publicKey,
      collateralVault: vaultPda,
      mintAuthority: mintAuthorityPda,
      queue: queue.pubkey,
      slothashes: SYSVAR_SLOT_HASHES_PUBKEY,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();

  // Bundle verification + minting in one atomic transaction
  const tx = await asV0Tx({
    connection,
    ixs: [sigVerifyIx, mintIx],
    signers: [wallet],
  });

  const sig = await connection.sendTransaction(tx);
}
```

## When to Use Bundles

* Smart contract integrations
* DeFi protocols requiring multiple price points
* Cost-sensitive applications
* Standard trading applications

## Current Limits

* **Rate Limit**: 30 requests per minute
* **Cost**: FREE during launch phase
* **No maintenance**: No cranks or accounts needed

## Getting Started

1. Get a feed hash from [Switchboard Bundle Builder](https://beta.ondemand.switchboard.xyz/bundle-builder)
2. Use the bundle examples: [GitHub Repository](https://github.com/switchboard-xyz/sb-on-demand-examples)
3. Integrate into your program using the verification pattern

## Next Steps

* [On-chain integration guide](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana#-quick-start-30-seconds-to-first-price)
* [Feed design tutorial](part-1-designing-and-simulating-your-feed/)
* [Code examples](https://github.com/switchboard-xyz/sb-on-demand-examples)
