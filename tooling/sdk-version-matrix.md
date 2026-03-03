# SDK Version Matrix

This page is the canonical version reference for Switchboard docs and skills.

- Baseline date: **March 3, 2026**
- Source of truth: [`tooling/sdk-versions.lock.json`](sdk-versions.lock.json)
- Verification scripts:
  - `./scripts/check-switchboard-dep-drift.sh`
  - `./scripts/verify-switchboard-deps.sh --full`

## Switchboard SDKs

| Package / Crate | Exact Version | Verification Reference | Notes |
| --- | --- | --- | --- |
| `@switchboard-xyz/on-demand` | `3.9.0` | `solana/surge`, `solana/x402`, `sui/surge/basic` | Solana/Surge client SDK |
| `@switchboard-xyz/common` | `5.7.0` | `evm/*`, TS smoke projects | Crossbar client + shared helpers |
| `@switchboard-xyz/on-demand-solidity` | `1.1.0` | `evm/price-feeds`, `evm/randomness/*` | Solidity interfaces/types |
| `@switchboard-xyz/sui-sdk` | `0.1.14` | `sui/feeds/basic`, `sui/surge/basic` | Sui quote utilities |
| `@switchboard-xyz/aptos-sdk` | `0.1.5` | `/tmp/sb-sdk-smoke/aptos` | Aptos client SDK |
| `@switchboard-xyz/iota-sdk` | `0.0.3` | `/tmp/sb-sdk-smoke/iota` | Iota client SDK |
| `switchboard-on-demand` | `0.11.3` | `common/rust-feed-creation`, `solana/feeds/basic`, `solana/randomness/coin-flip` | Rust crate |
| `switchboard-protos` | `0.2.4` | Solana program builds + host checks | Rust protobuf types |

## Companion Dependencies

| Dependency | Exact Version | Reason |
| --- | --- | --- |
| `@solana/web3.js` | `1.98.4` | Solana/Surge/X402 examples |
| `@mysten/sui` | `1.38.0` | Compatible with current Sui docs/examples import surface |
| `@aptos-labs/ts-sdk` | `6.1.0` | Aptos + Movement TS clients |
| `@iota/iota-sdk` | `1.11.0` | Iota TS client |
| `ethers` | `6.16.0` | EVM examples |
| `@coral-xyz/anchor` | `0.32.1` | TS integration in Solana examples |

## Toolchain Baseline

| Tool | Version |
| --- | --- |
| Node.js | `23.11.0` (verified, `>=24` recommended for `@iota/iota-sdk`) |
| Bun | `1.3.6` |
| Rust | `1.89.0-nightly` |
| Anchor CLI | `0.31.1` |
| Solana CLI | `2.3.11` |
| Foundry (`forge`) | `1.5.0` |
| Aptos CLI | `8.1.0` |
| Sui CLI | `1.66.2` |

## Known Verification Notes

- `@mysten/sui` latest `2.x` currently breaks the import surface used in existing docs/examples, so `1.38.0` is pinned until docs/examples migrate.
- `solana/prediction-market` may hit `edition2024` dependency parsing under `cargo build-sbf` on current Solana toolchains. The verifier records this as a warning and runs a fallback host check.
- EVM verification prefers `bun install` but automatically falls back to `npm install` if local Bun/Node linkage causes install failures.
- `sui/feeds/basic` currently has an upstream failing Move unit test; dependency verification uses build/typecheck as the pass gate.
