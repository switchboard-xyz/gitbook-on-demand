---
description: Guide on integrating Switchboard on Eclipse
---

# Eclipse

Switchboard on Eclipse works the same way as it does on Solana, except you'll have to pass in an extra parameter and there are a few gotchas.&#x20;

## Program ID

On Eclipse Devnet and Mainnet networks, the Switchboard Program ID will be:

**SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv**

### Getting Started

Start from [integrating-on-chain-svm.md](integrating-on-chain-svm.md "mention"). You can add the network and the chain settings in the params for `fetchUpdateIx`. This will route the requests to the correct Switchboard oracles and map the data back to the target chain (Eclipse).&#x20;

```typescript
const provider = ...

// Initialize the program state account
const idl = (await anchor.Program.fetchIdl(new PublicKey("SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv"), provider))!;
const program = new anchor.Program(idl, provider);

// Get the Pull Feed - (pass in the feed pubkey)
const pullFeed = new PullFeed(program, new PublicKey(...));

// Get the update for the pull feed
const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({ 
      crossbarClient: crossbar,
      chain: "eclipse",
      network: "mainnet",
});
```

