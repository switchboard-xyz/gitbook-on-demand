---
title: Deploy Feed
description: How deployment works across Solana/SVM and EVM, and what "deploying a feed" actually means per chain.
---

"Deploying" a Switchboard feed means making it available for use on-chain. With Switchboard's **managed update system**, this is simpler than ever:

- **Solana/SVM**: Feeds use **canonical OracleQuote accounts** derived deterministically from feed IDs. No explicit account creation needed—accounts are created automatically on first use.
- **EVM**: Feeds are identified by a deterministic `bytes32` ID. You submit oracle-signed updates to the Switchboard contract and read the latest update from storage.

Both chains follow the same pattern: **store your feed definition, get a feed ID, then use managed updates**.

---

## Prerequisites (all chains)

Before “deployment”, you should have:

- a feed definition (jobs + tasks) you have **simulated successfully**
- a clear understanding of:
  - what value your feed returns
  - decimal conventions (e.g., 1e8 vs 1e18)
  - which sources/jobs you trust and why

If you haven't designed and simulated your jobs yet, start here:
- [Build with TypeScript](build-with-typescript.md) (code-first)
- [Build with UI](build-with-ui.md) (UI-first)

---

# Solana / SVM: Deploy with Managed Updates

## What you are doing

On Solana, deployment means:

1. Choose a **queue** (oracle subnet).
2. **Store/pin** your job definition with Crossbar to get a feed hash.
3. Use the feed hash to derive the **canonical OracleQuote account** address.
4. Fetch managed update instructions and include them in your transactions.

The canonical account is created automatically on first use—no explicit initialization transaction required.

## Requirements

- A funded Solana keypair file (payer)
- A Solana RPC URL
- Your OracleJob[] definition

Create a keypair file if you don't have one:

```bash
solana-keygen new --outfile path/to/solana-keypair.json
```

## Install

```bash
bun add @switchboard-xyz/on-demand @switchboard-xyz/common
```

## Deployment flow (TypeScript)

Below is the deployment flow using managed updates. You can merge this into the same project where you built/simulated your jobs.

```ts
import { CrossbarClient, OracleJob } from "@switchboard-xyz/common";
import {
  AnchorUtils,
  OracleQuote,
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

// 4) Store jobs with Crossbar and get a feedHash
const crossbarClient = CrossbarClient.default();
const { feedHash } = await crossbarClient.store(queue.pubkey.toBase58(), jobs);
console.log("Feed hash:", feedHash);

// 5) Derive the canonical OracleQuote account address
// This is deterministic - same feed hash always produces the same address
const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedHash]);
console.log("Quote account:", quoteAccount.toBase58());

// 6) Load payer (funded)
const payer = await AnchorUtils.initKeypairFromFile("path/to/solana-keypair.json");

// 7) Fetch managed update instructions
// This returns Ed25519 verification + quote storage instructions
const updateIxs = await queue.fetchManagedUpdateIxs(crossbarClient, [feedHash], {
  payer: payer.publicKey,
});

// 8) Build and send a transaction to verify everything works
const tx = await asV0Tx({
  connection,
  ixs: updateIxs,
  payer: payer.publicKey,
  signers: [payer],
});

const sig = await connection.sendTransaction(tx);
console.log("Transaction signature:", sig);
console.log("Feed deployed! Quote account:", quoteAccount.toBase58());
```

### Using validation parameters

Validation parameters (min responses, max variance, staleness) are now specified when fetching updates or reading data, rather than at deployment time:

```ts
// When reading in your program, use QuoteVerifier with max_age
const quote_data = QuoteVerifier::new()
    .max_age(30)  // Reject data older than 30 slots
    .verify_account(quote)?;
```

### Make it discoverable

Storing with Crossbar pins the feed definition to IPFS and makes it easier to view/debug in the Switchboard explorer. The feed hash is the key identifier you'll use throughout your integration.

---

# EVM: “Deploying” is publishing a feed ID + updating via the Switchboard contract

## Why there isn’t a dedicated “deploy feed” step on EVM

On EVM, a feed is identified by a **deterministic `bytes32` feed ID**. You can treat deployment as:

1. Obtain the feed ID (often from the Feed Builder / Explorer).
2. Store that feed ID in your consumer contract or app.
3. Fetch oracle-signed updates off-chain.
4. Submit updates on-chain via `updateFeeds`.

This is the same pattern Solana now uses with managed updates—no explicit account creation needed.

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

