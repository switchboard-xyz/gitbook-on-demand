---
title: Build with UI
description: Build, simulate, and publish a custom Switchboard feed definition using the Feed Builder web app.
---

# Build with UI

Switchboard feeds are built from **Oracle Jobs** (your data sources) and **Tasks** (the steps that fetch + transform data). The Feed Builder UI lets you assemble these visually, simulate them, and (when applicable) publish or deploy them.

> If you prefer code-first workflows, see: **Building custom feeds in TypeScript**.

---

## What you can do with the Feed Builder

Use the Feed Builder to:

- **Start from scratch** or **clone an existing feed**, then customize its job list.
- Build each **job** as a sequential pipeline of **tasks** (HTTP requests, JSON parsing, math transforms, DEX pricing tasks, etc.).
- **Simulate** job execution to validate that each job returns a numeric result.
- Configure feed-level **validation + freshness rules** (variance, quorum, staleness, sampling).
- Produce a feed **address/ID** you can use in on-chain programs and apps.

Open the builder here:

- https://explorer.switchboardlabs.xyz/feed-builder

---

## Core concepts (quick mental model)

### Feed → Jobs → Tasks

- A **Feed** is the thing your program/app reads: a single numeric value (plus metadata like timestamp/slot).
- A feed is composed of **Jobs**.
- A **Job** is a deterministic pipeline of **Tasks** (executed in order).
- Each job must end with a **numeric** output.
- The oracle network resolves the feed by aggregating job outputs (commonly a **median** across jobs).

Think of it like:

```text
Feed
 ├─ Job 1: [ Task A → Task B → Task C ]  => number
 ├─ Job 2: [ Task A → Task D ]           => number
 └─ Job 3: [ Task E ]                    => number
          ↓
     Aggregate (e.g., median)
          ↓
       Feed value
```

### Queue (oracle subnet)

A **Queue** is the set of oracles that will resolve your feed. Feeds are always associated with a specific queue.

### Simulation vs deployment

- **Simulation**: run your job(s) against real sources off-chain to validate logic and observe outputs.
- **Deployment** (chain-dependent):
  - On **Solana/SVM**, deployment typically creates an on-chain *PullFeed* account.
  - On **EVM**, feeds are identified by a deterministic `bytes32` ID and are updated via the Switchboard contract (no separate “feed account” creation step on-chain).

This page focuses on **building and simulating** with the UI.

---

## Step-by-step: Build a feed in the UI

### 1) Choose your target network

In the upper-right, use the **network/settings** control to select the network you’re building against (e.g., mainnet vs devnet/testnet).

Why this matters:
- It determines the available queues/oracle networks and how IDs/addresses are derived.
- It affects simulation defaults and explorer routing.

### 2) Start from an existing feed (recommended)

If you’re building a common pair (like BTC/USD), start by selecting an existing feed and customizing it:

- Browse/search for the pair you want.
- Open it to inspect its configuration.
- Remove jobs you don’t want (trash/delete icon).
- Edit jobs to adjust sources or task pipelines.

This is the fastest way to learn what “good” looks like for your use case.

### 3) Add or edit jobs

Each job represents a distinct data source and/or retrieval strategy.

A solid starting point is **3+ jobs** from independent sources. For price feeds, aim for liquidity-heavy venues and reduce correlated risk.

#### Common task pipeline pattern

Most HTTP/API sources follow this pattern:

1. **HttpTask**: fetch JSON from a REST endpoint  
2. **JsonParseTask**: extract a numeric field using JSONPath  
3. Optional **math tasks**: normalize decimals, invert price, etc.  
4. Optional **bound/validation tasks**: reject outliers

Example tasks (conceptual):

```json
[
  { "httpTask": { "url": "https://api.exchange.com/price?symbol=BTCUSD" } },
  { "jsonParseTask": { "path": "$.price" } },
  { "multiplyTask": { "multiplier": "100000000" } }
]
```

> Task reference: https://protos.docs.switchboard.xyz/

### 4) Configure feed-level validation and freshness

The Feed Builder exposes common feed-level configuration knobs:

#### Basic settings

- **Name**: the label shown in the explorer UI.
- **Authority**: the address allowed to modify feed settings later (useful for DAO/governance control).

#### Advanced settings

- **Max Variance**: maximum allowed deviation between job results for an update to be accepted.
- **Min Responses**: minimum number of successful job results required to accept an update.
- **Sample Size**: how many samples are considered when reading a feed.
- **Max Staleness**: how old a sample can be before it is considered invalid.

These parameters are your “guardrails”—they trade off liveness vs correctness. Start conservative, then tune based on observed behavior.

### 5) Simulate and debug

Use the UI’s simulation flow to validate:

- Every job returns a **number**
- Results are in the same units/decimals across jobs
- Outliers are either prevented by job logic or rejected by feed-level settings

If a job fails, typical causes include:
- Bad URL / rate limits
- JSONPath returns an array or string instead of a numeric
- API returns a different schema than expected

Tip: When debugging, simplify the job:
- Start with **HttpTask + JsonParseTask**
- Add transforms only after you see a clean numeric output

### 6) Create / publish the feed

When you’re satisfied:

- Use **Connect Wallet** to associate an authority with the feed.
- The UI will create/publish the feed and redirect you to a status/details page.
- Copy the resulting **feed address/ID** — you’ll need it for on-chain integration.

---

## Best practices for robust custom feeds

### Use independent sources
Avoid three endpoints that all ultimately depend on the same upstream price.

### Normalize outputs
Make sure every job returns the same unit:
- same base/quote
- same decimals (use multiply/divide tasks to standardize)

### Prefer median-style aggregation
Median aggregation is naturally robust to single-source outliers.

### Bound outliers
Use bounding/validation where it makes sense (especially for thinly traded or highly volatile assets).

### Secrets and API keys: do it safely
If you need authenticated APIs:
- use dedicated secrets/variable mechanisms
- never hardcode keys into a job definition that you intend to share publicly

---

## Next steps

- [Build with code](build-with-typescript.md)
- [Deploy on-chain](deploy-feed.md)
- [Task reference](https://protos.docs.switchboard.xyz/)
