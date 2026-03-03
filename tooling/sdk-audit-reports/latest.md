# Switchboard SDK Audit Report

- Date: 2026-03-02
- Lock file: /Users/jack/Code/Switchboard/gitbook-on-demand/tooling/sdk-versions.lock.json
- Examples source: /Users/jack/Code/Switchboard/gitbook-on-demand/../sb-on-demand-examples
- Temp workspace: /tmp/sb-deps-audit-2026-03-02

## Environment

| Tool | Version |
| --- | --- |
| node | v23.11.0 |
| npm | 10.9.2 |
| bun | 1.3.6 |
| cargo | 1.89.0-nightly |
| rustc | 1.89.0-nightly |
| anchor | 0.31.1 |
| solana | 2.3.11 |
| forge | 1.5.0-stable
1c57854462289b2e71ee7654cd6666217ed86ffd
2025-11-26T09:16:58.269730000Z
maxperf |
| aptos | 8.1.0 |
| sui | 1.66.2-homebrew |

## Smoke Results

| Step | CWD | Command | Status | Exit |
| --- | --- | --- | --- | --- |
| rust-common | `common/rust-feed-creation` | `cargo check` | PASS | 0 |

<details><summary>rust-common log</summary>

```text
    Checking spl-token v7.0.0
    Checking spl-token v8.0.0
    Checking spl-token-confidential-transfer-ciphertext-arithmetic v0.2.1
    Checking spl-token-confidential-transfer-ciphertext-arithmetic v0.3.1
    Checking solana-account-decoder-client-types v2.3.13
    Checking spl-token-group-interface v0.5.0
    Checking spl-token-group-interface v0.6.0
    Checking spl-token-confidential-transfer-proof-generation v0.2.0
    Checking hyper-rustls v0.24.2
    Checking hyper-tls v0.5.0
    Checking spl-token-confidential-transfer-proof-generation v0.4.1
    Checking kaigan v0.2.6
    Checking envy v0.4.2
    Checking hex v0.4.3
    Checking hash32 v0.3.1
    Checking encoding_rs v0.8.35
    Checking mime v0.3.17
    Checking siphasher v0.3.11
    Checking sync_wrapper v0.1.2
    Checking solana-config-program-client v0.0.2
    Checking switchboard-common v0.11.6
    Checking spl-token-2022 v8.0.1
    Checking solana-epoch-rewards-hasher v2.2.1
    Checking spl-token-2022 v6.0.0
    Checking jsonpath-rust v0.3.5
    Checking solana-transaction-status-client-types v2.3.13
    Checking prost v0.12.6
    Checking reqwest v0.11.27
   Compiling anchor-attribute-program v0.32.1
    Checking solana-rpc-client-types v2.3.13
    Checking solana-rent-collector v2.3.0
    Checking ark-poly v0.4.2
    Checking solana-udp-client v2.3.13
    Checking solana-invoke v0.4.0
    Checking tungstenite v0.24.0
    Checking pbjson v0.7.0
    Checking solana-offchain-message v2.2.1
   Compiling anchor-attribute-access-control v0.32.1
   Compiling anchor-derive-serde v0.32.1
   Compiling anchor-attribute-error v0.32.1
   Compiling anchor-attribute-account v0.32.1
   Compiling anchor-derive-accounts v0.32.1
   Compiling anchor-attribute-constant v0.32.1
   Compiling anchor-attribute-event v0.32.1
    Checking Inflector v0.11.4
    Checking ark-ec v0.4.2
    Checking solana-system-transaction v2.2.1
    Checking solana-rent-debits v2.2.1
    Checking solana-fee-structure v2.3.0
    Checking solana-nonce-account v2.2.1
    Checking solana-reserved-account-keys v2.2.2
    Checking solana-presigner v2.2.1
    Checking solana-loader-v3-interface v3.0.0
    Checking solana-compute-budget-interface v2.2.2
    Checking spl-associated-token-account-client v2.0.0
   Compiling anchor-derive-space v0.32.1
    Checking solana-validator-exit v2.2.1
    Checking spl-associated-token-account v6.0.0
    Checking solana-account-decoder v2.3.13
    Checking tokio-tungstenite v0.24.0
    Checking switchboard-utils v0.9.2
    Checking faster-hex v0.10.0
    Checking dashmap v6.1.0
    Checking solana-rpc-client-api v2.3.13
    Checking solana-pubsub-client v2.3.13
    Checking anchor-lang v0.32.1
    Checking bs58 v0.4.0
    Checking base64ct v1.7.3
    Checking solana-rpc-client v2.3.13
    Checking solana-quic-client v2.3.13
    Checking ark-bn254 v0.4.0
    Checking solana-bn254 v2.2.2
    Checking solana-thin-client v2.3.13
    Checking solana-rpc-client-nonce-utils v2.3.13
    Checking solana-tpu-client v2.3.13
    Checking solana-sdk v2.3.1
    Checking solana-client v2.3.13
    Checking switchboard-on-demand v0.11.3
    Checking rust-feed-creation v0.1.0 (/private/tmp/sb-deps-audit-2026-03-02/common/rust-feed-creation)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 32.90s
```
</details>

