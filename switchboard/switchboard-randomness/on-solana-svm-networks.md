---
description: Randomness walkthrough on Solana
---

# On Solana / SVM Networks

### Prerequisites.. <a href="#prerequisites" id="prerequisites"></a>

The standard stuff, assuming you already have your anchor dev enironment setup!

* **Node.js & npm**:
* **Anchor Framework**:
* **Solana CLI**

The magic stuff..

* For your anchor project

`cargo add switchboard-on-demand`

* For your typescript client

`npm i @switchboard-xyz/on-demand`

### Step 1: Spinning the Wheel of Randomness in Your Solana Program <a href="#step-1-spinning-the-wheel-of-randomness-in-your-solana-program" id="step-1-spinning-the-wheel-of-randomness-in-your-solana-program"></a>

Integrating randomness into your Solana program is akin to consulting an oracle - mysterious yet straightforward. Here’s how you infuse your Solana program with a dash of unpredictability

1. 1.**Define the Randomness Account:** First, ensure your program knows about the randomness account. This account is your gateway to the oracle’s wisdom. In your program's context, it looks something like this:

```rust
#[account]
pub struct PlayerState {
    allowed_user: Pubkey,
    latest_flip_result: bool, // Stores the result of the latest flip
    randomness_account: Pubkey, // Reference to the Switchboard randomness account
    current_guess: bool, // The current guess
    wager: u64, // The wager amount
    bump: u8,
}
```

1. 2.**Summon the Oracle’s Power:** When it's time to flip the coin, you commit to using a future slot's hash as your seed, essentially asking the oracle to predict the flip's outcome at that future moment. This randomness account that represents this needs to be stored and updated. The `coin_flip` function makes this commitment:

```rust
pub fn coin_flip(ctx: Context<CoinFlip>, randomness_account: Pubkey, guess: bool) -> Result<()> {
    ...
    // Update the randomness account seed_slot you are committing to
    let randomness_data = RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();
    if randomness_data.seed_slot != clock.slot - 1 {
            msg!("seed_slot: {}", randomness_data.seed_slot);
            msg!("slot: {}", clock.slot);
            return Err(ErrorCode::RandomnessAlreadyRevealed.into());
    }
    // ***
    // IMPORTANT: Remember, in Switchboard Randomness, it's the responsibility of the caller to reveal the randomness.
    // Therefore, the game collateral MUST be taken upon randomness request, not on reveal.
    // ***
    transfer(
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.user.to_account_info(),  // Include the user_account
            ctx.accounts.escrow_account.to_account_info(),
            player_state.wager,
            None,
        )?;

    // Store flip commitment to the future slot byt referencing the randomness account
    player_state.randomness_account = randomness_account;
    ...
}
```

1. 3.**Reveal the Oracle's Vision:** Once the future becomes the present, and the slot arrives, you ask the oracle to reveal its prediction - the result of the coin flip. The `settle_flip` function is where the magic unfolds:

```rust
pub fn settle_flip(ctx: Context<SettleFlip>) -> Result<()> {
    ...
    // Parsing the oracle's scroll
    // call the switchboard on-demand parse function to get the randomness data
    let randomness_data = RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();
    // call the switchboard on-demand get_value function to get the revealed random value
    let revealed_random_value = randomness_data.get_value(&clock)
        .map_err(|_| ErrorCode::RandomnessNotResolved)?;
    ...
}
```

## Step 2: Conjuring Randomness with a TypeScript Client

On the client side, engaging with the oracle isn't just about hitting the right keys—it's about knowing the secret handshake. Let's walk through the TypeScript moves to make the oracle dance:

1. **Setup and Environment Configuration:** Start by setting up your environment, ensuring you have access to the Solana network and the Switchboard program. You'll need the program IDs for both your Coin Flip game and the Switchboard Queue and On-demand program.

```typescript
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
  const sbIdl = await anchor.Program.fetchIdl(sbProgramId, provider);
  const sbProgram = new anchor.Program(sbIdl!, sbProgramId, provider);
  const queueAccount = new Queue(sbProgram, sbQueue);

  // setup
  const path = "sb-randomness/target/deploy/sb_randomness-keypair.json";
  const [_, myProgramKeypair] = await AnchorUtils.initWalletFromFile(path);
  const coinFlipProgramId = myProgramKeypair.publicKey;
  const coinFlipProgram = await myAnchorProgram(provider, coinFlipProgramId);
...

```

2. **Creating a Randomness Account:** Before flipping the coin, you must prepare a randomness account. This account is how you communicate your request to the oracle.

<pre class="language-typescript"><code class="lang-typescript"><strong>const rngKp = Keypair.generate();
</strong>const [randomness, ix] = await Randomness.create(sbProgram, rngKp, sbQueue);
</code></pre>

3. **Committing to Randomness:** With your randomness account at the ready, commit to the oracle's prediction. This is where you formally ask for the outcome based on a future slot.

```typescript
const commitIx = await randomness.commitIx(sbQueue);
// Add this instruction to your coinFlip transaction and send it
```

4. **Revealing the Oracle’s Wisdom:** After the slot passes, you ask the oracle to reveal its prediction. The response determines the fate of your coin flip.

```typescript
const revealIx = await randomness.revealIx();
// Execute the reveal instruction, followed by your program's settle_flip function
```

Note: as an added extra, you can save the `revealIx()`transaction for later use, using this neat command

```typescript
      randomness.serializeIxToFile(
        [revealIx, settleFlipIx],
        "serializedIx.bin"
      );
```

5.  **Settling the Flip:** Finally, call your Solana program's `settle_flip` function to officially record the coin flip result based on the oracle's revealed randomness.

    ```typescript
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

And there you have it! You've just taken your first leap into the realm of randomness, flipping a coin with the finesse of a digital magician. With Switchboard's Randomness On-Demand, you're now equipped to bring the element of surprise into any Solana project. Who knew uncertainty could be so reliable? [😊](https://emojipedia.org/smiling-face-with-smiling-eyes)

This example repo can be found [here](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sb-randomness-on-demand).
