---
title: Building Custom Switchboard Feeds in TypeScript
description: Design, simulate, and publish Switchboard feed definitions using TypeScript (Solana and EVM compatible patterns).
---

# Building Custom Switchboard Feeds in TypeScript

This guide is for developers who prefer code-first workflows.

You’ll learn how to:

- model a feed as a list of **Oracle Jobs**
- compose each job from sequential **Tasks**
- **simulate** jobs using Crossbar
- iterate safely and build production-grade feed definitions

> This guide focuses on designing + simulating feed definitions.  
> Deployment differs by chain — see `deploying-custom-feeds.md`.

---

## Mental model

### Oracle Jobs are “pipelines”
A job is an ordered list of tasks:

```ts
// Oracle Job
[
  httpTask,
  jsonParseTask,
  multiplyTask,
]
```

Each task runs sequentially. The job’s “current value” is updated as tasks run, and the job result is valid only if the final task produces a **numeric** value.

### Feeds are “job sets”
A feed is a set of jobs. Oracles execute the jobs and then aggregate the results (commonly median across jobs).

---

## Prerequisites

- Node.js or Bun (examples use **Bun** for simple TS execution)
- Basic TypeScript familiarity
- Your data sources (REST APIs, DEX pricing tasks, etc.)

---

## Install dependencies

### Using Bun

```bash
mkdir example
cd example
bun init
bun add @switchboard-xyz/on-demand @switchboard-xyz/common
```

> Note: Some examples import `OracleJob` from `@switchboard-xyz/common`.  
> Adding it explicitly avoids “transitive dependency” surprises.

---

## Example: a minimal BTC/USDT job

This is the smallest “real” job: fetch a JSON payload and extract a price.

Create `index.ts`:

```ts
import { OracleJob } from "@switchboard-xyz/common";

const jobs: OracleJob[] = [
  OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "https://binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        },
      },
      {
        jsonParseTask: {
          path: "$.price",
        },
      },
    ],
  }),
];

console.log("Jobs JSON:\n");
console.log(JSON.stringify({ jobs: jobs.map((j) => j.toJSON()) }, null, 2));
```

At this point you have a valid feed definition (one job).

---

## Simulate your job(s) with Crossbar

Simulation runs your jobs against real sources and returns their outputs. This is how you iterate quickly before deploying or publishing.

> ⚠️ The public simulation endpoint is **heavily rate-limited**.  
> Use it for development only.

Append this to `index.ts`:

```ts
// Serialize the jobs to base64 strings.
const serializedJobs = jobs.map((oracleJob) => {
  const encoded = OracleJob.encodeDelimited(oracleJob).finish();
  const base64 = Buffer.from(encoded).toString("base64");
  return base64;
});

console.log("\nRunning simulation...\n");

// Call the simulation server.
const response = await fetch("https://crossbar.switchboard.xyz/api/simulate", {
  method: "POST",
  headers: [["Content-Type", "application/json"]],
  body: JSON.stringify({
    cluster: "Mainnet",
    jobs: serializedJobs,
  }),
});

// Print results
if (response.ok) {
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} else {
  console.error(`Simulation failed (${response.status})`);
  console.error(await response.text());
}
```

Run it:

```bash
bun run index.ts
```

You should see a response like:

```json
{
  "results": ["64158.33000000"],
  "version": "..."
}
```

---

## Building production-grade feeds

### Use multiple jobs (multiple sources)

The simplest reliability upgrade is to use several independent jobs:

- Job 1: CEX API
- Job 2: another CEX API
- Job 3: on-chain DEX price simulation task

Then rely on aggregation (median) and feed configuration (variance/quorum) to filter noise.

Conceptually:

```ts
const jobs: OracleJob[] = [
  /* source A */,
  /* source B */,
  /* source C */,
];
```

### Normalize decimals

Different sources often report:
- different quote assets
- inverted prices
- different decimal precision

Use math tasks (multiply/divide/round) so every job returns the **same unit**.

### Bound results (optional but recommended)

Bounding can be applied:
- within a job (reject a single bad API response)
- at the feed level (reject updates when jobs disagree too much)

---

## Task reference

Switchboard supports many task types, including:

- HttpTask (REST)
- JsonParseTask (JSONPath extraction)
- MedianTask (sub-aggregation inside a job)
- JupiterSwapTask (Solana DEX price simulation)
- SecretsTask (secure secret retrieval)

Full task docs:
- https://protos.docs.switchboard.xyz/

---

## Secrets, variables, and safety

### Variable overrides (`${VAR_NAME}`)

Variable overrides let you inject values at runtime.

**Critical rule:** Only use variables for **authentication** (API keys/tokens).  
Do **not** use variables for anything that changes feed logic (URLs, JSON paths, multipliers), because consumers cannot cryptographically verify what values were injected at runtime.

### SecretsTask

If you need to retrieve secrets from a dedicated secrets server at runtime, include a SecretsTask at the top of the job, then use the unwrapped variables in downstream tasks.

(See `SecretsTask` docs in the task reference above.)

---

## Where to go next

- [Deploy on-chain](deploying-custom-feeds.md)
- [Use the visual editor](feed-builder-ui.md)
