# Solana / SVM

## Switchboard Randomness for Solana and SVM applications

#### Prerequisites

* Basic understanding of Solana development and Anchor Framework.
* A working Solana development environment (Solana tool suite, Anchor).
* Solana CLI connected to the devnet.
* Enough SOL tokens for devnet transactions.

#### Tooling:

Install Switchboard On-Demand in your program.

```rust
cargo add switchboard-on-demand
```

Install Switchboard On-Demand in your Javascript Client file:

```rust
npm i @switchboard-xyz/on-demand
```

#### Step 1: Coin Flip Program (Solana)

1.  **Define the Player State**

    Make sure to store the user's randomness\_account in your program.

    ```rust
    #[account]
    pub struct PlayerState {
        allowed_user: Pubkey,
        latest_flip_result: bool,
        randomness_account: Pubkey,
        current_guess: bool,
        wager: u64,
        bump: u8,
    }
    ```

*   **Commit to a Future Slot**

    Commit to the game by locking the `randomness_account`.

    ```rust
    pub fn coin_flip(ctx: Context<CoinFlip>, randomness_account: Pubkey, guess: bool) -> Result<()> {
        // Load clock to check data from the future        
        let clock = Clock::get()?;
        // Update player_state's randomness_account
        let randomness_data = RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();    
        if randomness_data.seed_slot != clock.slot - 1 {
            msg!("seed_slot: {}", randomness_data.seed_slot);
            msg!("slot: {}", clock.slot);
            return Err(ErrorCode::RandomnessAlreadyRevealed.into());
        }

        // **IMPORTANT**:
        // Remember in Switchboard Randomness, game collateral MUST be taken upon randomness request, not on reveal.
        // ***
        transfer(
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            player_state.wager,
            None,
        )?;

        // Store flip commitment to the future slot byt referencing the randomness account
        player_state.randomness_account = randomness_account;
    }
    ```
*   **Settle the Flip**

    Resolve randomness through the `settle_flip` function.

    ```rust
    pub fn settle_flip(ctx: Context<SettleFlip>) -> Result<()> {
        // Load clock to check data from the future
        let clock = Clock::get()?;

        // Parsing the oracle's scroll Call the switchboard on-demand parse function to get the randomness data
        let randomness_data = RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();
        
        // Call the switchboard on-demand get_value function to get the revealed random value
        let revealed_random_value = randomness_data.get_value(&clock)
            .map_err(|_| ErrorCode::RandomnessNotResolved)?;
    }
    ```

#### Step 2: TypeScript Client

1. Setup and Environment Configuration:

```rust
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AnchorUtils,
  InstructionUtils,
  Queue,
  Randomness,
  SB_ON_DEMAND_PID,
  sleep,
} from "@switchboard-xyz/on-demand";
import dotenv from "dotenv";
import * as fs from "fs";
import reader from "readline-sync";

(async function () {
  dotenv.config();
  console.clear();
  
  const { keypair, connection, provider, wallet } = await AnchorUtils.loadEnv();
  const payer = wallet.payer;
  // Switchboard sbQueue fixed
  const sbQueue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
  const sbProgramId = SB_ON_DEMAND_PID;
  const sbProgram = await anchor.Program.at(sbProgramId, sbProgramId, provider);
  const queueAccount = new Queue(sbProgram, sbQueue);

  // setup
  const path = "sb-randomness/target/deploy/sb_randomness-keypair.json";
  
  const [_, myProgramKeypair] = await AnchorUtils.initWalletFromFile(path);
  const coinFlipProgramId = myProgramKeypair.publicKey;
  const coinFlipProgram = await myAnchorProgram(provider, coinFlipProgramId);
```

1. Creating a Randomness Account: Before flipping that coin, start with a clean `randomness` account.

```rust
const rngKp = Keypair.generate();
const [randomness, ix] = await Randomness.create(sbProgram, rngKp, sbQueue);
```

1. Committing to Randomness: Use randomness account to commit to the oracle.

```rust
const commitIx = await randomness.commitIx(sbQueue);
// Add this instruction to your coinFlip transaction and send it
```

1. Revealing the Vision: Once the slot is generated, invoke to generate randomness for the committed slot.

```rust
const revealIx = await randomness.revealIx();
// Execute the reveal instruction, followed by your program's settle_flip function
```

Note: here is an optional way to save the `revealIx()`transaction .

```rust
randomness.serializeIxToFile(
  [revealIx, SettleFlipIx],
  "serializedIx.bin"
);
```

1. Settling the Flip: Finally, record the coin flip in the randomness account.

```rust
const settleFlipIx = await coinFlipProgram.instruction.settleFlip(
    escrowBump,
    {
      accounts: {
        playerState: playerStateAccount,
        randomnessAccountData: randomness.pubkey,
        escrowAccount: escrowAccount,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    }
  );
// Add the revealIx and this instruction together and execute
```

You've just integrated randomness into your Solana application.

For more details, refer to the example [repository](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sb-randomness-on-demand)
