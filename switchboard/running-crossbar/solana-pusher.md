---
description: Running a Solana Pusher with Crossbar
---

# Solana Pusher

You can use the same container for crossbar as a pusher service for your Solana feeds.&#x20;

### Getting Started

#### Step 1: Add your payer key to the environment

Using a pusher will require transactions to be made on-chain at a regular cadence. Thus, a well funded key must be passed into the environment.

```bash
SOLANA_PAYER_SECRET=<0xbase58SolanaSecret>
```

#### Step 2: Set the network

You have to pass in the Solana network you're targeting in order for the pusher to work.&#x20;

```bash
# for mainnet
SOLANA_PUSHER_NETWORK=mainnet-beta
```

#### Step 3: Select a Min Compute Unit Price and Maximum Compute Unit Price (optional)

It's getting harder to land regular transactions on solana without priority fees - thus, Switchboard cranks use dynamic fees. Unfortunately, even dynamic fee calculators can drift from what's landing on-chain. It can be helpful to set a minimum fee (and a maximum fee for cost-savings).&#x20;

```bash
# just an example (optional, but recommended)
SOLANA_MAX_CU_PRICE=100000
SOLANA_MIN_CU_PRICE=5000
```

#### Step 4: Mount the Feeds to \`/solana-feeds.json\`

In order to specify the feeds that the crank has access to, you'll need to mount a JSON file, `solana-feeds.json` to the root.&#x20;

```json
// solana-feeds.json example
[
    {
        "pubkey": "7QJ6e57t3yM8HYVg6bAnJiCiZ3wQQ5CSVsa6GA16nJuK"; // feed pubkey
        "interval": 60; // seconds 
        "network": "mainnet-beta"; // (optional) defaults to mainnet-beta
    },
    
    // feed 2...
]
```



#### Step 5: Boot it up:

As soon as you get this environment set up for Crossbar, it should start running. If you don't see explorer links working, try bumping the min compute unit price.\
\
Also, don't forget to use a non-rate-limited Solana rpc as this crank will constantly poll for feed updates.&#x20;
