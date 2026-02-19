---
name: switchboard-feed-design
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard Feed Design Skill

## Purpose

Turn a data requirement into a robust, verifiable feed definition:

- Design `OracleJob[]` pipelines with stable parsing and source diversity
- Normalize scaling/decimals consistently
- Choose aggregation strategy and consumer validation policy defaults
- Identify and mitigate substitution, outliers, and schema brittleness risks

This skill designs feed definitions. Integration details (atomic update+use, on-chain verifier patterns) belong to chain-specific skills.

## Preconditions

- `OperatorPolicy` exists (especially if paid APIs, X402, or job storage is involved).

## Inputs to Collect

Required:

- target metric (price/index/rate/event outcome) and units
- target chain(s) and consumer type (how the value will be used)
- value-at-risk / criticality (UI display vs liquidation vs settlement)
- allowed/forbidden sources
- required secrets (API keys, auth headers, payment headers)

Optional (only if relevant):

- expected request frequency / external API rate limits
  - This matters if the user plans to run a crank/keeper or high-frequency bots.
  - On-demand does not impose a cadence by itself, but your infrastructure and upstream APIs still do.

## Security Invariants

- Variable overrides are secrets-only.
- Hardcode market IDs, selectors, URLs, JSON paths, multipliers in the job definition.
- Prefer 3+ independent sources when possible.

## Playbook

### 1) Specify output contract

Define:

- numeric scaling (e.g., 1e18)
- signedness (allow negative or not)
- bounds and failure mode (reject vs clamp)

### 2) Choose sources

- diversify upstream origins (avoid mirrored endpoints)
- prefer reliable schemas with stable versioning
- add at least one fallback source where possible

### 3) Job patterns

Single-source:

~~~json
{
  "tasks": [
    { "httpTask": { "url": "https://api.example.com/price", "method": "GET" } },
    { "jsonParseTask": { "path": "$.data.price" } },
    { "multiplyTask": { "big": "1e18" } }
  ]
}
~~~

Multi-source median aggregation:

~~~json
{
  "tasks": [
    {
      "medianTask": {
        "jobs": [
          { "tasks": [ { "httpTask": { "url": "https://ex1.com" } }, { "jsonParseTask": { "path": "$.price" } } ] },
          { "tasks": [ { "httpTask": { "url": "https://ex2.com" } }, { "jsonParseTask": { "path": "$.last" } } ] },
          { "tasks": [ { "httpTask": { "url": "https://ex3.com" } }, { "jsonParseTask": { "path": "$.data.price" } } ] }
        ],
        "minSuccessfulRequired": 2
      }
    }
  ]
}
~~~

### 4) Recommended Validation Defaults (suggest, don’t enforce)

These are primarily **consumer policy defaults** (freshness/deviation) and **oracle sample requirements** (responses/signatures) that you apply when verifying/using the feed.

- `minResponses` / `minSampleSize`: 3 for higher-risk flows; 1 for dev/non-critical
- aggregation: median (or median-of-means where supported)
- deviation:
  - 1–2% majors
  - 5–10% long-tail / volatile
- staleness:
  - bots/liquidations: 15–60 seconds (or chain-equivalent)
  - UI/general: 60–300 seconds

### 5) Produce outputs

Produce a `FeedBlueprint` including:

- `OracleJob[]` JSON
- sources + rationale
- aggregation choice
- required secrets and override variable names
- suggested consumer validation defaults (staleness/deviation/min responses)
- simulation plan (Crossbar or local job runner)

## References

- https://docs.switchboard.xyz/custom-feeds/task-types
- https://docs.switchboard.xyz/custom-feeds/advanced-feed-configuration/data-feed-variable-overrides
- https://docs.switchboard.xyz/tooling/crossbar
