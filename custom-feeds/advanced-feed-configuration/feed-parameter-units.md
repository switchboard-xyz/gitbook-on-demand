---
title: Feed Parameter Units
description: Units and fixed-point scaling for Switchboard feed configuration parameters.
---

# Feed Parameter Units

Feed definitions combine validation parameters, quorum parameters, freshness limits, and returned feed values. These fields do not all use the same unit or fixed-point scale.

The most common mistake is treating raw v2 `OracleFeed.maxJobRangePct` / `max_job_range_pct` as a human percent. It is a fixed-point percent scaled by `1e9`:

- `1_000_000_000` means `1%`
- `5_000_000_000` means `5%`
- `5` does not mean `5%`; it is effectively zero tolerance

| Field or surface | Unit | Example | Notes |
| --- | --- | --- | --- |
| Raw v2 `OracleFeed.maxJobRangePct` / `max_job_range_pct` | Percent scaled by `1e9` | `1_000_000_000` = `1%`; `5_000_000_000` = `5%` | Used in raw protobuf/JSON feed definitions. This is the feed-level job-spread tolerance oracles enforce before signing an update. |
| SDK helper `maxVariance` inputs that scale internally | Human percent | `1` or `1.0` = `1%` | Some SDK helper methods accept the human percentage and multiply by `1e9` before sending a gateway or on-chain request. Check the method docs before passing raw integers. |
| Direct gateway/raw API `max_variance` fields | Percent scaled by `1e9` | `50_000_000` = `0.05%`; `1_000_000_000` = `1%` | Use this for raw gateway payloads and chain parameters that already expect fixed-point validation values. Some JSON routes expose this as camelCase `maxVariance` while still expecting the scaled integer. |
| `MedianTask.max_range_percent` | Human percent string | `"2.5"` = `2.5%` | This is a task-level setting inside `MedianTask`. It is not scaled like feed-level `maxJobRangePct`. |
| `minJobResponses` / `min_job_responses` | Unscaled job/source quorum | `2` requires at least two successful job results | This counts successful jobs inside one oracle's feed execution. It does not change percent scaling. |
| `minOracleSamples` / `min_oracle_samples` | Unscaled oracle/signature quorum | `3` requires three oracle samples | This counts oracle responses/signatures. It is separate from job/source quorum. |
| Feed result values | Feed-specific numeric convention, often `i128` scaled by `1e18` | `1_000_000_000_000_000_000` may represent `1.0` | Result-value scaling is independent from validation parameter scaling. Always document the feed's value decimals separately. |
| Staleness fields | Slots, seconds, or milliseconds depending on the surface | `maxStaleness: 150` slots; `maxAgeSeconds: 60`; `maxAgeMs: 60000` | Solana/SVM verifier settings often use slots. EVM and Move-chain examples commonly use seconds. Sui examples may use milliseconds. |

## Practical Rules

When you create a raw v2 `OracleFeed`, use scaled integers for feed-level range validation:

```ts
const feed = {
  minJobResponses: 2,
  minOracleSamples: 3,
  maxJobRangePct: 1_000_000_000, // 1%, scaled by 1e9
  jobs,
};
```

Use `maxJobRangePct: 0` only when the flow intentionally expects a single successful job/source or identical outputs. For normal multi-source feeds, set a positive scaled tolerance.

Simulation can succeed even when signed updates fail. Simulation proves the jobs can resolve off-chain; signed updates also require oracle-side feed validation to pass. If update fetching returns `ORACLE_UNAVAILABLE` after successful simulation, inspect oracle errors for validation failures such as `RangeExceeded`, then check whether `maxJobRangePct` was scaled correctly.
