---
description: Storing variables with CacheTask
---

# Variables with CacheTask

You can store data in the task-runner's variable cache by using a CacheTask. This is a useful tool when you have a task that is complex, or requires the use of a lot of dynamically computed numbers.

## CacheTask

The following is an example of a CacheTask specifying multiple variables, building off of one another.

```typescript
{
  cacheTask: {
    cacheItems: [
      {
        // Create FAIR_VALUE_HEX from the hex returned from an ETH RPC Call
        variableName: "FAIR_VALUE_HEX",
        job: {
          tasks: [
            {
              httpTask: {
                url: "https://rpc.exampleRPC.org/",
                method: 2,
                headers: [
                  { key: "content-type", value: "application/json" },
                ],
                body: '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0xf5fa1728babc3f8d2a617397fac2696c958c3409","data":"0x3ca967f3"},"latest"]}',
              },
            },
            {
              jsonParseTask: {
                path: "$.result",
              },
            },
          ],
        },
      },
      // Parse the hex and scale it down 10^6, store the result in FAIR_VALUE
      {
        variableName: "FAIR_VALUE",
        job: {
          tasks: [
            {
              valueTask: {
                hex: "${FAIR_VALUE_HEX}",
              },
            },
            {
              divideTask: {
                big: "1000000",
              },
            },
          ],
        },
      },
      
      // Create a new variable, FAIR_VALUE_LOW, which is value * 0.95
      {
        variableName: "FAIR_VALUE_LOW",
        job: {
          tasks: [
            {
              valueTask: {
                big: "${FAIR_VALUE}",
              },
            },
            {
              multiplyTask: {
                big: "0.95",
              },
            },
          ],
        },
      },
      
      // Create a new variable, FAIR_VALUE_HIGH, which is value * 1.05
      {
        variableName: "FAIR_VALUE_HIGH",
        job: {
          tasks: [
            {
              valueTask: {
                big: "${FAIR_VALUE}",
              },
            },
            {
              multiplyTask: {
                big: "1.05",
              },
            },
          ],
        },
      },
    ],
  },
},
```

This large task does quite a number of things. It does the following:

1. It calls an EVM contract and parses some hex using a JsonParseTask, then creates a new variable called `FAIR_VALUE_HEX` that stores a JSON value.
2. It parses that hex into a new variable, `FAIR_VALUE`
3. It creates a low value to be used in subsequent jobs by using a `MultiplyTask` and setting 0.95 \* `FAIR_VALUE` to `FAIR_VALUE_LOW`
4. It creates a high value to be used in subsequent jobs by using the same method to set 1.05 \* `FAIR_VALUE` to `FAIR_VALUE_HIGH`

In subsequent jobs one can reference the values locked in these variables.

## Math Tasks

Variables are easily combined with math-related tasks, `AddTask`, `MultiplyTask`, `SubtractTask` , and `DivideTask` are some really common ones. These tasks will run agains whatever number is in the current\_value of the task-runner context.

They can also be combined with `ValueTask` to pull a variable into the current\_value position.

For example:

```typescript
// ... CacheTask from above
{
    valueTask: {
        big: "${FAIR_VALUE}"
    } 
},
{
    multiplyTask: {
        scalar: 2
    }
}
```

Inside of Math Tasks you can specify one of the following fields:

```typescript
/** Specifies a scalar to multiply by. */
scalar?: number | null;

/** Specifies an aggregator to multiply by. */
aggregatorPubkey?: string | null;

/** A job whose result is computed before multiplying our numerical input by that result. */
job?: oracle_job.IOracleJob | null;

/** A stringified big.js. `Accepts variable expansion syntax.` */
big?: string | null;
```
