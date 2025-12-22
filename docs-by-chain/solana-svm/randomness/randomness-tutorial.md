# Randomness Tutorial

> **Example Code**: The complete working example for this tutorial is available at [sb-on-demand-examples/solana/randomness/coin-flip](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/solana/randomness/coin-flip)

This tutorial demonstrates how to integrate **verifiable randomness** into your Solana program using Switchboard's commit-reveal pattern. You'll build a provably fair coin flip game.

## Why Verifiable Randomness?

On-chain randomness is hard. Naive approaches fail because:

- **Block hashes are predictable**: Validators can see future block data
- **Timestamps are manipulable**: Validators control block timestamps
- **External sources are untrusted**: Off-chain randomness can be faked

Switchboard solves this with a **commit-reveal pattern** where neither party knows the outcome until after commitment.

## How It Works

```
1. COMMIT    →    2. GENERATE    →    3. REVEAL
   Player            Oracle             Settlement
   commits to        generates          Player reveals
   slothash          randomness         and uses value
```

1. **Commit**: Player commits to using a specific Solana slothash
2. **Generate**: Oracle generates randomness based on the committed slot
3. **Reveal**: Player reveals the randomness and uses it in their program

This is secure because:
- The player commits before knowing the randomness
- The oracle generates randomness after commitment
- Neither party can manipulate the outcome

## What You'll Build

A coin flip game where:
- Player guesses heads or tails
- Switchboard generates verifiable random outcome
- Winner receives double their wager

## Prerequisites

- Rust and Cargo installed
- Anchor framework 0.31.1
- Solana CLI installed and configured
- Node.js and pnpm
- A Solana keypair with SOL

## Key Concepts

### Randomness Account

A dedicated Solana account that stores:
- The committed slothash
- The seed slot
- The revealed random value (after revelation)

```typescript
const [randomness, createIx] = await sb.Randomness.create(sbProgram, rngKp, queue);
```

### RandomnessAccountData

The on-chain struct for parsing randomness state:

```rust
use switchboard_on_demand::accounts::RandomnessAccountData;

let randomness_data = RandomnessAccountData::parse(
    ctx.accounts.randomness_account_data.data.borrow()
).unwrap();
```

### Slot-Based Freshness

Randomness must be used within a specific slot window:

```rust
// Ensure randomness was committed in the previous slot
if randomness_data.seed_slot != clock.slot - 1 {
    return Err(ErrorCode::RandomnessExpired.into());
}
```

### Collateral on Commit (Critical!)

**Always take payment when committing, not when revealing.**

```rust
// CORRECT: Take collateral at commit time
pub fn coin_flip(ctx: Context<CoinFlip>, ...) -> Result<()> {
    // Validate randomness...

    // Take wager NOW, before randomness is revealed
    transfer(from_user, to_escrow, wager)?;

    Ok(())
}
```

Why? If you take payment on reveal, a malicious user could:
1. Commit to randomness
2. Wait for reveal
3. Only reveal if they won (selective revelation attack)

## The On-Chain Program

### Dependencies

```toml
[dependencies]
anchor-lang = "0.31.1"
switchboard-on-demand = "0.9.2"
```

### Program Structure

