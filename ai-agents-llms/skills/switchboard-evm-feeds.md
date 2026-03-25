---
name: switchboard-evm-feeds
version: 1.0.2
updated: 2026-02-18
depends_on:
  - switchboard
---

# Switchboard EVM Feeds Skill

## Purpose

Integrate Switchboard on-demand feeds into EVM contracts and bots:

- Fetch verifiable update payloads off-chain
- Submit updates on-chain via the Switchboard contract (pay required fee)
- Read verified feed results and enforce freshness/deviation constraints
- Support “cranking” patterns to emulate push/heartbeat feeds

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `@switchboard-xyz/common@5.7.0`
- `@switchboard-xyz/on-demand-solidity@1.1.0`
- `ethers@6.16.0`

## Preconditions

- `OperatorPolicy` exists (chainId, RPC allowlist, contract allowlist, spend limits).

## Inputs to Collect

Always collect:

- `chainId` + network name
- `rpcUrl`
- `crossbarUrl` (default: `https://crossbar.switchboard.xyz`)
- `switchboardContractAddress` (resolve from official deployments)
- `feedId` list (bytes32)

Collect safety policy only if relevant (risk-sensitive logic) or requested:

- `maxAgeSeconds`
- `maxDeviationBps`

## EVM Integration Invariants

- Always compute and pay fee (e.g., `getFee`) before `updateFeeds`.
- For safety-critical logic, accept `updates` as calldata and do update+read inside the same app function.

## Minimal Example

~~~solidity
function updateAndRead(bytes[] calldata updates, bytes32 feedId) external payable {
    uint256 fee = switchboard.getFee(updates);
    switchboard.updateFeeds{value: fee}(updates);
    switchboard.latestUpdate(feedId);
}
~~~

## Playbook

### 1) Resolve deployments and feeds

- Resolve `switchboardContractAddress` from official docs for the chain/network.
- Confirm it is allowlisted by `OperatorPolicy`.
- Obtain `feedId`(s) for the same network.

### 2) Fetch update payloads off-chain (Crossbar)

~~~ts
import { CrossbarClient } from "@switchboard-xyz/common";

const crossbarUrl = process.env.CROSSBAR_URL ?? "https://crossbar.switchboard.xyz";
const crossbar = new CrossbarClient(crossbarUrl);

// For Feed Builder/custom feeds, use the v2 feed-hash flow.
await crossbar.simulateFeed(feedId, false, undefined, network);

const response = await crossbar.fetchV2Update([feedId], {
  chain: "evm",
  network,
  use_timestamp: true,
});

if (!response.encoded) throw new Error("Crossbar returned no encoded update payload");

const updates = [response.encoded];
~~~

### 3) Contract-side recommended pattern (atomic update+use)

~~~solidity
function updateAndUse(bytes[] calldata updates, bytes32[] calldata feedIds) external payable {
    uint256 fee = switchboard.getFee(updates);
    require(msg.value >= fee, "InsufficientFee");

    switchboard.updateFeeds{value: fee}(updates);

    for (uint256 i = 0; i < feedIds.length; i++) {
        // Read latest verified update for feedIds[i]
        // Enforce maxAgeSeconds and maxDeviationBps in your app logic
    }

    // Optional refund of msg.value - fee
}
~~~

### 4) Client-side submit flow

~~~ts
import { ethers } from "ethers";

const switchboard = new ethers.Contract(switchboardContractAddress, SWITCHBOARD_ABI, signer);

const fee = await switchboard.getFee(updates);
const tx = await switchboard.updateFeeds(updates, { value: fee });
await tx.wait();

const latest = await switchboard.latestUpdate(feedId);
~~~

### 5) Cranking pattern (push-like / heartbeat imitation)

Use this when you want other callers to read `latestUpdate(feedId)` without providing `updates` each time.

Tradeoffs:
- Pros: cheaper reads for many consumers; simpler UI integrations.
- Cons: data can go stale between cranks; consumers must enforce staleness.

Crank loop:

~~~ts
async function crankOnce(feedIds: string[]) {
  const response = await crossbar.fetchV2Update(feedIds, {
    chain: "evm",
    network,
    use_timestamp: true,
  });

  if (!response.encoded) {
    throw new Error("Crossbar returned no encoded update payload");
  }

  const updates = [response.encoded];

  const fee = await switchboard.getFee(updates);
  const tx = await switchboard.updateFeeds(updates, { value: fee });
  await tx.wait();
}

// Example: crank every 15 seconds (tune to costs and requirements)
setInterval(() => crankOnce([feedId]).catch(console.error), 15_000);
~~~

Operational guidance:
- Use a dedicated keeper wallet with explicit spend limits.
- For liquidation/settlement flows, prefer atomic update+use even if a crank exists.

## Outputs

Produce an `EvmFeedIntegrationPlan` including:

- chainId/network + RPC/Crossbar URL
- resolved Switchboard contract address (and source)
- feedId(s)
- atomic update+use pattern (recommended) vs crank pattern (optional)
- fee strategy with spend caps
- optional safety policy (maxAge/maxDeviation) if requested

## Troubleshooting Checklist

- Fee too low → always call `getFee(updates)` and set `msg.value`
- Stale timestamp → fetch fresh updates; raise max age only for non-critical paths
- Wrong feed/network → verify feedId and deployment match chainId/network
- Feed Builder custom feed on EVM → use `simulateFeed(...)` and `fetchV2Update(...)`, not `fetchEVMResults(...)`
- `ORACLE_UNAVAILABLE` after successful simulation → treat as managed oracle/gateway availability, not a missing permission

## References

- https://docs.switchboard.xyz/docs-by-chain/evm
- https://docs.switchboard.xyz/docs-by-chain/evm/price-feeds
- https://docs.switchboard.xyz/tooling/crossbar
