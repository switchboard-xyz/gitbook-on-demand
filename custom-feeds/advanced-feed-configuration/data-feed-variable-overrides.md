---
description: Configure request-scoped values in oracle jobs without hardcoding credentials.
---

# Data Feed Variable Overrides

Variable overrides substitute request-scoped values into string fields in an oracle job. Put a placeholder such as `${MARKET_DATA_API_KEY}` in the job definition, then provide the matching non-empty value in `variableOverrides` when requesting execution.

Overrides are a general substitution feature. They can represent credentials, URLs, symbols, paths, headers, query parameters, or other string values. Whether a particular override is appropriate depends on who controls updates and what feed consumers trust.

## Trust Model

The concrete override map is execution-scoped. It is not included in the feed ID or the signed checksum. A consumer can identify the job definition containing `${VARIABLE_NAME}`, but cannot recover or independently verify the value substituted for that placeholder from the feed identity or signature.

TEE-backed execution protects how selected oracle software handles a request, but it does not make override values part of the feed definition. The execution nodes necessarily receive values that their tasks must use, so credentials should be scoped to the intended API and request path.

Choose override values according to the update model:

| Update model | Appropriate use |
| --- | --- |
| Permissionless feed updates | Prefer credentials and other values that do not intentionally change the data source, selected market, extraction path, or calculation. Keep semantic inputs fixed in the job definition. |
| Controlled updater | Semantic values such as a URL, symbol, or path are supported when the caller controls every execution request and consumers intentionally trust that caller to select them. |

One execution request should represent one customer or security domain. Do not combine unrelated customers' jobs and credentials in one request.

## Credential Example

Keep the data source and extraction logic fixed while substituting only the credential:

```typescript
const apiKey = process.env.MARKET_DATA_API_KEY;
if (!apiKey) {
  throw new Error("MARKET_DATA_API_KEY is required");
}

const job = {
  tasks: [
    {
      httpTask: {
        url: "https://api.example.com/v1/markets/BTC-USD/price",
        headers: [
          {
            key: "authorization",
            value: "Bearer ${MARKET_DATA_API_KEY}",
          },
        ],
      },
    },
    {
      jsonParseTask: {
        path: "$.price",
      },
    },
  ],
};

const response = await gateway.fetchSignaturesConsensus({
  // ...feed request fields containing job
  variableOverrides: {
    MARKET_DATA_API_KEY: apiKey,
  },
});
```

Placeholder names are case-sensitive and must match the map key exactly. Use environment variables or a secret manager as the source of credential values. Never hardcode credentials in a job, commit them, include them in errors, or log override values.

## Semantic Overrides

Semantic overrides are valid for a controlled caller. For example, a backend that owns the request and whose consumers trust its market selection can use:

```typescript
const job = {
  tasks: [
    {
      httpTask: {
        url: "https://api.example.com/v1/markets/${MARKET}/price",
      },
    },
    {
      jsonParseTask: {
        path: "$.price",
      },
    },
  ],
};

const response = await gateway.fetchSignaturesConsensus({
  // ...feed request fields containing job
  variableOverrides: {
    MARKET: "BTC-USD",
  },
});
```

This request can produce a different result for each `MARKET` value while retaining the same feed identity. Do not use this pattern on a permissionless update path where an untrusted updater could select the value.

## Jupiter and Pyth API Keys

Jupiter and Pyth both support customer-provided API keys, but their fallback rules differ:

| Task | Preferred task field | Override behavior |
| --- | --- | --- |
| JupiterSwapTask | `apiKey: "${JUPITER_API_KEY}"` | `JUPITER_API_KEY` is a conventional example name, not reserved. The override is applied only when the field contains the matching placeholder. An unresolved placeholder fails before contacting Jupiter. If the field is omitted or empty, the oracle's configured Jupiter key is used when available. |
| OracleTask with `pythAddress` | `pythConfigs.apiKey: "${PYTH_API_KEY}"` | A non-empty task field takes precedence. If it is omitted or empty, the reserved request override `PYTH_API_KEY` is a compatibility fallback for every eligible `pythAddress` task in that request. The fallback is not shared with another request or customer. |
| OracleTask with `pythPushFeedId` | None | The task reads an on-chain account and does not use Hermes authentication. |

For new Pyth feed definitions, use the explicit task placeholder. The request-wide `PYTH_API_KEY` fallback exists so existing `pythAddress` jobs can adopt authenticated Hermes access without changing each stored job during the Pyth Core transition.

See [Jupiter API keys](decentralized-exchanges.md#jupiter-exchange-aggregator), [Pyth authentication and push feeds](oracle-aggregator.md#pyth), [JupiterSwapTask](../task-types.md#jupiterswaptask), and [OracleTask](../task-types.md#oracletask) for task-specific examples and fields.

## Operational Guidance

* Validate that every required override is present and non-empty before sending the request.
* Use least-privilege, rate-limited credentials and rotate them through your secret manager.
* Log placeholder names or whether configuration is present, never override values.
* Keep one customer's jobs and credentials within that customer's execution request.
* For permissionless feeds, keep the endpoint, selected data, parsing path, and calculations fixed in the job definition.

## Related Resources

* [REST APIs with HttpTask](rest-apis-with-httptask.md)
* [Variables with CacheTask](variables-with-cachetask.md)
* [Build with TypeScript](../build-and-deploy-feed/build-with-typescript.md)
* [Task Types Reference](../task-types.md)