```rust
use anchor_lang::prelude::*;
use switchboard_on_demand::accounts::RandomnessAccountData;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod sb_randomness {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let player_state = &mut ctx.accounts.player_state;
        player_state.latest_flip_result = false;
        player_state.randomness_account = Pubkey::default();
        player_state.wager = 100; // lamports
        player_state.bump = ctx.bumps.player_state;
        player_state.allowed_user = ctx.accounts.user.key();
        Ok(())
    }

    pub fn coin_flip(
        ctx: Context<CoinFlip>,
        randomness_account: Pubkey,
        guess: bool, // true = heads, false = tails
    ) -> Result<()> {
        let clock = Clock::get()?;
        let player_state = &mut ctx.accounts.player_state;

        // Record the user's guess
        player_state.current_guess = guess;

        // Parse the randomness account
        let randomness_data = RandomnessAccountData::parse(
            ctx.accounts.randomness_account_data.data.borrow()
        ).unwrap();

        // SECURITY: Verify randomness is fresh (committed in previous slot)
        if randomness_data.seed_slot != clock.slot - 1 {
            msg!("seed_slot: {}", randomness_data.seed_slot);
            msg!("current slot: {}", clock.slot);
            return Err(ErrorCode::RandomnessExpired.into());
        }

        // SECURITY: Ensure randomness hasn't been revealed yet
        if !randomness_data.get_value(clock.slot).is_err() {
            return Err(ErrorCode::RandomnessAlreadyRevealed.into());
        }

        // Store commit slot for later verification
        player_state.commit_slot = randomness_data.seed_slot;

        // CRITICAL: Take collateral NOW, not on reveal!
        transfer(
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            player_state.wager,
            None,
        )?;

        // Store randomness account reference
        player_state.randomness_account = randomness_account;

        msg!("Coin flip initiated, randomness requested.");
        Ok(())
    }

    pub fn settle_flip(ctx: Context<SettleFlip>, escrow_bump: u8) -> Result<()> {
        let clock = Clock::get()?;
        let player_state = &mut ctx.accounts.player_state;

        // SECURITY: Verify randomness account matches stored reference
        if ctx.accounts.randomness_account_data.key() != player_state.randomness_account {
            return Err(ErrorCode::InvalidRandomnessAccount.into());
        }

        // Parse randomness data
        let randomness_data = RandomnessAccountData::parse(
            ctx.accounts.randomness_account_data.data.borrow()
        ).unwrap();

        // SECURITY: Verify seed_slot matches commit
        if randomness_data.seed_slot != player_state.commit_slot {
            return Err(ErrorCode::RandomnessExpired.into());
        }

        // Get the revealed random value
        let revealed_random_value = randomness_data
            .get_value(clock.slot)
            .map_err(|_| ErrorCode::RandomnessNotResolved)?;

        // Use randomness to determine outcome
        // Even = heads (true), Odd = tails (false)
        let randomness_result = revealed_random_value[0] % 2 == 0;

        player_state.latest_flip_result = randomness_result;

        if randomness_result {
            msg!("FLIP_RESULT: Heads");
        } else {
            msg!("FLIP_RESULT: Tails");
        }

        // Settle the wager
        if randomness_result == player_state.current_guess {
            msg!("You win!");
            // Pay out double the wager
            let seeds = &[b"stateEscrow".as_ref(), &[escrow_bump]];
            transfer(
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
                ctx.accounts.user.to_account_info(),
                player_state.wager * 2,
                Some(&[seeds]),
            )?;
        } else {
            msg!("You lose!");
            // Escrow keeps the wager
        }

        Ok(())
    }
}
```

### Account Structures

```rust
#[account]
pub struct PlayerState {
    allowed_user: Pubkey,        // Who can play
    latest_flip_result: bool,    // Last flip outcome
    randomness_account: Pubkey,  // Reference to Switchboard randomness
    current_guess: bool,         // Player's guess
    wager: u64,                  // Bet amount
    bump: u8,                    // PDA bump
    commit_slot: u64,            // Slot when committed
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        seeds = [b"playerState", user.key().as_ref()],
        space = 8 + 100,
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CoinFlip<'info> {
    #[account(
        mut,
        seeds = [b"playerState", user.key().as_ref()],
        bump = player_state.bump
    )]
    pub player_state: Account<'info, PlayerState>,
    pub user: Signer<'info>,
    /// CHECK: Validated manually in handler
    pub randomness_account_data: AccountInfo<'info>,
    /// CHECK: Escrow PDA
    #[account(mut, seeds = [b"stateEscrow"], bump)]
    pub escrow_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleFlip<'info> {
    #[account(
        mut,
        seeds = [b"playerState", user.key().as_ref()],
        bump = player_state.bump
    )]
    pub player_state: Account<'info, PlayerState>,
    /// CHECK: Validated manually in handler
    pub randomness_account_data: AccountInfo<'info>,
    /// CHECK: Escrow PDA
    #[account(mut, seeds = [b"stateEscrow"], bump)]
    pub escrow_account: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access attempt.")]
    Unauthorized,
    #[msg("Game is still active.")]
    GameStillActive,
    #[msg("Not enough funds to play.")]
    NotEnoughFundsToPlay,
    #[msg("Randomness already revealed.")]
    RandomnessAlreadyRevealed,
    #[msg("Randomness not yet resolved.")]
    RandomnessNotResolved,
    #[msg("Randomness has expired.")]
    RandomnessExpired,
    #[msg("Invalid randomness account.")]
    InvalidRandomnessAccount,
}
```

