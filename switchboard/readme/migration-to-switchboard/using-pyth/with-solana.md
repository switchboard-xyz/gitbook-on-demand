---
description: Migrating to Switchboard, using Pyth, on Solana
---

# With Solana

### Add Switchboard SDKs <a href="#install-pyth-sdks" id="install-pyth-sdks"></a>

Switchboard provides two SDKs, one for using the SDK with Typescript, another in Rust for reading prices on-chain.&#x20;

#### Rust SDK <a href="#rust-sdk" id="rust-sdk"></a>

Change the dependencies section of your `Cargo.toml` file from:

<pre class="language-toml"><code class="lang-toml">[dependencies]
<strong># pyth-solana-receiver-sdk ="0.1.0"
</strong><strong>switchboard-on-demand = "0.1.14"
</strong></code></pre>

#### Typescript SDK <a href="#typescript-sdk" id="typescript-sdk"></a>

Pyth provides two Typescript packages, [@pythnetwork/price-service-client](https://github.com/pyth-network/pyth-crosschain/tree/main/price\_service/client/js) and [@pythnetwork/pyth-solana-receiver](https://github.com/pyth-network/pyth-crosschain/tree/main/target\_chains/solana/sdk/js/pyth\_solana\_receiver), for fetching Pyth prices and submitting them to the blockchain respectively. You can replace these packages with the single Switchboard Typescript SDK, [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand) with has a similar responsibility.

Get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

## Updating On-Chain Code

### 1. Updating Imports

Switchboard updates can be read from **PullFeedAccountData,** the account in which updates are stored after being pulled on-chain.&#x20;

#### Pyth

```rust
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2};
```

#### Switchboard

```rust
use switchboard_on_demand::on_demand::accounts::pull_feed::PullFeedAccountData;
```

### 2. Updating Accounts&#x20;

Ingesting data will now require a Feed account to be read. You can update the instruction accounts to use Switchboard.

#### Pyth

```rust
#[derive(Accounts)]
#[instruction()]
pub struct Example<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub price_update: Account<'info, PriceUpdateV2>,
}
```

#### Switchboard

```rust
#[derive(Accounts)]
#[instruction()]
pub struct Example<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub feed: AccountInfo<'info>,
}
```

### 3. Reading Updates

Reading updates using Switchboard is pretty similar using Anchor.&#x20;

#### Pyth

```rust
pub fn example(ctx: Context<Example>) -> Result<()> {
    let price_update = &mut ctx.accounts.price_update;
    let feed_id: [u8; 32] = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
    let price = price_update.get_price_no_older_than(&Clock::get()?, 60, &feed_id)?;
    msg!("The price is ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);
    Ok(())
}
```

#### Switchboard

```rust
pub fn example(ctx: Context<Example>) -> Result<()> {
    let feed_account = ctx.accounts.feed.data.borrow();
    let feed = PullFeedAccountData::parse(feed_account).unwrap();
    let feed_id: [u8; 32] = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
    // Get the value, a https://docs.rs/rust_decimal/latest/rust_decimal/struct.Decimal.html
    let price = feed.value();
    // Log the Decimal Value
    msg!("price: {:?}", price);
    Ok(())
}
```

## Updating Off-chain Code

The Pyth network leverages **hermes**, a middleman server, to distribute encoded pythnet update data to end-users. Switchboard applies a similar approach with [Crossbar](../../../running-crossbar/), but on Solana it's unnecessary since it's Switchboard's home-base.&#x20;

### Step 1: Updating Imports

Pyth has 2 imports, one for connecting to Hermes for price updates, and another for formatting price updates into Solana-compatible data. Switchboard has the on-demand ts-sdk for interacting with oracles and updating Solana feeds.

#### **Pyth**

```typescript
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
```

#### Switchboard

```typescript
import {
  PullFeed,
  loadLookupTables,
  SB_ON_DEMAND_PID
} from "@switchboard-xyz/on-demand";
```

### Step 2: Using Update Data

Pyth leverages the hermes server, Switchboard on Solana will pull directly from oracles. In the future, we may employ Crossbar servers to broker data by protocol.&#x20;

#### Pyth

```typescript
// You will need a Connection from @solana/web3.js and a Wallet from @coral-xyz/anchor to create
// the receiver.
const connection: Connection;
const wallet: Wallet;

// Connect to Hermes
const priceServiceConnection = new PriceServiceConnection(
  "https://hermes.pyth.network/",
  { priceFeedRequestConfig: { binary: true } }
);

// Get latest price data
const priceUpdateData: string[] = await priceServiceConnection.getLatestVaas([
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
]);

// Get Solana Receiver
const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });
 
```

#### Switchboard

```typescript
import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  PullFeed,
  loadLookupTables,
  SB_ON_DEMAND_PID
} from "@switchboard-xyz/on-demand";

const connection: Connection;
const wallet: Wallet;

// Get the Switchboard Program
const provider = new AnchorProvider(connection, wallet, {});
const idl = (await Program.fetchIdl(programId, provider))!;
const switchboard = new Program(idl, provider);

// Replace with your feed pubkey
const feed = new PullFeed(switchboard, new PublicKey("6qmsMwtMmeqMgZEhyLv1Pe4wcqT5iKwJAWnmzmnKjf83"));

// Fetch the update data 
const [pullIx, responses, success] = await feed.fetchUpdateIx();

```

### Step 3: Submitting Updates

Pyth price updates are generated with a transaction builder using their client SDK which sends multiple transactions when needed. Clients would build their transaction in the **addPriceConsumerInstructions** callback, sending them all in the **sendAll** instruction at the very end

```typescript
// ... 
const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

// Create Transaction builder and add update data instructions to the TX
const transactionBuilder = pythSolanaReceiver.newTransactionBuilder({
  closeUpdateAccounts: false,
});
await transactionBuilder.addPostPriceUpdates(priceUpdateData);
 
// Adds your custom instructions using price updates to the TX 
await transactionBuilder.addPriceConsumerInstructions(
  async (
    getPriceUpdateAccount: (priceFeedId: string) => PublicKey
  ): Promise<InstructionWithEphemeralSigners[]> => {
    // ... get instructions to use price update here
    return [];
  }
);

// Send the TX's
await pythSolanaReceiver.provider.sendAll(
  await transactionBuilder.buildVersionedTransactions({
    computeUnitPriceMicroLamports: 50000,
  }),
  { skipPreflight: true }
);

// Done!
 
```

#### Switchboard

```typescript
// Get the update instruction for switchboard and lookup tables to make the instruction lighter
const [pullIx, responses, success] = await feedAccount.fetchUpdateIx({ crossbarClient: crossbar });
const lookupTables = await loadLookupTables([...responses.map((x) => x.oracle), feedAccount]);

// Set priority fee for that the tx
const priorityFeeIx = web3.ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 100_000,
});

// Get the latest context
const {
  context: { slot: minContextSlot },
  value: { blockhash, lastValidBlockHeight },
} = await connection.getLatestBlockhashAndContext();

// Get Transaction Message 
const message = new web3.TransactionMessage({
  payerKey: publicKey,
  recentBlockhash: blockhash,
  instructions: [addPriorityFee, pullIx, myIx],
}).compileMessageV0(lookupTables);
  
// Get Versioned Transaction
const vtx = new web3.VersionedTransaction(message);
const signed = await wallet.signTransaction(vtx);

// Send the transaction 
const signature = await connection.sendRawTransaction(signed.serialize(), {
  maxRetries: 0,
  skipPreflight: true,
});
  
// Wait for confirmation
await connection.confirm({
  signature,
  blockhash,
  lastValidBlockHeight,
});

// Done!

```