| solana-feeds | `solana/feeds/basic` | `cargo build-sbf` | PASS | 0 |

<details><summary>solana-feeds log</summary>

```text
   Compiling faster-hex v0.10.0
   Compiling proc-macro-crate v0.1.5
   Compiling anchor-lang-idl v0.1.2
   Compiling switchboard-protos v0.2.4
   Compiling borsh-derive v0.10.4
   Compiling borsh v0.10.4
   Compiling solana-pubkey v2.2.1
   Compiling solana-borsh v2.2.1
   Compiling solana-instruction v2.2.1
   Compiling solana-sdk-ids v2.2.1
   Compiling solana-nonce v2.2.1
   Compiling solana-sysvar-id v2.2.1
   Compiling solana-clock v2.2.1
   Compiling solana-rent v2.2.1
   Compiling solana-slot-hashes v2.2.1
   Compiling solana-epoch-schedule v2.2.1
   Compiling solana-slot-history v2.2.1
   Compiling solana-program-error v2.2.2
   Compiling solana-system-interface v1.0.0
   Compiling solana-serialize-utils v2.2.1
   Compiling solana-stable-layout v2.2.1
   Compiling solana-account-info v2.2.1
   Compiling solana-bincode v2.2.1
   Compiling solana-transaction-error v2.2.1
   Compiling solana-last-restart-slot v2.2.1
   Compiling solana-cpi v2.2.1
   Compiling solana-instructions-sysvar v2.2.2
   Compiling solana-program-entrypoint v2.2.1
   Compiling solana-account v2.2.1
   Compiling solana-epoch-rewards v2.2.1
   Compiling solana-stake-interface v1.2.1
   Compiling solana-message v2.2.1
   Compiling solana-vote-interface v2.2.1
   Compiling solana-feature-gate-interface v2.2.2
   Compiling solana-loader-v4-interface v2.2.1
   Compiling solana-loader-v3-interface v3.0.0
   Compiling solana-address-lookup-table-interface v2.2.2
   Compiling solana-program-pack v2.2.1
   Compiling solana-loader-v2-interface v2.2.1
   Compiling solana-sysvar v2.2.1
   Compiling solana-program v2.2.1
   Compiling anchor-derive-serde v0.31.1
   Compiling anchor-derive-accounts v0.31.1
   Compiling anchor-attribute-event v0.31.1
   Compiling anchor-attribute-access-control v0.31.1
   Compiling anchor-attribute-error v0.31.1
   Compiling anchor-attribute-account v0.31.1
   Compiling anchor-attribute-constant v0.31.1
   Compiling anchor-attribute-program v0.31.1
   Compiling anchor-lang v0.31.1
   Compiling switchboard-on-demand v0.11.3
   Compiling basic-oracle-example v0.1.0 (/private/tmp/sb-deps-audit-2026-03-02/solana/feeds/basic/programs/basic-oracle-example)
warning: unexpected `cfg` condition value: `custom-heap`
  --> programs/basic-oracle-example/src/lib.rs:11:1
   |
11 | #[program]
   | ^^^^^^^^^^
   |
   = note: expected values for `feature` are: `anchor-debug`, `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
   = help: consider adding `custom-heap` as a feature in `Cargo.toml`
   = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
   = note: `#[warn(unexpected_cfgs)]` on by default
   = note: this warning originates in the macro `$crate::custom_heap_default` which comes from the expansion of the attribute macro `program` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `custom-panic`
  --> programs/basic-oracle-example/src/lib.rs:11:1
   |
