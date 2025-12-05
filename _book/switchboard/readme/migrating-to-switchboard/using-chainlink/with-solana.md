---
description: Migrating to Switchboard, using Chainlink, on Solana
---

# With Solana

### Pull vs Push <a href="#install-pyth-sdks" id="install-pyth-sdks"></a>

Chainlink on Solana is a push-based oracle, so part of this update will require a minor change to your front-end libraries so you can read Switchboard updates and keep them updated on-demand.

### Add Switchboard SDKs <a href="#install-pyth-sdks" id="install-pyth-sdks"></a>

Switchboard provides two SDKs, one for using the SDK with Typescript, another in Rust for reading prices on-chain.

#### Rust SDK <a href="#rust-sdk" id="rust-sdk"></a>

Change the dependencies section of your `Cargo.toml` file from:

<pre class="language-toml"><code class="lang-toml">[dependencies]
<strong># chainlink_solana = "1.0.0"
</strong><strong>switchboard-on-demand = "0.1.14"
</strong></code></pre>

#### Typescript SDK <a href="#typescript-sdk" id="typescript-sdk"></a>

Chainlink provides a Typescript package, [@chainlin/solana-sdk](https://www.npmjs.com/package/@chainlink/solana-sdk), for interacting with chainlink on the Solana blockchain. You can replace this package with the single Switchboard Typescript SDK, [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand).

Get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

## Updating On-Chain Code

### 1. Updating Imports

Switchboard updates can be read from **PullFeedAccountData,** the account in which updates are stored after being pulled on-chain.&#x20;

#### Chainlink

```rust
use chainlink_solana as chainlink;
```

#### Switchboard

```rust
use switchboard_on_demand::on_demand::accounts::pull_feed::PullFeedAccountData;
```

### 2. Updating Accounts&#x20;

Ingesting data will now require a Feed account to be read. You can update the instruction accounts to use Switchboard.

#### Chainlink

```rust
#[derive(Accounts)]
pub struct Example<'info> {
    pub chainlink_feed: AccountInfo<'info>,
    pub chainlink_program: AccountInfo<'info>
}
```

#### Switchboard

```rust
#[derive(Accounts)]
pub struct Example<'info> {
    pub feed: AccountInfo<'info>,
}
```

### 3. Reading Updates

Reading updates using Switchboard is pretty similar using Anchor.&#x20;

#### Chainlink

```rust
#[account]
pub struct Decimal {
    pub value: i128,
    pub decimals: u32,
}

impl Decimal {
    pub fn new(value: i128, decimals: u32) -> Self {
        Decimal { value, decimals }
    }
}

pub fn execute(ctx: Context<Example>) -> Result<()>  {
  let round = chainlink::latest_round_data(
    ctx.accounts.chainlink_program.to_account_info(),
    ctx.accounts.chainlink_feed.to_account_info(),
  )?;

  let description = chainlink::description(
    ctx.accounts.chainlink_program.to_account_info(),
    ctx.accounts.chainlink_feed.to_account_info(),
  )?;

  let decimals = chainlink::decimals(
    ctx.accounts.chainlink_program.to_account_info(),
    ctx.accounts.chainlink_feed.to_account_info(),
  )?;
  
  // write the latest price to the program output
  let decimal_print = Decimal::new(round.answer, u32::from(decimals));
  msg!("{} price is {}", description, decimal_print);
  Ok(())
}
```

#### Switchboard

```rust
pub fn example(ctx: Context<Example>) -> Result<()> {
    let price_update = &mut ctx.accounts.feed;
    let feed_id: [u8; 32] = get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
    // Get the value, a https://docs.rs/rust_decimal/latest/rust_decimal/struct.Decimal.html
    let price = feed.value();
    // Log the Decimal Value
    msg!("price: {:?}", price);
    Ok(())
}
```

## Updating Off-chain Code

The chainlink network pushes updates for a limited number of data feeds at a constant rate. This is done by pushing updates when it's relevant&#x20;

### Step 1: Updating Imports

Switchboard has an on-demand ts-sdk for interacting with oracles and updating Solana feeds. You can import it with the following:

#### **Chainlink**

```typescript
import { OCR2Feed } from "@chainlink/solana-sdk";
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

Since Chainlink uses the push model, they don't require a query for update data.

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

When doing a transaction using Chainlink, you'd pass in some accounts related to the feeds you're using. With Switchboard, you can slip in an update instruction right before the instruction using your business logic and get the latest update for any data feed.&#x20;

#### Chainlink

```typescript
// ... 

// https://github.com/smartcontractkit/solana-starter-kit/blob/main/client.js
const CHAINLINK_PROGRAM_ID = "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny";
const DIVISOR = 100000000;
const CHAINLINK_FEED = "99B2bTijsU6f1GCT73HmdR7HCFFjGMBcPZY6jZ96ynrR";

// create an account to store the price data
const priceFeedAccount = anchor.web3.Keypair.generate();

// ... anchor program setup ...

// execute the tx
let tx = await program.rpc.execute({
  accounts: {
    decimal: priceFeedAccount.publicKey,
    user: provider.wallet.publicKey,
    chainlinkFeed: CHAINLINK_FEED,
    chainlinkProgram: CHAINLINK_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId
  },
  options: { commitment: "confirmed" },
  signers: [priceFeedAccount],
});

// Done!
 
```

#### Switchboard

```typescript
// ... 

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
```

### Summing it up

The end result will be the execution of the update, followed by the execution of **myIx** (and here that's the execute instruction).&#x20;