## The TypeScript Client

### Setup

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";

async function main() {
  // Load environment
  const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();

  // Get the default Switchboard queue
  const queue = await sb.getDefaultQueue(connection.rpcEndpoint);

  // Load your program
  const myProgram = await loadMyProgram(program.provider);
  const sbProgram = await loadSbProgram(program.provider);
}
```

### Create Randomness Account

```typescript
// Generate keypair for randomness account
const rngKp = Keypair.generate();

// Create the randomness account
const [randomness, createIx] = await sb.Randomness.create(sbProgram, rngKp, queue);

// Send creation transaction
const createTx = await sb.asV0Tx({
  connection,
  ixs: [createIx],
  payer: keypair.publicKey,
  signers: [keypair, rngKp],
  computeUnitPrice: 75_000,
  computeUnitLimitMultiple: 1.3,
});

await connection.sendTransaction(createTx);
```

### Commit Phase

```typescript
// Get user's guess from command line
const userGuess = process.argv[2] === "heads"; // true = heads

// Create commit instruction
const commitIx = await randomness.commitIx(queue);

// Create your program's coin flip instruction
const coinFlipIx = await myProgram.methods
  .coinFlip(rngKp.publicKey, userGuess)
  .accounts({
    playerState: playerStateAccount,
    user: keypair.publicKey,
    randomnessAccountData: rngKp.publicKey,
    escrowAccount: escrowAccount,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

// Bundle commit + coin_flip in same transaction
const commitTx = await sb.asV0Tx({
  connection,
  ixs: [commitIx, coinFlipIx],
  payer: keypair.publicKey,
  signers: [keypair],
  computeUnitPrice: 75_000,
  computeUnitLimitMultiple: 1.3,
});

const commitSig = await connection.sendTransaction(commitTx);
await connection.confirmTransaction(commitSig, "confirmed");
console.log("Committed! Transaction:", commitSig);
```

### Reveal Phase

```typescript
// Wait for slot to advance
console.log("Waiting for randomness generation...");
await new Promise(resolve => setTimeout(resolve, 3000));

// Create reveal instruction
const revealIx = await randomness.revealIx();

// Create your program's settle instruction
const settleFlipIx = await myProgram.methods
  .settleFlip(escrowBump)
  .accounts({
    playerState: playerStateAccount,
    randomnessAccountData: rngKp.publicKey,
    escrowAccount: escrowAccount,
    user: keypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

// Bundle reveal + settle in same transaction
const revealTx = await sb.asV0Tx({
  connection,
  ixs: [revealIx, settleFlipIx],
  payer: keypair.publicKey,
  signers: [keypair],
  computeUnitPrice: 75_000,
  computeUnitLimitMultiple: 1.3,
});

const revealSig = await connection.sendTransaction(revealTx);
await connection.confirmTransaction(revealSig, "confirmed");
console.log("Revealed! Transaction:", revealSig);

// Parse result from logs
const tx = await connection.getParsedTransaction(revealSig, {
  maxSupportedTransactionVersion: 0,
});
const resultLog = tx?.meta?.logMessages?.find(line =>
  line.includes("FLIP_RESULT")
);
console.log("Result:", resultLog);
```

### Retry Logic

Network issues can cause commit/reveal to fail. Add retry logic:

```typescript
async function retryCommit(
  randomness: sb.Randomness,
  queue: any,
  maxRetries = 3
): Promise<anchor.web3.TransactionInstruction> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Commit attempt ${attempt}/${maxRetries}...`);
      return await randomness.commitIx(queue);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Failed, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("All commit attempts failed");
}

async function retryReveal(
  randomness: sb.Randomness,
  maxRetries = 5
): Promise<anchor.web3.TransactionInstruction> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Reveal attempt ${attempt}/${maxRetries}...`);
      return await randomness.revealIx();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Failed, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("All reveal attempts failed");
}
```

## Running the Example

### 1. Clone the Repository

```bash
git clone https://github.com/switchboard-xyz/sb-on-demand-examples
cd sb-on-demand-examples/solana
```

### 2. Build the Program

```bash
anchor build
```

### 3. Update Program ID

Get your program address:
```bash
anchor keys list
```

Update `lib.rs`:
```rust
declare_id!("YOUR_PROGRAM_ADDRESS");
```

Rebuild:
```bash
anchor build
```

### 4. Deploy

```bash
anchor deploy
anchor idl init --filepath target/idl/sb_randomness.json YOUR_PROGRAM_ADDRESS
```

### 5. Install Dependencies

```bash
cd examples/randomness
pnpm install
```

### 6. Play!

```bash
pnpm start heads
# or
pnpm start tails
```

### Expected Output

```
Setup...
Program 93tkpep2PYDxweHHi2vQBpi7eTBF23y8LGdiLMt5R9f2
Queue account FdRnYujMnYbAJp5P2rkEYZCbF2TKs2D2yXZ7MYq89Hms

Initialize the game states...
  Transaction Signature abc123...

Commit to randomness...
  Transaction Signature commitTx def456...

Reveal the randomness...
  Transaction Signature revealTx ghi789...

Your guess is Heads

And the random result is ... Heads!
You win!

Game completed!
```

## Security Best Practices

### 1. Always Take Collateral at Commit Time

```rust
// CORRECT
pub fn coin_flip(...) -> Result<()> {
    // ... validate randomness ...
    transfer(user, escrow, wager)?;  // Take payment HERE
    Ok(())
}

// WRONG - vulnerable to selective revelation
pub fn settle_flip(...) -> Result<()> {
    transfer(user, escrow, wager)?;  // DON'T take payment here!
    // ... use randomness ...
}
```

### 2. Validate Slot Freshness

```rust
// Ensure randomness was committed recently
if randomness_data.seed_slot != clock.slot - 1 {
    return Err(ErrorCode::RandomnessExpired.into());
}
```

### 3. Verify Randomness Account Reference

```rust
// Store at commit time
player_state.randomness_account = randomness_account;

// Verify at reveal time
if ctx.accounts.randomness_account_data.key() != player_state.randomness_account {
    return Err(ErrorCode::InvalidRandomnessAccount.into());
}
```

### 4. Check Randomness Not Already Revealed

```rust
// At commit time, ensure randomness isn't already revealed
if !randomness_data.get_value(clock.slot).is_err() {
    return Err(ErrorCode::RandomnessAlreadyRevealed.into());
}
```

## Use Cases

### Gaming & Gambling
- Casino games (dice, slots, roulette)
- Provably fair betting
- Skill-based games with random elements

### NFT Minting
- Random trait assignment
- Fair rarity distribution
- Blind box reveals

### Lotteries
- Ticket drawing
- Raffle winners
- Prize distribution

### Fair Distribution
- Airdrop selection
- Whitelist randomization
- Token allocation

## Advanced Topics

### Reusing Randomness Accounts

Save the keypair to reuse across sessions:

```typescript
import * as fs from "fs";

const KEYPAIR_PATH = "randomness-keypair.json";

// Load or create
let rngKp: Keypair;
if (fs.existsSync(KEYPAIR_PATH)) {
  const data = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf8"));
  rngKp = Keypair.fromSecretKey(new Uint8Array(data));
} else {
  rngKp = Keypair.generate();
  fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(rngKp.secretKey)));
}
```

### Multiple Random Values

The revealed value is 32 bytes. Use different bytes for different outcomes:

```rust
let random_bytes = randomness_data.get_value(clock.slot)?;

// Use different bytes for different purposes
let coin_flip = random_bytes[0] % 2 == 0;
let dice_roll = (random_bytes[1] % 6) + 1;  // 1-6
let card_draw = random_bytes[2] % 52;       // 0-51
```

## Next Steps

- **Price Feeds**: Learn oracle integration in [Basic Price Feed](price-feeds/basic-price-feed.md)
- **Prediction Markets**: See feed verification in [Prediction Market](prediction-market.md)
- **Custom Feeds**: Create your own feeds in [Custom Feeds](../../../custom-feeds/README.md)