11 | #[program]
   | ^^^^^^^^^^
   |
   = note: expected values for `feature` are: `anchor-debug`, `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
   = help: consider adding `custom-panic` as a feature in `Cargo.toml`
   = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
   = note: this warning originates in the macro `$crate::custom_panic_default` which comes from the expansion of the attribute macro `program` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: `basic-oracle-example` (lib) generated 2 warnings
    Finished `release` profile [optimized] target(s) in 45.01s
[2026-03-03T03:22:24.026059000Z WARN  cargo_build_sbf] Package 'basic-oracle-example' has two crate types defined: cdylib and lib. This setting precludes link-time optimizations (LTO). Use cdylib for programs to be deployed and rlib for packages to be imported by other programs as libraries.
[2026-03-03T03:22:24.078987000Z WARN  cargo_build_sbf::post_processing] The following functions are undefined and not known syscalls ["abort", "sol_log_", "sol_memcpy_", "sol_get_rent_sysvar", "sol_invoke_signed_rust", "sol_memset_", "sol_try_find_program_address", "sol_log_pubkey", "sol_sha256", "sol_memmove_", "sol_memcmp_"].
[2026-03-03T03:22:24.079011000Z WARN  cargo_build_sbf::post_processing]          Calling them will trigger a run-time error.
```
</details>

| solana-randomness | `solana/randomness/coin-flip` | `cargo build-sbf` | PASS | 0 |

<details><summary>solana-randomness log</summary>

```text
warning: unexpected `cfg` condition value: `custom-panic`
  --> programs/sb-randomness/src/lib.rs:36:1
   |
36 | #[program]
   | ^^^^^^^^^^
   |
   = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
   = help: consider adding `custom-panic` as a feature in `Cargo.toml`
   = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
   = note: this warning originates in the macro `$crate::custom_panic_default` which comes from the expansion of the attribute macro `program` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `anchor-debug`
  --> programs/sb-randomness/src/lib.rs:36:1
   |
36 | #[program]
   | ^^^^^^^^^^
   |
   = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
   = help: consider adding `anchor-debug` as a feature in `Cargo.toml`
   = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
   = note: this warning originates in the attribute macro `program` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `anchor-debug`
  --> programs/sb-randomness/src/lib.rs:36:1
   |
36 | #[program]
   | ^^^^^^^^^^
   |
   = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
   = help: consider adding `anchor-debug` as a feature in `Cargo.toml`
   = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
   = note: this warning originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `anchor-debug`
   --> programs/sb-randomness/src/lib.rs:179:10
    |
179 | #[derive(Accounts)]
    |          ^^^^^^^^
    |
    = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
    = help: consider adding `anchor-debug` as a feature in `Cargo.toml`
    = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
    = note: this warning originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `anchor-debug`
   --> programs/sb-randomness/src/lib.rs:192:10
    |
192 | #[derive(Accounts)]
    |          ^^^^^^^^
    |
    = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
    = help: consider adding `anchor-debug` as a feature in `Cargo.toml`
    = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
    = note: this warning originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: unexpected `cfg` condition value: `anchor-debug`
   --> programs/sb-randomness/src/lib.rs:207:10
    |
207 | #[derive(Accounts)]
    |          ^^^^^^^^
    |
    = note: expected values for `feature` are: `cpi`, `default`, `idl-build`, `no-entrypoint`, `no-idl`, and `no-log-ix-name`
    = help: consider adding `anchor-debug` as a feature in `Cargo.toml`
    = note: see <https://doc.rust-lang.org/nightly/rustc/check-cfg/cargo-specifics.html> for more information about checking conditional configuration
    = note: this warning originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: use of deprecated method `anchor_lang::prelude::AccountInfo::<'a>::realloc`: Use AccountInfo::resize() instead
  --> programs/sb-randomness/src/lib.rs:36:1
   |
