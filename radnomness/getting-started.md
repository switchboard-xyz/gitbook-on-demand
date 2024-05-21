# Getting Started



Today, we're embarking on a thrilling journey to harness the power of randomness. Whether you're flipping coins or making more complex decisions, let's make unpredictability your ally!

### The Coin Flip Game <a href="#the-coin-flip-game" id="the-coin-flip-game"></a>

Today, we're diving into a project that embodies the essence of unpredictability: a Coin Flip program powered by Switchboard's Randomness On-Demand feature. This guide will walk you through setting up a simple yet powerful example, showing you how easy it is to integrate verifiable randomness into your Solana applications.

### Prerequisites.. <a href="#prerequisites" id="prerequisites"></a>

The standard stuff, assuming you already have your anchor dev enironment setup!

* **Node.js & npm**:
* **Anchor Framework**:
* **Solana CLI**

The magic stuff..

* For your anchor project

cargo add switchboard-on-demand

* For your typescript client

npm i @switchboard-xyz/on-demand

### Step 1: Spinning the Wheel of Randomness in Your Solana Program <a href="#step-1-spinning-the-wheel-of-randomness-in-your-solana-program" id="step-1-spinning-the-wheel-of-randomness-in-your-solana-program"></a>

Integrating randomness into your Solana program is akin to consulting an oracle - mysterious yet straightforward. Here’s how you infuse your Solana program with a dash of unpredictability

1. 1.**Define the Randomness Account:** First, ensure your program knows about the randomness account. This account is your gateway to the oracle’s wisdom. In your program's context, it looks something like this:

\#\[account]pub struct PlayerState {allowed\_user: Pubkey,latest\_flip\_result: bool, // Stores the result of the latest fliprandomness\_account: Pubkey, // Reference to the Switchboard randomness accountcurrent\_guess: bool, // The current guesswager: u64, // The wager amountbump: u8,}\`\`\`

1. 2.**Summon the Oracle’s Power:** When it's time to flip the coin, you commit to using a future slot's hash as your seed, essentially asking the oracle to predict the flip's outcome at that future moment. This randomness account that represents this needs to be stored and updated. The `coin_flip` function makes this commitment:

pub fn coin\_flip(ctx: Context\<CoinFlip>, randomness\_account: Pubkey, guess: bool) -> Result<()> {...// Update the randomness account seed\_slot you are committing tolet randomness\_data = RandomnessAccountData::parse(ctx.accounts.randomness\_account\_data.data.borrow()).unwrap();if randomness\_data.seed\_slot != clock.slot - 1 {msg!("seed\_slot: {}", randomness\_data.seed\_slot);msg!("slot: {}", clock.slot);return Err(ErrorCode::RandomnessAlreadyRevealed.into());}// \*\*\*// IMPORTANT: Remember, in Switchboard Randomness, it's the responsibility of the caller to reveal the randomness.// Therefore, the game collateral MUST be taken upon randomness request, not on reveal.// \*\*\*transfer(ctx.accounts.system\_program.to\_account\_info(),ctx.accounts.user.to\_account\_info(), // Include the user\_accountctx.accounts.escrow\_account.to\_account\_info(),player\_state.wager,None,)?;​// Store flip commitment to the future slot byt referencing the randomness accountplayer\_state.randomness\_account = randomness\_account;...}

1. 3.**Reveal the Oracle's Vision:** Once the future becomes the present, and the slot arrives, you ask the oracle to reveal its prediction - the result of the coin flip. The `settle_flip` function is where the magic unfolds:

pub fn settle\_flip(ctx: Context\<SettleFlip>) -> Result<()> {...// Parsing the oracle's scroll// call the switchboard on-demand parse function to get the randomness datalet randomness\_data = RandomnessAccountData::parse(ctx.accounts.randomness\_account\_data.data.borrow()).unwrap();// call the switchboard on-demand get\_value function to get the revealed random valuelet revealed\_random\_value = randomness\_data.get\_value(\&clock).map\_err(|\_| ErrorCode::RandomnessNotResolved)?;...}
