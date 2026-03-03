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

## Dependencies

Use exact pins from the [SDK Version Matrix](../../tooling/sdk-version-matrix.md).

- `switchboard-on-demand = "0.11.3"` (Solana Rust)
- `@switchboard-xyz/common@5.7.0` (EVM off-chain resolution)
- `@switchboard-xyz/on-demand-solidity@1.1.0` (EVM on-chain interfaces)

## Preconditions

- `OperatorPolicy` exists (approval/spend limits for on-chain calls).

## Inputs to Collect

- chain + network
- app contract/program identifiers
- minimum settlement delay requirement
- binding requirement (what state transition must be gated)
- replay protections and failure handling requirements

## Minimal Example

Solana settle/read (commit-reveal flow):

~~~rust
use switchboard_on_demand::accounts::RandomnessAccountData;

let data = RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow()).unwrap();
let random_bytes = data.get_value(Clock::get()?.slot)?;
let is_heads = random_bytes[0] % 2 == 0;
~~~

EVM request + settle:

~~~solidity
bytes32 randomnessId = keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)));
switchboard.createRandomness(randomnessId, 1);
// Later, with Crossbar payload:
switchboard.settleRandomness(encodedRandomness);
bool landed = uint256(switchboard.getRandomness(randomnessId).value) % 3 < 2;
~~~

## Solana Playbook (commit/reveal)

1. Create randomness account (one-time) or reuse (`sb.Randomness.create(...)`).
2. Commit in the same transaction as the randomized action (`randomness.commitIx(queue)`).
3. Wait oracle generation window.
4. Reveal and settle in a follow-up transaction (`randomness.revealIx()`).

Requirements:

- bind commit to action
- prevent replay/double-settle
- retries with exponential backoff

### Solana Account and Timing Reference

What the account structure looks like:

- **Switchboard randomness account**: created via `sb.Randomness.create(...)`; stores commit/reveal state parsed with `RandomnessAccountData` (for example `seed_slot`, revealed bytes).
- **App-owned state/PDA**: your program state that binds business logic to randomness (for example storing `randomness_account`, `commit_slot`, wager/round state).

What PDA seeds to use:

- Switchboard randomness account is not documented as an app PDA derivation pattern in this skill; create it using `sb.Randomness.create(...)`.
- App PDAs are application-specific. Tutorial examples use seeds like `[b"playerState", user.key().as_ref()]` and `[b"stateEscrow"]` for app state/escrow.

How oracle assignment works:

- Assignment is handled by Switchboard during request/commit and validated during reveal/settlement.
- Integrators should bind commit and reveal to the same randomness account reference (store at commit, verify at settle) and verify expected slot linkage (for example `seed_slot == commit_slot` in app state).

Generation window duration:

- Treat timing as a **policy decision**, not a hard-coded universal duration.
- For safety-sensitive flows, recommended strict policy is fresh-slot usage (for example `seed_slot == clock.slot - 1`).
- For less latency-sensitive flows, you can allow a looser freshness bound if your threat model allows it.

How to check readiness for reveal:

- On-chain: use `RandomnessAccountData::get_value(clock.slot)`.
  - Commit path guard: if it already returns `Ok(_)`, randomness was already revealed.
  - Settle path guard: require `Ok([u8; 32])`, otherwise treat as not yet resolved.
- Client-side: retry `randomness.revealIx()` with backoff until reveal succeeds.

Compact on-chain pattern:

~~~rust
use switchboard_on_demand::accounts::RandomnessAccountData;

let clock = Clock::get()?;
let randomness_data = RandomnessAccountData::parse(
    ctx.accounts.randomness_account_data.data.borrow()
).unwrap();

// Recommended strict freshness policy (application-level)
if randomness_data.seed_slot != clock.slot - 1 {
    return Err(ErrorCode::RandomnessExpired.into());
}

if is_commit_phase {
    // Commit path: reject already-revealed randomness
    if randomness_data.get_value(clock.slot).is_ok() {
        return Err(ErrorCode::RandomnessAlreadyRevealed.into());
    }
}

if is_settle_phase {
    // Settle path: require revealed value to be available
    let random_bytes = randomness_data
        .get_value(clock.slot)
        .map_err(|_| ErrorCode::RandomnessNotResolved)?;

    // Use random_bytes in app logic
}
~~~

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
