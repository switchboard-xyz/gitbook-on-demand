---
description: Tutorial on designing a feed with Switchboard
---

# Designing a Feed (SVM)

Designing a Switchboard Feed requires knowledge of the Oracle Job format, which sources data will come from, and some knowledge of the risks associated with different sources. For a simple guide on fetching data from various sources, and specifying what/how to get data, check out the docs on [Switchboard Feeds](../designing-feeds/).&#x20;

The easiest way to build a Solana Pull Feed is using the Switchboard [On-Demand Builder](https://ondemand.switchboard.xyz/solana/mainnet/build). If you don't find inspiration for your desired feed definition within these docs, you can explore existing feeds in the [On-Demand Explorer](https://ondemand.switchboard.xyz/solana/mainnet), and even the [Switchboard-V2 Push Explorer](https://app.switchboard.xyz/solana/mainnet).

## Making a Pull Feed with the Builder

1. Navigate to [https://ondemand.switchboard.xyz/solana/mainnet/build](https://ondemand.switchboard.xyz/solana/mainnet/build).&#x20;

<figure><img src="../../../.gitbook/assets/Screenshot 2024-06-21 at 5.53.00 PM 1.png" alt=""><figcaption><p>Opening the Builder</p></figcaption></figure>

2. You should see the following, click one of the tabs on the left-side pane to reveal different tasks available to you.&#x20;

<figure><img src="../../../.gitbook/assets/image (11).png" alt=""><figcaption><p>Drag-n-drop Builder</p></figcaption></figure>

3. Drag the tasks you want for the desired source and configure then as you wish. The following example will use an `HttpTask` and a `JsonParseTask`.&#x20;

<figure><img src="../../../.gitbook/assets/image (12).png" alt=""><figcaption><p>Example Job</p></figcaption></figure>

4. When you're happy with the job definition, click simulate. This will dry-run the jobs against an instance of the [Switchboard Task-Runner](../designing-feeds/how-feeds-are-resolved.md). In this example, the simulator yields $64K at the time of running, with version "RC\_06..." of the task-runner.&#x20;

<figure><img src="../../../.gitbook/assets/image (13).png" alt=""><figcaption><p>Task Runner Simulation</p></figcaption></figure>

If you're happy with the job configuration, add it to the current Feed with 'Add'. Remember, the feed output will be the median of all jobs supplied. You can move onto Creating a Feed for more info around configuration.&#x20;

## Designing a Feed in Typescript&#x20;

If you're more comfortable with a text editor, it can be useful to use language-server typescript features to configure feed inputs. For the following demonstration, we'll use [bun.sh](https://bun.sh) for the ease of use with typescript.

#### Initializing the Project

1. Create the example directory and navigate to it to initialize the bun project:

```sh
# create the example directory
mkdir example     
cd example

# initialize the bun project
bun init
```

2. You can press enter through each of the options to setup the `package.json`  and get through the configuration.&#x20;
3. The only dependency you'll need is the Switchboard On-Demand package, [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand). Install it with:

```bash
bun add @switchboard-xyz/on-demand
```

4. Make sure things are installed:

```bash
bun run index.ts
# Hello via Bun!
```

#### Boilerplate Script&#x20;

Many developers using Switchboard choose to use [Visual Studio Code](https://code.visualstudio.com/), this is a great tool for writing Typescript code, and makes working with Oracle Jobs pretty straightforward.&#x20;

To get started, replace the contents of `index.ts` with the following:

#### index.ts

```typescript
import { OracleJob } from "@switchboard-xyz/on-demand";

const jobs: OracleJob[] = [
  new OracleJob({
    tasks: [
      {
        httpTask: {
          url: "https://binance.com/api/v3/ticker/price",
        }
      },
      {
        jsonParseTask: {
          path: "$[?(@.symbol == 'BTCUSDT')].price"
        }
      }
    ],
  }),
];

console.log("Running simulation...\n");

// Print the jobs that are being run.
const jobJson = JSON.stringify({ jobs: jobs.map((job) => job.toJSON()) });
console.log(jobJson);
console.log();

// Serialize the jobs to base64 strings.
const serializedJobs = jobs.map((oracleJob) => {
  const encoded = OracleJob.encodeDelimited(oracleJob).finish();
  const base64 = Buffer.from(encoded).toString("base64");
  return base64;
});

// Call the simulation server.
const response = await fetch("https://crossbar.switchboard.xyz/api/simulate", {
  method: "POST",
  headers: [["Content-Type", "application/json"]],
  body: JSON.stringify({ cluster: "Mainnet", jobs: serializedJobs }),
});

// Check response.
if (response.ok) {
  const data = await response.json();
  console.log(`Response is good (${response.status})`);
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log(`Response is bad (${response.status})`);
  console.log(await response.text());
}
```

**Note:** The simulation server is heavily rate-limited. Therefore, the endpoint should be used solely for test development purposes.

#### package.json

```json
{
  "name": "example",
  "module": "index.ts",
  "type": "module",
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@switchboard-xyz/on-demand": "^1.1.23"
  }
}
```

**Note:** The @switchboard-xyz/on-demand package is actively maintained. Ensure the version in your package.json is up to date (it should likely be greater than 1.1.23, for example).&#x20;

#### Running the Feed

From here, running the example feed is as simple as running

```sh
bun run index.ts
```

This command should now output something similar to:

```
Running simulation...

{"jobs":[{"tasks":[{"httpTask":{"url":"https://binance.com/api/v3/ticker/price?symbol=BTCUSDT"}},{"jsonParseTask":{"path":"$.price"}}]}]}

Response is good (200)
{
  "results": [
    "64158.33000000"
  ],
  "version": "RC_06_19_24_03_17"
}
```

#### Resources

Explore boilerplate feed definitions and learn about how the task runner works in the [Switchboard Feeds Documentation](../designing-feeds/). You can modify the job and add new ones until you're satisfied with the definition you've created. Then it's onto the next section. &#x20;