36 | #[program]
   | ^^^^^^^^^^
   |
   = note: `#[warn(deprecated)]` on by default
   = note: this warning originates in the attribute macro `program` (in Nightly builds, run with -Z macro-backtrace for more info)

warning: `sb-randomness` (lib) generated 13 warnings (5 duplicates)
    Finished `release` profile [optimized] target(s) in 48.84s
[2026-03-03T03:23:14.444835000Z WARN  cargo_build_sbf] Package 'sb-randomness' has two crate types defined: cdylib and lib. This setting precludes link-time optimizations (LTO). Use cdylib for programs to be deployed and rlib for packages to be imported by other programs as libraries.
[2026-03-03T03:23:14.491598000Z WARN  cargo_build_sbf::post_processing] The following functions are undefined and not known syscalls ["abort", "sol_log_", "sol_memcpy_", "sol_invoke_signed_rust", "sol_get_clock_sysvar", "sol_get_rent_sysvar", "sol_memset_", "sol_try_find_program_address", "sol_create_program_address", "sol_log_pubkey", "sol_sha256", "sol_memcmp_"].
[2026-03-03T03:23:14.491618000Z WARN  cargo_build_sbf::post_processing]          Calling them will trigger a run-time error.
```
</details>

| solana-prediction-market | `solana/prediction-market` | `cargo build-sbf` | WARN | 1 |

<details><summary>solana-prediction-market log</summary>

```text
 Downloading crates ...
error: failed to download `constant_time_eq v0.4.2`

Caused by:
  unable to get packages from source

Caused by:
  failed to parse manifest at `/Users/jack/.cargo/registry/src/index.crates.io-6f17d22bba15001f/constant_time_eq-0.4.2/Cargo.toml`

Caused by:
  feature `edition2024` is required

  The package requires the Cargo feature called `edition2024`, but that feature is not stabilized in this version of Cargo (1.84.0 (12fe57a9d 2025-04-07)).
  Consider trying a more recent nightly release.
  See https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#edition-2024 for more information about the status of this feature.
```
</details>

| solana-prediction-market-fallback | `solana/prediction-market` | `cargo +nightly check --manifest-path programs/prediction-market/Cargo.toml` | WARN | 101 |

<details><summary>solana-prediction-market-fallback log</summary>

```text
    = note: perhaps two different versions of crate `anchor_lang` are being used?
note: there are multiple different versions of crate `anchor_lang` in the dependency graph
   --> /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-lang-0.31.1/src/lib.rs:338:1
    |
