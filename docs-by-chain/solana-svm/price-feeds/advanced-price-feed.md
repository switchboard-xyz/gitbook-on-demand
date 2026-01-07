# Advanced Price Feed

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/feeds/advanced](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/feeds/advanced)

This tutorial demonstrates how to build an ultra-optimized Switchboard oracle integration using the Pinocchio framework, achieving **~90% reduction in compute units** compared to the basic Anchor implementation.

## Why Optimize Compute Units?

On Solana, **compute units directly impact transaction costs**. Every CU saved means lower fees for your users and operators. This matters especially for:

- **High-frequency oracle updates**: If you're cranking prices every few seconds, those CUs add up fast
- **Production DeFi protocols**: Lower costs improve margins and user experience
- **MEV-sensitive operations**: Smaller, faster transactions have competitive advantages

| Metric | Basic (Anchor) | Advanced (Pinocchio) | Savings |
|--------|----------------|----------------------|---------|
| Compute Units | ~2,000 CU | ~190 CU | **~90%** |
| Framework Overhead | High | Minimal | - |
| Transaction Size | Standard | Optimized with LUTs | ~90% |

## What You'll Build

An ultra-optimized oracle program with:
- **Admin authorization** for trusted crankers
- **Four modular instructions**: init_state, init_oracle, crank, read
- **Direct oracle writes** bypassing expensive verification (for authorized users)
- **QuoteVerifier** for secure reads with staleness checks

## Prerequisites

- Completed the [Basic Price Feed](basic-price-feed.md) tutorial
- Rust and Cargo installed
- Familiarity with Pinocchio framework concepts
- Solana CLI installed and configured
- A Solana keypair with SOL

## Key Concepts

### Pinocchio Framework

