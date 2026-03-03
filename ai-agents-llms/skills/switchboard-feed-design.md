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

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/common@5.7.0`

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

## Minimal Example

~~~json
{
  "tasks": [
    { "httpTask": { "url": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT" } },
    { "jsonParseTask": { "path": "$.price" } },
    { "multiplyTask": { "big": "1e18" } }
  ]
}
~~~

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
- commonly used free spot APIs (availability varies by region): Binance, Coinbase, Kraken, Bitstamp, OKX

### 3) Production templates

Template 1: Single source (tutorial baseline)

~~~json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        "method": "METHOD_GET"
      }
    },
    { "jsonParseTask": { "path": "$.price" } },
    { "multiplyTask": { "big": "100000000" } }
  ]
}
~~~

Template 2: 3-source median (production minimum, 2 of 3 required)

~~~json
{
  "tasks": [
    {
      "medianTask": {
        "min_successful_required": 2,
        "jobs": [
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.price" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.kraken.com/0/public/Ticker?pair=XBTUSD",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.result.XXBTZUSD.c.0" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.coinbase.com/v2/prices/spot?currency=USD",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.data.amount" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          }
        ]
      }
    }
  ]
}
~~~

Template 3: 5-source with fallback tolerance (production recommended)

~~~json
{
  "tasks": [
    {
      "medianTask": {
        "min_successful_required": 3,
        "max_range_percent": "2.5",
        "jobs": [
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.price" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.coinbase.com/v2/prices/spot?currency=USD",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.data.amount" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://api.kraken.com/0/public/Ticker?pair=XBTUSD",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.result.XXBTZUSD.c.0" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://www.bitstamp.net/api/v2/ticker/btcusd/",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.last" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          },
          {
            "tasks": [
              {
                "httpTask": {
                  "url": "https://www.okx.com/api/v5/market/ticker?instId=BTC-USD",
                  "method": "METHOD_GET"
                }
              },
              { "jsonParseTask": { "path": "$.data[0].last" } },
              { "multiplyTask": { "big": "100000000" } }
            ]
          }
        ]
      }
    }
  ]
}
~~~

Template 4: Custom API with auth headers (variable override pattern)

~~~json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://api.provider.com/v1/markets/btc-usd/spot",
        "method": "METHOD_GET",
        "headers": [
          { "key": "Authorization", "value": "Bearer ${ACCESS_TOKEN}" },
          { "key": "X-API-Key", "value": "${API_KEY}" }
        ]
      }
    },
    { "jsonParseTask": { "path": "$.data.price" } },
    { "multiplyTask": { "big": "100000000" } }
  ]
}
~~~

Variable override rule reminder:
- only use `${...}` for auth credentials (keys/tokens)
- never use `${...}` for URLs, paths, symbols, multipliers, or selection logic

### 4) Error handling and rate limiting

- set `min_successful_required` so one source outage does not break updates (for example 2-of-3, 3-of-5)
- set `max_range_percent` for drift/outlier protection before median is accepted
- stagger polling and cap request rate to provider quotas (especially free tiers)
- back off exponentially on HTTP 429/5xx and keep at least 3 independent sources

### 5) Recommended Validation Defaults (suggest, don’t enforce)

These are primarily **consumer policy defaults** (freshness/deviation) and **oracle sample requirements** (responses/signatures) that you apply when verifying/using the feed.

- Start from `OperatorPolicy` presets in the top-level [Switchboard Skill](switchboard-agent-skill.md), then tune per feed risk and volatility.
- `minResponses` / `minSampleSize`: 3 for higher-risk flows; 1 for dev/non-critical
- aggregation: median (or median-of-means where supported)
- deviation:
  - majors: 100–200 bps for high-risk flows; ~500 bps for standard flows
  - long-tail / volatile: wider deviation may be needed as an explicit override from preset defaults
- staleness:
  - bots/liquidations: 15–60 seconds (or chain-equivalent)
  - UI/general: 60–300 seconds

### 6) Produce outputs

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
