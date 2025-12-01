---
description: FAQ on Feed Resolution and Common Feed Examples
---

# Advanced Feed Configuration

Switchboard Feeds enable seamless access to data from any API, oracle, major DeFi protocol, and more. Our mission is to simplify the process of retrieving diverse data types—such as price data and event data—in a secure and user-friendly manner.

Switchboard data feeds are composed of [Oracle Jobs](https://protos.docs.switchboard.xyz/protos/OracleJob), which define where to source data. Feeds specify a list of different [Task Types](https://protos.docs.switchboard.xyz/protos/Task), which are used as instructions to fetch data.

This section will explore different task types and give an in-depth explanation on how to build oracle jobs.

## Task Runner

All Oracle Jobs are executed by the task-runner, an engine used by oracles to fetch data in a secure and efficient manner. Oracle Jobs must define an array of tasks executed sequentially. Any task producing a value (String, JSON, or Decimal) will be assigned to the job's context for that particular run, and subsequent tasks will manipulate that current task.

Here's a brief overview of what a job might look like (without including full tasks):

```typescript
// Oracle Job
[
    httpTask,
    jsonParseTask,
    multiplyTask, 
]
```

So here we'd:

1. Fetch a result from some API and set that blob to context
2. Parse context and replace with value at jsonPath specified
3. Multiply value in context by some number

See the next page for more on the task runner.