[Pinocchio](https://github.com/febo/pinocchio) is a zero-abstraction Solana program framework that provides:
- Direct syscall access without runtime overhead
- Zero-allocation account parsing
- `#[inline(always)]` instruction dispatch
- ~100 CU framework overhead vs ~2,000 CU for Anchor

### Admin Authorization Pattern

Instead of verifying every oracle update cryptographically (expensive), this pattern:
1. Stores an authorized signer in a **state account**
2. Only allows that signer to write oracle data
3. Uses `write_from_ix_unchecked` for direct writes

This trades decentralization for efficiency—suitable when you control the cranker.

### Modular Account Initialization

The program separates account creation into dedicated instructions:
- `init_state`: Creates the authorization state account
- `init_oracle`: Creates the quote storage account

This allows conditional initialization only when needed.

## The On-Chain Program

### Program Structure

```rust
use pinocchio::{entrypoint, msg, ProgramResult};
use switchboard_on_demand::{
    QuoteVerifier, check_pubkey_eq, OracleQuote, Instructions, get_slot
};
use pinocchio::account_info::AccountInfo;
use pinocchio::program_error::ProgramError;
use pinocchio::pubkey::Pubkey;

mod utils;
use utils::{init_quote_account_if_needed, init_state_account_if_needed};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    match instruction_data[0] {
        0 => crank(program_id, accounts)?,    // Write oracle data
        1 => read(program_id, accounts)?,     // Read and verify
        2 => init_state(program_id, accounts)?, // Initialize state
        3 => init_oracle(program_id, accounts)?, // Initialize oracle account
        _ => return Err(ProgramError::InvalidInstructionData),
    }
    Ok(())
}
```

The instruction discriminator is a single byte—no Anchor discriminator overhead.

### Instruction 0: `crank`

The crank instruction writes oracle data for authorized signers:

```rust
pub fn crank(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let [quote, queue, state, payer, instructions_sysvar, _clock_sysvar]: &[AccountInfo; 6] =
        accounts.try_into().map_err(|_| ProgramError::NotEnoughAccountKeys)?;

    // Validate state account belongs to this program
    if !is_state_account(state, program_id) {
        msg!("Invalid state account");
        return Err(ProgramError::Custom(2));
    }

    // Check payer matches authorized signer stored in state
    let state_data = unsafe { state.borrow_data_unchecked() };
    if !check_pubkey_eq(&state_data, payer.key()) {
        return Err(ProgramError::Custom(1)); // UnauthorizedSigner
    }

    // DANGER: Only use this if you trust the signer!
    // Bypasses cryptographic verification for speed
    OracleQuote::write_from_ix_unchecked(instructions_sysvar, quote, queue.key(), 0);

    Ok(())
}
```

**Key points:**
- Uses `borrow_data_unchecked` for zero-copy state access
- `write_from_ix_unchecked` directly writes oracle data without Ed25519 verification
- Only ~90 CU for the entire operation

### Instruction 1: `read`

The read instruction verifies and displays oracle data:

```rust
pub fn read(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let [quote, queue, clock_sysvar, slothashes_sysvar, instructions_sysvar]: &[AccountInfo; 5] =
        accounts.try_into().map_err(|_| ProgramError::NotEnoughAccountKeys)?;

    let slot = get_slot(clock_sysvar);

    // Verify the oracle data with staleness check
    let quote_data = QuoteVerifier::new()
        .slothash_sysvar(slothashes_sysvar)
        .ix_sysvar(instructions_sysvar)
        .clock_slot(slot)
        .queue(queue)
        .max_age(30)  // Reject data older than 30 slots (~12 seconds)
        .verify_account(quote)
        .unwrap();

    msg!("Quote slot: {}", quote_data.slot());

    // Display each feed's data
    for (index, feed_info) in quote_data.feeds().iter().enumerate() {
        msg!("Feed #{}: {}", index + 1, feed_info.hex_id());
        msg!("Value: {}", feed_info.value());
    }

    Ok(())
}
```

**Key points:**
- Uses `QuoteVerifier` for secure verification
- `max_age(30)` ensures data freshness (30 slots ≈ 12 seconds)
- Iterates through all feeds in the quote

### Instruction 2: `init_state`

Initializes the authorization state account:

```rust
pub fn init_state(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let [state, payer, system_program]: &[AccountInfo; 3] =
        accounts.try_into().map_err(|_| ProgramError::NotEnoughAccountKeys)?;

    // Create the state account PDA
    init_state_account_if_needed(program_id, state, payer, system_program)?;

    // Store the authorized signer (payer becomes the admin)
    state.try_borrow_mut_data()?[..32].copy_from_slice(payer.key().as_ref());

    Ok(())
}
```

The state account stores a single 32-byte pubkey—the authorized cranker.

### Instruction 3: `init_oracle`

Initializes the oracle quote account:

```rust
pub fn init_oracle(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let [quote, queue, payer, system_program, instructions_sysvar]: &[AccountInfo; 5] =
        accounts.try_into().map_err(|_| ProgramError::NotEnoughAccountKeys)?;

    // Parse feed info from the Ed25519 instruction data
    let quote_data = Instructions::parse_ix_data_unverified(instructions_sysvar, 0)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    // Create the quote account as a PDA derived from queue + feed IDs
    init_quote_account_if_needed(
        program_id,
        quote,
        queue,
        payer,
        system_program,
        &quote_data,
    )?;

    Ok(())
}
```

## Account Initialization Helpers

The `utils.rs` module handles PDA derivation and account creation:

### Quote Account Initialization

```rust
pub const ORACLE_ACCOUNT_SIZE: usize = 8 + 32 + 1024; // discriminator + queue + data

pub fn init_quote_account_if_needed(
    program_id: &Pubkey,
    oracle_account: &AccountInfo,
    queue_account: &AccountInfo,
    payer: &AccountInfo,
    system_program: &AccountInfo,
    oracle_quote: &OracleQuote,
) -> Result<(), ProgramError> {
    // Skip if already initialized
    if oracle_account.lamports() != 0 {
        msg!("Oracle account already initialized");
        return Ok(());
    }

    // Derive PDA from queue + feed IDs
    let feed_ids = oracle_quote.feed_ids();
    let mut seeds: Vec<&[u8]> = Vec::with_capacity(feed_ids.len() + 1);
    seeds.push(queue_account.key().as_ref());
    for feed_id in &feed_ids {
        seeds.push(feed_id.as_ref());
    }

    let (canonical_address, bump) =
        pinocchio::pubkey::find_program_address(&seeds, program_id);

    if canonical_address != *oracle_account.key() {
        return Err(ProgramError::InvalidArgument);
    }

    // Create account via CPI to system program
    // ... (invoke_signed with seeds)
}
```

### State Account Initialization

```rust
pub const STATE_ACCOUNT_SIZE: usize = 32; // Single pubkey

pub fn init_state_account_if_needed(
    program_id: &Pubkey,
    state_account: &AccountInfo,
    payer: &AccountInfo,
    system_program: &AccountInfo,
) -> Result<(), ProgramError> {
    if state_account.lamports() != 0 {
        return Ok(());
    }

    // Derive PDA from "state" seed
    let (expected_key, bump) =
        pinocchio::pubkey::find_program_address(&[b"state"], program_id);

    if state_account.key() != &expected_key {
        return Err(ProgramError::InvalidArgument);
    }

    // Create account via CPI
    // ... (invoke_signed with ["state", bump] seeds)
}
```

## The TypeScript Client

The client handles initialization, quote fetching, and transaction building:

```typescript
import * as sb from "@switchboard-xyz/on-demand";
import { OracleQuote } from "@switchboard-xyz/on-demand";
import { PublicKey } from "@solana/web3.js";

const FEED_ID = "4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812";

async function main() {
  // Step 1: Load environment (auto-detects network)
  const { keypair, connection, crossbar, queue } = await sb.AnchorUtils.loadEnv();

  // Load your deployed program ID
  const advancedProgramId = new PublicKey("YOUR_PROGRAM_ID");

  // Step 2: Derive the canonical quote account
  // Note: includes program ID for program-owned accounts
  const [quoteAccount] = OracleQuote.getCanonicalPubkey(
    queue.pubkey,
    [FEED_ID],
    advancedProgramId  // Program ID for custom derivation
  );

  // Step 3: Fetch the Ed25519 quote instruction
  const quoteIx = await queue.fetchQuoteIx(crossbar, [FEED_ID], {
    variableOverrides: {},
    instructionIdx: 0,
  });

  // Step 4: Decode and inspect the quote
  const decodedQuote = OracleQuote.decode(quoteIx.data);
  console.log("Quote slot:", decodedQuote.slot.toString());
  console.log("Feeds:", decodedQuote.feeds.length);
  decodedQuote.feeds.forEach((feed, idx) => {
    console.log(`  Feed ${idx}: ${feed.value}`);
  });

  // Step 5: Check if accounts need initialization
  const [stateAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    advancedProgramId
  );

  const instructions = [quoteIx];

  // Add init_state if needed
  const stateInfo = await connection.getAccountInfo(stateAccount);
  if (!stateInfo) {
    instructions.push(createInitStateIx(advancedProgramId, keypair.publicKey));
  }

  // Add init_oracle if needed
  const quoteInfo = await connection.getAccountInfo(quoteAccount);
  if (!quoteInfo) {
    instructions.push(createInitOracleIx(
      advancedProgramId, quoteAccount, queue.pubkey, keypair.publicKey
    ));
  }

  // Step 6: Add crank and read instructions
  instructions.push(createCrankIx(
    advancedProgramId, quoteAccount, queue.pubkey, stateAccount, keypair.publicKey
  ));
  instructions.push(createReadIx(advancedProgramId, quoteAccount, queue.pubkey));

  // Step 7: Build V0 transaction with priority fees
  const tx = await sb.asV0Tx({
    connection,
    ixs: instructions,
    signers: [keypair],
    computeUnitPrice: 10_000,
    computeUnitLimitMultiple: 1.1,
  });

  // Step 8: Simulate and send
  const sim = await connection.simulateTransaction(tx);
  console.log(sim.value.logs?.join("\n"));

  if (!sim.value.err) {
    const sig = await connection.sendTransaction(tx);
    console.log("Transaction:", sig);
  }
}
```

## Running the Example

### 1. Clone the Examples Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/solana
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build and Deploy the Program

Unlike the basic example, the advanced program must be deployed:

```bash
# Build the Pinocchio program
cargo build-sbf --manifest-path programs/advanced-oracle-example/Cargo.toml

# Deploy to devnet
solana program deploy target/deploy/advanced_oracle_example.so
```

### 4. Run the Example

```bash
# Using default BTC/USD feed
npm run feeds:advanced

# Using a custom feed ID
npm run feeds:advanced -- --feedId=YOUR_FEED_ID
```

### Expected Output

```
Network detected: devnet
Queue selected: FdRnYujMnYbAJp5P2rkEYZCbF2TKs2D2yXZ7MYq89Hms
Quote Account (derived): 8Js7NsQ7sF3WLJN3JC4LJQGz8kHiEJwZ7sdGTtJC5J7d

Decoded Oracle Quote:
  Version: 1
  Slot: 298234567
  Feeds:
    Feed 0:
      Feed Hash: 4cd1cad962425681af07b9254b7d804de3ca3446fbfd1371bb258d2c75059812
      Value: 97234.5
      Min Oracle Samples: 3

State account already initialized
Quote account already initialized
Transaction instruction count: 3
  - Ed25519 verification
  - crank
  - read

Performance Stats - Min: 45ms | Median: 52ms | Mean: 54.3ms | Count: 1
Quote slot: 298234567
Feed #1: 4cd1cad...
Value: 97234.5
```

## When to Use This Pattern

Use the advanced pattern when:

| Scenario | Recommendation |
|----------|----------------|
| High-frequency cranking (sub-second) | Advanced |
| Compute-sensitive DeFi protocols | Advanced |
| You control the cranker infrastructure | Advanced |
| Learning / prototyping | Basic |
| Decentralized, trustless updates | Basic |
| Simple integrations | Basic |

## Security Considerations

### `write_from_ix_unchecked` Risks

This function bypasses cryptographic verification. Only use it when:

1. **You control the signer**: The authorized cranker is your infrastructure
2. **You trust all transaction accounts**: Malicious accounts could corrupt data
3. **You have external monitoring**: Detect and respond to anomalies

### Admin Authorization Trade-offs

| Aspect | Managed Updates (Basic) | Admin Auth (Advanced) |
|--------|-------------------------|----------------------|
| Trust Model | Trustless (cryptographic) | Trusted admin |
| Cost | Higher CU | ~90% lower CU |
| Decentralization | Anyone can update | Only admin |
| Security | Ed25519 verified | Admin key security |

### Recommendations

1. **Rotate admin keys** periodically
2. **Use multisig** for production admin accounts
3. **Monitor for anomalies** in oracle values
4. **Consider hybrid approaches**: Admin writes + periodic cryptographic verification

## Next Steps

- **Custom Feeds**: Learn to create custom data feeds in [Custom Feeds](../../../custom-feeds/README.md)
- **Multiple Feeds**: Batch multiple price feeds in a single transaction
- **Randomness**: Explore verifiable randomness in the [Randomness Tutorial](../randomness/README.md)
