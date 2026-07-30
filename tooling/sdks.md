# SDKs (Software Developer Kits)

Switchboard SDK versions are pinned and validated in one canonical place:

- [SDK Version Matrix](sdk-version-matrix.md)
- Machine-readable lock file: [`tooling/sdk-versions.lock.json`](sdk-versions.lock.json)

Use the matrix for all docs and code snippets to avoid version drift.

## SDK Links

| Language | Type | Resource | Link |
| --- | --- | --- | --- |
| Rust | SDK | `switchboard-on-demand` | <https://crates.io/crates/switchboard-on-demand> |
| Rust | Docs | `switchboard-on-demand` | <https://switchboard-on-demand-rust-docs.web.app/> |
| TypeScript | SDK (SVM) | `@switchboard-xyz/on-demand` | <https://switchboard-docs.web.app/> |
| TypeScript | SDK (EVM) | `@switchboard-xyz/on-demand-solidity` | <https://switchboard-evm-sdk.web.app> |
| TypeScript | SDK (Sui) | `@switchboard-xyz/sui-sdk` | <https://switchboard-sui-sdk.web.app> |
| TypeScript | SDK (Aptos/Movement) | `@switchboard-xyz/aptos-sdk` | <https://switchboard-aptos-sdk.web.app> |
| TypeScript | SDK (Iota) | `@switchboard-xyz/iota-sdk` | <https://www.npmjs.com/package/@switchboard-xyz/iota-sdk> |
| TypeScript | Common | `@switchboard-xyz/common` | <https://switchboardxyz-common.netlify.app/> |
| TypeScript | Classic PullFeed compatibility | `@switchboard-xyz/common-legacy` | <https://www.npmjs.com/package/@switchboard-xyz/common-legacy> |

Current on-demand JavaScript integrations should use Common `5.8.5` and on-demand
`3.10.6`. on-demand installs common-legacy `1.1.1` transitively; install
common-legacy directly only when importing `LegacyCrossbarClient`.
