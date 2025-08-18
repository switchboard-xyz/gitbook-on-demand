# Bundle Method Overview

## Overview

The bundle method represents a paradigm shift in how oracle data is delivered on Solana, eliminating write locks and reducing costs by 90%. With the new **Ed25519 signature verification**, bundles now require only **485 compute units** for single feed verification, making them the most cost-efficient oracle solution on Solana.

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

| Feature              | Bundle Method (Ed25519) | Traditional Feeds |
| -------------------- | ----------------------- | ----------------- |
| **Transaction Cost** | FREE                   | \~0.0001 SOL      |
| **Compute Units**    | **485 CU** (1 feed)   | 1,000+ CU         |
| **Write Locks**      | None                   | Required          |
| **Parallelization**  | Unlimited              | Limited           |
| **Setup Time**       | Instant                | 5-10 minutes      |
| **Maintenance**      | None                   | Crank required    |

## How Bundles Work

### 1. **Stateless Architecture**

* **No data feed accounts** - Start using prices without any account creation
* No on-chain accounts to create or maintain
* Prices are verified and used directly in your transaction
* Multiple programs can read the same price simultaneously

### 2. **Ultra-Efficient Ed25519 Signature Verification**

The new Ed25519 verification system delivers unprecedented efficiency with only **485 compute units** for single feed verification:

```typescript
// Fetch the latest price bundle with Ed25519 optimization
const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(gateway, crossbar, [
  feedHash1,
  feedHash2,
  // ... batch up to 8 feeds per oracle
]);

// Create transaction with minimal compute cost
const tx = await asV0Tx({
  connection,
  ixs: [
    sigVerifyIx,        // Ed25519 verification: ~485 CU for 1 feed
    yourProgramIx       // Use verified prices immediately
  ],
  signers: [keypair],
  computeUnitPrice: 10_000, // Optimized for low priority fees
});
```

**Ed25519 Advantages:**
* **Ultra-Low Cost**: Only 485 compute units for single feed verification
* **Zero-Copy Parsing**: No memory allocations during signature verification
* **Batch Validation**: Single memcmp operation validates all oracle signatures
* **Variable Message Length**: Supports any message size safely

### 3. **Ultra-Fast On-Chain Verification**

The Ed25519 verification process uses advanced optimizations for minimal compute cost:

```rust
// Ed25519 verification with zero-copy parsing and batch validation
let verified_bundle = BundleVerifierBuilder::from(&bundle)
    .queue(&queue)
    .slothash_sysvar(&slothashes)
    .ix_sysvar(&instructions)  // Ed25519 instruction parsing
    .clock(&Clock::get()?)
    .max_age(50) // Maximum age in slots
    .verify()    // Single memcmp validates all signatures
    .unwrap();

// Extract verified price (zero allocation)
let price = verified_bundle.feed(FEED_HASH)?.value();
```

**Verification Optimizations:**
* **485 compute units** for single feed verification
* Zero-copy Ed25519 instruction parsing
* Fixed-size validation arrays (no heap allocations)
* Single memcmp operation validates all oracle signatures
* Branchless bounds checking for maximum performance

## Bundle Size Optimization

Understanding bundle sizes helps optimize your transactions with the new Ed25519 signature verification:

### Ed25519 Instruction Size Formula

**Updated Formula**: `Total bytes = 112 + 32 + (m × 49) + n + 9`

Where:
* `112` = Ed25519 instruction base overhead
* `32` = Slothash (signed message prefix)
* `m` = number of feeds (49 bytes each)
* `n` = number of oracle signatures
* `9` = slot + version metadata

### Feed Count Impact on Instruction Size

| Feed Count | 1 Oracle | 3 Oracles | 5 Oracles |
|------------|----------|-----------|-----------|
| **1 feed** | 203 bytes | 205 bytes | 207 bytes |
| **3 feeds** | 301 bytes | 303 bytes | 305 bytes |
| **5 feeds** | 399 bytes | 401 bytes | 403 bytes |
| **8 feeds** | 546 bytes | 548 bytes | 550 bytes |

### Compute Unit Costs per Feed Count

The Ed25519 verification process has been optimized for ultra-low compute costs:

| Feed Count | Compute Units | Instruction Size |
|------------|---------------|------------------|
| **1 feed** | 485 CU | 203-207 bytes |
| **3 feeds** | 505 CU | 301-305 bytes |
| **5 feeds** | 520 CU | 399-403 bytes |
| **8 feeds** | 545 CU | 546-550 bytes |

> **Note**: Verification costs only **485 compute units** for single feed bundles, scaling to just **545 CU** for 8 feeds, making them extremely cost-efficient compared to traditional oracle solutions.

### Key Optimizations

* **Zero-Copy Parsing**: Ed25519 instructions use ultra-efficient zero-copy parsing
* **Batch Validation**: Single memcmp operation validates all oracle signatures
* **Fixed Buffer Sizes**: Stack-allocated arrays eliminate heap allocations
* **Variable Message Length**: Ed25519 safely supports any message length (unlike secp256k1)

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
