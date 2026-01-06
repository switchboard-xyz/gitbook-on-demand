---
title: Deploying Custom Switchboard Feeds On-Chain
description: How deployment works across Solana/SVM and EVM, and what “deploying a feed” actually means per chain.
---

# Deploying Custom Switchboard Feeds On-Chain

“Deploying” a Switchboard feed means different things depending on the chain:

- **Solana/SVM**: you create a real on-chain **PullFeed account** (an address) that references your feed definition and can be updated by oracle signatures.
- **EVM**: feeds are identified by a deterministic `bytes32` ID (derived from the job definition + queue). You generally **do not** create a dedicated on-chain “feed account”; instead, you submit oracle-signed updates to the Switchboard contract and read the latest update from storage.

This guide covers both paths and explains why Switchboard’s docs historically focused on Solana deployment: **Solana requires an explicit on-chain initialization transaction**, whereas EVM is closer to “publish + integrate + update”.

---

## Prerequisites (all chains)

Before “deployment”, you should have:

- a feed definition (jobs + tasks) you have **simulated successfully**
- a clear understanding of:
  - what value your feed returns
  - decimal conventions (e.g., 1e8 vs 1e18)
  - which sources/jobs you trust and why

If you haven’t designed and simulated your jobs yet, start here:
- `custom-feeds-typescript.md` (code-first)
- `feed-builder-ui.md` (UI-first)

---

# Solana / SVM: Deploy a PullFeed account

## What you are doing

On Solana, deployment means:

1. Choose a **queue** (oracle subnet).
2. Optionally **store/pin** your job definition so it’s discoverable.
3. Create a **new PullFeed account** on-chain and configure it with:
   - feed hash (the definition)
   - variance/quorum/staleness rules
   - authority and metadata

## Requirements

- A funded Solana keypair file (payer)
- A Solana RPC URL
- Your OracleJob[] definition

Create a keypair file if you don’t have one:

```bash
solana-keygen new --outfile path/to/solana-keypair.json
```

## Install

```bash
bun add @switchboard-xyz/on-demand @switchboard-xyz/common
```

## Deployment flow (TypeScript)

Below is the canonical deployment flow as a single script outline. You can merge this into the same project where you built/simulated your jobs.

```ts
import { CrossbarClient, OracleJob } from "@switchboard-xyz/common";
import {
  AnchorUtils,
  PullFeed,
  getDefaultQueue,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";

// 1) Your simulated job definitions
const jobs: OracleJob[] = [
  /* ... */
];

// 2) Choose cluster + RPC
const connection = /* new Connection(RPC_URL) */;

// 3) Choose the queue (oracle subnet)
const queue = await getDefaultQueue(connection.rpcUrl);
// or: const queue = await getDefaultDevnetQueue(connection.rpcUrl);

// 4) (Recommended) Store jobs with Crossbar and get a feedHash
const crossbarClient = CrossbarClient.default();
const { feedHash } = await crossbarClient.store(queue.pubkey.toBase58(), jobs);

// 5) Load payer (funded)
const payer = await AnchorUtils.initKeypairFromFile("path/to/solana-keypair.json");

// 6) Generate a new pull feed keypair + wrapper
const [pullFeed, feedKeypair] = PullFeed.generate(queue.program);

// 7) Create the init instruction (configure validation + metadata)
const initPullIx = await pullFeed.initIx({
  feedHash,
  minSampleSize: 1,
  maxStalenessSlots: 1000,
  maxVariance: 1,
  minResponses: 1,
  name: "MY-FEED",
});

// 8) Build a v0 transaction and send it
const tx = await asV0Tx({
  connection,
  ixs: [initPullIx],
  payer: payer.publicKey,
  signers: [payer, feedKeypair],
});

const sig = await connection.sendTransaction(tx);
console.log("Transaction signature:", sig);
console.log("PullFeed publicKey:", pullFeed.pubkey.toBase58());
```

### Choosing validation parameters

- **minResponses**: raise this if you want stronger quorum guarantees.
- **maxVariance**: lower this if you want tighter agreement across job outputs.
- **maxStalenessSlots**: raise this if you can tolerate older data; lower it for strict freshness.
- **minSampleSize**: determines how many samples are considered when reading.

If you’re coming from the UI, these correspond to the same concepts (Min Responses, Max Variance, Sample Size, Max Staleness).

### Make it discoverable

Storing with Crossbar pins the feed definition to IPFS and makes it easier to view/debug in the Switchboard explorer.

---

# EVM: “Deploying” is publishing a feed ID + updating via the Switchboard contract

## Why there isn’t a dedicated “deploy feed” step on EVM

On EVM, a feed is identified by a **deterministic `bytes32` feed ID**. You can treat deployment as:

1. Obtain the feed ID (often from the Feed Builder / Explorer).
2. Store that feed ID in your consumer contract or app.
3. Fetch oracle-signed updates off-chain.
4. Submit updates on-chain via `updateFeeds`.

There is no per-feed “account creation” transaction analogous to Solana’s PullFeed init.

## On-chain: reading and updating

A typical Solidity integration looks like:

- Store the Switchboard contract address + your feedId
- When you need fresh data:
  - compute the required fee
  - submit `updateFeeds(updates)`
  - read `latestUpdate(feedId)`

```solidity
//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/structs/Structs.sol";

contract Example {
    ISwitchboard switchboard;
    bytes32 feedId;

    error InsufficientFee(uint256 expected, uint256 received);
    error InvalidResult(int128 result);

    constructor(address _switchboard, bytes32 _feedId) {
        switchboard = ISwitchboard(_switchboard);
        feedId = _feedId;
    }

    function getFeedData(bytes[] calldata updates) external payable returns (int128) {
        uint256 fee = switchboard.getFee(updates);
        if (msg.value < fee) revert InsufficientFee(fee, msg.value);

        switchboard.updateFeeds{value: fee}(updates);

        Structs.Update memory latest = switchboard.latestUpdate(feedId);
        if (latest.result < 0) revert InvalidResult(latest.result);

        return latest.result;
    }
}
```

> Many feeds use `int128` scaled by `1e18` to avoid floating point issues.  
> Always consult the feed’s intended decimal convention.

## Off-chain: fetch encoded updates with Crossbar (TypeScript)

Use Crossbar to fetch oracle-signed updates (encoded) for submission:

```ts
import * as ethers from "ethers";
import { CrossbarClient } from "@switchboard-xyz/on-demand";

const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");

const { encoded } = await crossbar.fetchEVMResults({
  chainId: 421614, // example: Arbitrum Sepolia
  aggregatorIds: ["0x...your_feed_id..."],
});

// submit `encoded` to your contract method that calls updateFeeds(...)
```

---

## Do we need “deployment docs” for other chains?

Switchboard supports additional chains with chain-specific SDKs and verification flows (e.g., Move-based environments). Many of these integrations follow the **EVM-style** model: you fetch oracle consensus off-chain and include a verification/update step inside your transaction, rather than creating a dedicated on-chain “feed account”.

If you’re targeting a non-Solana chain, treat “deployment” as:

1. Create/publish a feed definition and get its feed ID/address.
2. Use the chain’s SDK to fetch and verify oracle results in your transaction flow.

---

## Checklist before going to production

- [ ] You can simulate every job and get stable numeric outputs.
- [ ] You have at least 3 independent data sources (for price feeds).
- [ ] You’ve standardized decimals and units across jobs.
- [ ] Your variance/quorum/staleness settings match your risk tolerance.
- [ ] You have a monitoring plan (alerts on stalled updates, outliers, API errors).
- [ ] Your authority is secured (multisig/DAO/governance, not a hot wallet).
