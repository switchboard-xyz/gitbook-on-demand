---
name: switchboard-randomness
version: 1.0.3
updated: 2026-02-19
depends_on:
  - switchboard
---

# Switchboard Randomness Skill

## Purpose

Implement verifiable randomness with Switchboard:

- Solana: commit → generate → reveal (commit-reveal)
- EVM: request → resolve via Crossbar → settle on-chain

## Preconditions

- `OperatorPolicy` exists (approval/spend limits for on-chain calls).

## Inputs to Collect

- chain + network
- app contract/program identifiers
- minimum settlement delay requirement
- binding requirement (what state transition must be gated)
- replay protections and failure handling requirements

## Solana Playbook (commit/reveal)

1. Create randomness account (one-time) or reuse.
2. Commit in the same transaction as the randomized action.
3. Wait oracle generation window.
4. Reveal and settle in a follow-up transaction.

Requirements:

- bind commit to action
- prevent replay/double-settle
- retries with exponential backoff

## EVM Playbook (request/resolve/settle)

1. Request on-chain with a unique `randomnessId`.
2. Resolve off-chain via Crossbar to obtain an encoded settlement payload.
3. Settle on-chain, then read randomness value and execute logic.

Contract requirements:

- enforce minimum settlement delay
- CEI pattern (clear state before external calls)
- validate oracle assignment matches stored assignment

## References

- https://docs.switchboard.xyz/docs-by-chain/solana-svm/randomness
- https://docs.switchboard.xyz/docs-by-chain/evm/randomness
- https://docs.switchboard.xyz/tooling/crossbar
