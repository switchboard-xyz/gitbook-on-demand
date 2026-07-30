---
description: Feed resolution description and variable expansion tutorial.
---

# How Feeds are Resolved

## Task Runner

All Switchboard Oracle Jobs are executed by the task-runner, an engine used by oracles to fetch data in a secure and efficient manner. Understanding how Oracle jobs are processed is essential before creating them. Oracle Jobs must define an array of tasks executed sequentially. Any task producing a value (String, JSON, or Decimal) will be assigned to the job's context for that particular run.

The Task Runner Context can be interpreted as:

```typescript
// Context 
{
    current_value: string | JSON | Decimal,
    variable_cache: Map<string, string | JSON | Decimal>,
}
```

## Schemas

Switchboard feeds are composed of Oracle Jobs, a schema designed for efficient and safe fetching of arbitrary numeric data from various sources. Oracle nodes run feeds by aggregating the results of jobs within a feed definition and computing a median.

#### **Feeds Schema**

```
{
    jobs: [
        // Oracle Job 1
        {
            tasks: [ ... ]
        },
        // Oracle Job 2
        {
            tasks: [ ... ]
        }
    ]
}
```

Oracle Jobs are composed of tasks. Tasks are like instructions to fetch data or compute certain outputs. There are several [Task Types](../task-types.md) available, and they can be strung together to create some complex logic.

#### Oracle Jobs Schema

```
{
    tasks: [
        // task 1
        {
            ...
        },
        // task 2
        {
            ...
        }
    ]
}
```

## Feed Identity

A feed ID is a commitment to canonical length-delimited protobuf bytes, not
only to the decoded JSON object. Field presence and encoding order therefore
matter, including explicitly set default values.

Use `@switchboard-xyz/common@5.8.5` or newer when serializing jobs and feeds,
computing `FeedHash`, or storing definitions with Crossbar. Use
`@switchboard-xyz/on-demand@3.10.6` or newer when requesting JavaScript
updates. These versions:

- encode job and feed identities in the Rust/prost-compatible declaration order;
- preserve Pyth-push fields and explicitly set optional defaults such as
  `pushFeedShardId: 0` and `directRoutesOnly: false`; and
- keep the canonical encoder isolated if another Common version is also loaded.

Use the same canonical definition for hashing, storage, and update requests.
For classic PullFeed accounts, the JavaScript update helpers reject any
returned median-response feed hash that was not requested before constructing
signature or submit instructions.

## Variable Expansion

Using [Variable Overrides](data-feed-variable-overrides.md) and the [CacheTask](variables-with-cachetask.md), users can assign variables in a job and use them within the same job in a downstream task.

So in a downstream task, you can invoke the variable with the syntax: `${VARIABLE_NAME}.`

Here's an HttpTask where the URL is pulled from a variable:

```
[
    // ... Cache Task or Secrets Task (or both) must come first ...
    {
        httpTask: {
            url: "${MY_CONFIGURED_HTTP_URL}"
        }
    },
    {
        jsonParseTask: {
            path: "$.price"
        }
    }
]
```

Internally, the variables are being string-replaced within the executed job definitions. This can be a good tool for deduplicating logic in complex jobs.

## Resolution

In order for a task runner result to be valid, its current\_value must be some numeric value. Intermediate calls may produce non-numeric values (like HttpTasks, JsonParseTasks, etc), but the final value will be the result of the job.
