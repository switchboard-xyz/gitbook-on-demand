# Option 2: Designing a Feed in Typescript

If you are more comfortable with a text editor, it can be helpful to use language-server TypeScript features to configure feed inputs. For the following demonstration, we'll use `bun.sh` for its ease of use with TypeScript.

#### **Initialising the Project**

1.  **Create the example directory** and navigate to it to initialise the bun project:

    ```bash
    # create the example directory
    mkdir example     
    cd example

    # initialise the bun project
    bun init
    ```
2.  The only **dependency you'll need is the Switchboard On-Demand package**, `@switchboard-xyz/on-demand`. Install it with:

    ```bash
    bun add @switchboard-xyz/on-demand
    ```
3.  Make sure everything is installed correctly:

    ```bash
    bun run index.ts
    # Hello via Bun!
    ```

#### **Boilerplate Script**

Many developers using Switchboard choose to **use Visual Studio Code**, this is a great tool for writing Typescript code and makes working with Oracle Jobs pretty straightforward.

To get started, replace the contents of `index.ts`with the following:

**index.ts**

```typescript
import { OracleJob } from "@switchboard-xyz/common"

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
const response = await fetch("https://api.switchboard.xyz/api/simulate", {
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

#### **Running the Feed**

From here, running the example feed is as simple as running:

```bash
bun run index.ts
```

This command should now output something similar to:

```json
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