338 | pub trait Owner {
    | ^^^^^^^^^^^^^^^ this is the required trait
    |
   ::: programs/prediction-market/src/lib.rs:1:5
    |
1   | use anchor_lang::prelude::*;
    |     ----------- one version of crate `anchor_lang` used here, as a direct dependency of the current crate
2   | use switchboard_on_demand::{SlotHashes, Instructions, QuoteVerifier};
    |     --------------------- one version of crate `anchor_lang` used here, as a dependency of crate `switchboard_on_demand`
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/switchboard-on-demand-0.10.8/src/on_demand/accounts/queue.rs:25:1
    |
25  | pub struct QueueAccountData {
    | --------------------------- this type doesn't implement the required trait
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-lang-0.32.1/src/lib.rs:204:1
    |
204 | pub trait Accounts<'info, B>: ToAccountMetas + ToAccountInfos<'info> + Sized {
    | ---------------------------------------------------------------------------- this is the found trait
    = help: you can use `cargo tree` to explore your dependency tree
note: required by a bound in `anchor_lang::prelude::AccountLoader`
   --> /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-lang-0.31.1/src/accounts/account_loader.rs:96:47
    |
96  | pub struct AccountLoader<'info, T: ZeroCopy + Owner> {
    |                                               ^^^^^ required by this bound in `AccountLoader`

error[E0599]: the method `to_account_infos` exists for struct `AccountLoader<'info, QueueAccountData>`, but its trait bounds were not satisfied
   --> programs/prediction-market/src/lib.rs:115:10
    |
115 | #[derive(Accounts)]
    |          ^^^^^^^^ method cannot be called on `AccountLoader<'info, QueueAccountData>` due to unsatisfied trait bounds
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/switchboard-on-demand-0.10.8/src/on_demand/accounts/queue.rs:25:1
    |
25  | pub struct QueueAccountData {
    | --------------------------- doesn't satisfy `QueueAccountData: anchor_lang::Owner` or `QueueAccountData: anchor_lang::ZeroCopy`
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-lang-0.31.1/src/accounts/account_loader.rs:96:1
    |
96  | pub struct AccountLoader<'info, T: ZeroCopy + Owner> {
    | ---------------------------------------------------- doesn't satisfy `_: ToAccountInfos<'_>`
    |
    = note: the following trait bounds were not satisfied:
            `QueueAccountData: anchor_lang::ZeroCopy`
            which is required by `anchor_lang::prelude::AccountLoader<'info, QueueAccountData>: anchor_lang::ToAccountInfos<'_>`
            `QueueAccountData: anchor_lang::Owner`
            which is required by `anchor_lang::prelude::AccountLoader<'info, QueueAccountData>: anchor_lang::ToAccountInfos<'_>`
    = note: this error originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

error[E0599]: the method `to_account_metas` exists for struct `AccountLoader<'info, QueueAccountData>`, but its trait bounds were not satisfied
   --> programs/prediction-market/src/lib.rs:115:10
    |
115 | #[derive(Accounts)]
    |          ^^^^^^^^ method cannot be called on `AccountLoader<'info, QueueAccountData>` due to unsatisfied trait bounds
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/switchboard-on-demand-0.10.8/src/on_demand/accounts/queue.rs:25:1
    |
25  | pub struct QueueAccountData {
    | --------------------------- doesn't satisfy `QueueAccountData: anchor_lang::Owner` or `QueueAccountData: anchor_lang::ZeroCopy`
    |
   ::: /Users/jack/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-lang-0.31.1/src/accounts/account_loader.rs:96:1
    |
96  | pub struct AccountLoader<'info, T: ZeroCopy + Owner> {
    | ---------------------------------------------------- doesn't satisfy `_: ToAccountMetas`
    |
    = note: the following trait bounds were not satisfied:
            `QueueAccountData: anchor_lang::ZeroCopy`
            which is required by `anchor_lang::prelude::AccountLoader<'info, QueueAccountData>: anchor_lang::ToAccountMetas`
            `QueueAccountData: anchor_lang::Owner`
            which is required by `anchor_lang::prelude::AccountLoader<'info, QueueAccountData>: anchor_lang::ToAccountMetas`
    = note: this error originates in the derive macro `Accounts` (in Nightly builds, run with -Z macro-backtrace for more info)

Some errors have detailed explanations: E0277, E0599.
For more information about an error, try `rustc --explain E0277`.
warning: `prediction-market` (lib) generated 6 warnings
error: could not compile `prediction-market` (lib) due to 10 previous errors; 6 warnings emitted
```
</details>

| evm-price-feeds | `evm/price-feeds` | `(bun install || npm install) && ([ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git) && forge build` | PASS | 0 |

<details><summary>evm-price-feeds log</summary>

```text
  = help: https://book.getfoundry.sh/reference/forge/forge-lint#unaliased-plain-import

note[unwrapped-modifier-logic]: wrap modifier logic to reduce code size
   --> src/SwitchboardPriceConsumer.sol:112:5
    |
112 | /     modifier onlyOwner() {
113 | |         if (msg.sender != owner) revert Unauthorized();
114 | |         _;
115 | |     }
    | |_____^
    |
help: wrap modifier logic to reduce code size
    |
112 ~     modifier onlyOwner() {
113 +         _onlyOwner();
114 +         _;
115 +     }
116 + 
117 +     function _onlyOwner() internal {
118 +         if (msg.sender != owner) revert Unauthorized();
119 +     }
    |
    = help: https://book.getfoundry.sh/reference/forge/forge-lint#unwrapped-modifier-logic

warning[unsafe-typecast]: typecasts that can truncate values should be checked
   --> src/SwitchboardPriceConsumer.sol:333:41
    |
333 |         uint128 absOld = oldValue < 0 ? uint128(-oldValue) : uint128(oldValue);
    |                                         ^^^^^^^^^^^^^^^^^^
    |
    = note: consider disabling this lint if you're certain the cast is safe
            
            // casting to 'uint128' is safe because [explain why]
            // forge-lint: disable-next-line(unsafe-typecast)
            
            
    = help: https://book.getfoundry.sh/reference/forge/forge-lint#unsafe-typecast

warning[unsafe-typecast]: typecasts that can truncate values should be checked
   --> src/SwitchboardPriceConsumer.sol:333:62
    |
333 |         uint128 absOld = oldValue < 0 ? uint128(-oldValue) : uint128(oldValue);
    |                                                              ^^^^^^^^^^^^^^^^^
    |
    = note: consider disabling this lint if you're certain the cast is safe
            
            // casting to 'uint128' is safe because [explain why]
            // forge-lint: disable-next-line(unsafe-typecast)
            
            
    = help: https://book.getfoundry.sh/reference/forge/forge-lint#unsafe-typecast

warning[unsafe-typecast]: typecasts that can truncate values should be checked
   --> src/SwitchboardPriceConsumer.sol:334:41
    |
334 |         uint128 absNew = newValue < 0 ? uint128(-newValue) : uint128(newValue);
    |                                         ^^^^^^^^^^^^^^^^^^
    |
    = note: consider disabling this lint if you're certain the cast is safe
            
            // casting to 'uint128' is safe because [explain why]
            // forge-lint: disable-next-line(unsafe-typecast)
            
            
    = help: https://book.getfoundry.sh/reference/forge/forge-lint#unsafe-typecast

warning[unsafe-typecast]: typecasts that can truncate values should be checked
   --> src/SwitchboardPriceConsumer.sol:334:62
    |
334 |         uint128 absNew = newValue < 0 ? uint128(-newValue) : uint128(newValue);
    |                                                              ^^^^^^^^^^^^^^^^^
    |
    = note: consider disabling this lint if you're certain the cast is safe
            
            // casting to 'uint128' is safe because [explain why]
            // forge-lint: disable-next-line(unsafe-typecast)
            
            
    = help: https://book.getfoundry.sh/reference/forge/forge-lint#unsafe-typecast

```
</details>

| evm-randomness-coin-flip | `evm/randomness/coin-flip` | `(bun install || npm install) && ([ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git) && forge build` | PASS | 0 |

<details><summary>evm-randomness-coin-flip log</summary>

```text
bun install v1.3.6 (d530ed99)
Saved lockfile

+ @switchboard-xyz/common@5.7.0
+ @switchboard-xyz/on-demand-solidity@1.1.0

98 packages installed [968.00ms]
Installing forge-std in /private/tmp/sb-deps-audit-2026-03-02/evm/randomness/coin-flip/lib/forge-std (url: https://github.com/foundry-rs/forge-std, tag: None)
Cloning into '/private/tmp/sb-deps-audit-2026-03-02/evm/randomness/coin-flip/lib/forge-std'...
    Installed forge-std
Compiling 19 files with Solc 0.8.30
Solc 0.8.30 finished in 432.31ms
Compiler run successful!
note[asm-keccak256]: use of inefficient hashing mechanism; consider using inline assembly
  --> src/CoinFlip.sol:41:32
   |
41 |         bytes32 randomnessId = keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)));
   |                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: https://book.getfoundry.sh/reference/forge/forge-lint#asm-keccak256

```
</details>

| evm-randomness-pancake-stacker | `evm/randomness/pancake-stacker` | `(bun install || npm install) && ([ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git) && forge build` | PASS | 0 |

<details><summary>evm-randomness-pancake-stacker log</summary>

```text
bun install v1.3.6 (d530ed99)
Saved lockfile

+ @switchboard-xyz/common@5.7.0
+ @switchboard-xyz/on-demand-solidity@1.1.0

98 packages installed [902.00ms]
Installing forge-std in /private/tmp/sb-deps-audit-2026-03-02/evm/randomness/pancake-stacker/lib/forge-std (url: https://github.com/foundry-rs/forge-std, tag: None)
Cloning into '/private/tmp/sb-deps-audit-2026-03-02/evm/randomness/pancake-stacker/lib/forge-std'...
    Installed forge-std
Compiling 19 files with Solc 0.8.30
Solc 0.8.30 finished in 427.16ms
Compiler run successful!
note[asm-keccak256]: use of inefficient hashing mechanism; consider using inline assembly
  --> src/PancakeStacker.sol:36:32
   |
36 |         bytes32 randomnessId = keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1)));
   |                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: https://book.getfoundry.sh/reference/forge/forge-lint#asm-keccak256

```
</details>

| sui-feeds-build | `sui/feeds/basic` | `npm install && npm run build` | PASS | 0 |

<details><summary>sui-feeds-build log</summary>

```text

added 181 packages, and audited 182 packages in 9s

28 packages are looking for funding
  run `npm fund` for details

6 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

> sui-feeds-basic@1.0.0 build
> sui move build

INCLUDING DEPENDENCY MoveStdlib
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY Switchboard
BUILDING example
```
</details>

| sui-feeds-test | `sui/feeds/basic` | `npm run test` | WARN | 1 |

<details><summary>sui-feeds-test log</summary>

```text

> sui-feeds-basic@1.0.0 test
> sui move test

INCLUDING DEPENDENCY MoveStdlib
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY Switchboard
BUILDING example
Running Move unit tests
[ FAIL    ] example::example::test_collateral_ratio_calculation
[ PASS    ] example::example::test_quote_consumer_creation

Test failures:

Failures in example::example:

┌── test_collateral_ratio_calculation ──────
│ error[E11001]: test failure
│     ┌─ ./sources/example.move:404:5
│     │
│ 384 │ fun test_collateral_ratio_calculation() {
│     │     --------------------------------- In this function in example::example
│     ·
│ 404 │     assert!(ratio == 10000, 0);
│     │     ^^^^^^^^^^^^^^^^^^^^^^^^^^ Test was not expected to error, but it aborted with code 0 originating in the module example::example rooted here
│ 
│ 
└──────────────────

Test result: FAILED. Total tests: 2; passed: 1; failed: 1
```
</details>

| sui-surge-ts | `sui/surge/basic` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>sui-surge-ts log</summary>

```text

added 193 packages, and audited 194 packages in 2s

27 packages are looking for funding
  run `npm fund` for details

7 vulnerabilities (1 moderate, 6 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```
</details>

| solana-surge-ts | `solana/surge` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>solana-surge-ts log</summary>

```text

added 183 packages, and audited 184 packages in 4s

19 packages are looking for funding
  run `npm fund` for details

5 vulnerabilities (1 moderate, 4 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```
</details>

| solana-x402-ts | `solana/x402` | `pnpm install --frozen-lockfile || pnpm install && pnpm exec tsc --noEmit` | PASS | 0 |

<details><summary>solana-x402-ts log</summary>

```text
! The local project doesn't define a 'packageManager' field. Corepack will now add one referencing pnpm@10.14.0+sha512.ad27a79641b49c3e481a16a805baa71817a04bbe06a38d17e60e2eaee83f6a146c6a688125f5792e48dd5ba30e7da52a5cda4c3992b9ccf333f9ce223af84748.
! For more details about this field, consult the documentation at https://nodejs.org/api/packages.html#packagemanager

 ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json

Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"

  Failure reason:
  specifiers in the lockfile don't match specifiers in package.json:
* 4 dependencies are mismatched:
  - @coral-xyz/anchor (lockfile: ^0.31.1, manifest: 0.32.1)
  - @solana/web3.js (lockfile: ^1.98.0, manifest: 1.98.4)
  - @switchboard-xyz/common (lockfile: ^5.3.1, manifest: 5.7.0)
  - @switchboard-xyz/on-demand (lockfile: ^3.7.3, manifest: 3.9.0)

Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 258, reused 258, downloaded 0, added 0
Packages: +267
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 267, reused 267, downloaded 0, added 219
Progress: resolved 267, reused 267, downloaded 0, added 266
Progress: resolved 267, reused 267, downloaded 0, added 267, done
 WARN  Issues with peer dependencies found
.
└─┬ @x402/svm 2.3.0
  └─┬ @solana-program/token-2022 0.6.1
    └── ✕ unmet peer @solana/sysvars@^5.0: found 6.0.1

dependencies:
+ @coral-xyz/anchor 0.32.1
+ @solana/kit 6.0.1
+ @solana/spl-token 0.4.14
+ @solana/web3.js 1.98.4
+ @switchboard-xyz/common 5.7.0
+ @switchboard-xyz/on-demand 3.9.0
+ @x402/fetch 2.3.0
+ @x402/svm 2.3.0
+ yargs 17.7.2

devDependencies:
+ @types/node 22.19.8
+ @types/yargs 17.0.35
+ ts-node 10.9.2
+ typescript 5.9.3

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bigint-buffer, bufferutil, protobufjs,              │
│   utf-8-validate.                                                            │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

Done in 4s using pnpm v10.14.0
```
</details>

| aptos-smoke | `/tmp/sb-sdk-smoke/aptos` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>aptos-smoke log</summary>

```text

up to date, audited 148 packages in 521ms

32 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```
</details>

| movement-smoke | `/tmp/sb-sdk-smoke/movement` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>movement-smoke log</summary>

```text

up to date, audited 148 packages in 464ms

32 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```
</details>

| iota-smoke | `/tmp/sb-sdk-smoke/iota` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>iota-smoke log</summary>

```text
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@iota/iota-sdk@1.11.0',
npm warn EBADENGINE   required: { node: '>=24' },
npm warn EBADENGINE   current: { node: 'v23.11.0', npm: '10.9.2' }
npm warn EBADENGINE }

up to date, audited 122 packages in 467ms

23 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```
</details>

| sui-smoke | `/tmp/sb-sdk-smoke/sui` | `npm install && npx tsc --noEmit` | PASS | 0 |

<details><summary>sui-smoke log</summary>

```text

up to date, audited 180 packages in 530ms

25 packages are looking for funding
  run `npm fund` for details

6 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```
</details>

## Summary

- Hard failures: 0
