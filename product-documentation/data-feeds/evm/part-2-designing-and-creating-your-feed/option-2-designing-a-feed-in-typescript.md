# Option 2: Designing a Feed in Typescript

It can be helpful to use language-server TypeScript features to configure feed inputs with a text editor. This example uses `bun.sh`.

#### Initialising the Project

1.  Create the example directory and navigate to it to initialize the bun project:

    ```bash
    # create the example directory
    mkdir example
    cd example
    # initialize the bun project
    bun init
    ```
2. Press enter through each of the options to setup the `package.json`.
3.  Install the Switchboard On-Demand package `@switchboard-xyz/on-demand`:

    ```bash
    bun add @switchboard-xyz/on-demand @switchboard-xyz/common
    ```
4.  Make sure things are installed:

    ```bash
    bun run index.ts
    # Hello via Bun!
    ```

#### Boilerplate Script

To get started, replace the contents of `index.ts` with the following:

**index.ts**

```tsx
import { OracleJob } from "@switchboard-xyz/common";

const jobs: OracleJob[] = [
  OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "https://binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        }
      },
      {
        jsonParseTask: {
          path: "$.price"
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

**Note:** _The simulation server is heavily rate-limited, use it solely for test development purposes._

#### Running the Feed

Run the example feed:

```bash
bun run index.ts
```

The output should be similar to:

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

Explore boilerplate feed definitions and how the task runner works in the [Switchboard Feeds Documentation](https://switchboardxyz.gitbook.io/switchboard-on-demand/). Modify the job and add new ones until you're satisfied, then move to the next section.

Note: _The `@switchboard-xyz/on-demand` package is actively maintained. Ensure the version in your `package.json` is up to date._
