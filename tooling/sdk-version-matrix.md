# SDK Version Matrix

This page is the version reference for Switchboard docs, examples, and verifier tooling.

- Baseline date: **March 24, 2026**
- Source of truth: [`tooling/sdk-versions.lock.json`](sdk-versions.lock.json)
- The lock file now tracks two different views:
  - `sdk_versions` / `companion_versions`: the **canonical verifier pin set** used by local audit scripts
  - `observed_example_versions`: the **exact versions currently pinned in the checked-in `sb-on-demand-examples` manifests**

## Observed Versions In Current Examples

| Package / Crate | Observed Version(s) | Current Example References | Notes |
| --- | --- | --- | --- |
| `@switchboard-xyz/on-demand` | `^3.9.0` | `common`, `solana/feeds/*`, `solana/prediction-market`, `solana/randomness/coin-flip`, `solana/surge`, `solana/x402`, `sui/feeds/basic`, `sui/surge/basic` | Current TypeScript examples are aligned. |
| `@switchboard-xyz/common` | `^5.7.0` | `common`, `common/twitter-follower-count`, `evm/*`, `solana/feeds/*`, `solana/prediction-market`, `solana/randomness/coin-flip`, `solana/surge`, `solana/x402` | Current TypeScript examples are aligned. |
| `@switchboard-xyz/on-demand-solidity` | `^0.0.4`, `^1.1.0` | `evm/price-feeds`, `evm/randomness/*` | Price-feeds and randomness are on different package generations. |
| `@switchboard-xyz/sui-sdk` | `^0.1.14` | `sui/feeds/basic`, `sui/surge/basic` | Aligned across current Sui examples. |
| `switchboard-on-demand` | `0.11.3`, `=0.10.3`, `0.10.0` | `common/rust-feed-creation`, `solana/feeds/*`, `solana/prediction-market`, `solana/randomness/coin-flip` | Rust examples are also split by flow. |
| `switchboard-protos` | `^0.2.1` | `solana/prediction-market` | Only used by the prediction-market program. |

## Canonical Verifier Pin Set

These are the pins currently used by `scripts/verify-switchboard-deps.sh` and related tooling when it normalizes manifests for compatibility checks.

| Package / Crate | Canonical Pin | Notes |
| --- | --- | --- |
| `@switchboard-xyz/on-demand` | `3.9.0` | Matches the current TypeScript example set. |
| `@switchboard-xyz/common` | `5.7.0` | Matches the current shared EVM and Solana TypeScript examples. |
| `@switchboard-xyz/on-demand-solidity` | `1.1.0` | Canonical Solidity interface pin for verifier runs. |
| `@switchboard-xyz/sui-sdk` | `0.1.14` | Matches current Sui examples. |
| `@switchboard-xyz/aptos-sdk` | `0.1.5` | Used in smoke projects. |
| `@switchboard-xyz/iota-sdk` | `0.0.3` | Used in smoke projects. |
| `switchboard-on-demand` | `0.11.3` | Verifier pin; actual Solana program manifests currently vary by example. |
| `switchboard-protos` | `0.2.4` | Verifier pin for Rust compatibility checks. |

## Companion Dependencies

| Dependency | Canonical Pin | Notes |
| --- | --- | --- |
| `@solana/web3.js` | `1.98.0` | Matches current Solana examples. |
| `@mysten/sui` | `1.38.0` | Compatible with current Sui docs/examples import surface. |
| `@aptos-labs/ts-sdk` | `6.1.0` | Aptos + Movement smoke projects. |
| `@iota/iota-sdk` | `1.11.0` | Iota smoke projects. |
| `ethers` | `6.13.1` | Matches the current EVM price-feeds example manifest. |
| `@coral-xyz/anchor` | `0.31.1` | Matches the current Solana example manifests. |

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

## Known Notes

- Current TypeScript example manifests are aligned on `@switchboard-xyz/on-demand@^3.9.0` and `@switchboard-xyz/common@^5.7.0`.
- `@mysten/sui` latest `2.x` still breaks the import surface used in current docs/examples, so `1.38.0` remains pinned.
- `@switchboard-xyz/on-demand-solidity` is still split by flow: `evm/price-feeds` uses `^0.0.4` while the randomness examples use `^1.1.0`.
- `solana/prediction-market` may hit `edition2024` dependency parsing under current Solana toolchains. If `cargo build-sbf` fails there, fall back to a host-side cargo check.
- `sui/feeds/basic` defaults its checked-in `Move.toml` to testnet. Use the explicit `build:testnet`, `build:mainnet`, `deploy:testnet`, and `deploy:mainnet` scripts when documenting or verifying flows.
