# Integrating on Eclipse

Switchboard integration on Eclipse functions similarly to Solana, with a few key differences, notably an extra parameter that needs to be passed.

#### Program ID

On Eclipse Devnet and Mainnet networks, the Switchboard Program ID is as follows: `SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv`

#### Getting Started

Begin with the process outlined in “[Integrating your Feed](part-3-integrating-your-feed/)”. When calling `fetchUpdateIx`, include the `network` and `chain` settings as parameters. This will route the requests to the appropriate Switchboard oracles and map the data back to the target chain (Eclipse).

```tsx
const provider = ...
// Load the Switchboard program
const program = await anchor.Program.at(
  "SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv",
  provider
);

// Get the Pull Feed - (pass in the feed pubkey)
const pullFeed = new PullFeed(program, new PublicKey(...));

// Get the update for the pull feed
const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({
  crossbarClient: crossbar,
  chain: "eclipse",
  network: "mainnet",
});

```
