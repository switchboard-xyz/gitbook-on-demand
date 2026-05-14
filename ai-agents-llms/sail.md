# SAIL

SAIL is Switchboard's attestation layer for hardware-backed oracle and runtime verification. It uses Trusted Execution Environments (TEEs), currently AMD SEV-SNP, to provide evidence that critical Switchboard runtime code is running in an isolated environment before that runtime is trusted by the network.

For AI agents and autonomous systems, this matters because the data and services they depend on need a clear trust boundary. SAIL helps answer a narrower, more concrete question: did this Switchboard runtime produce an attestation report showing it is running the expected code in the expected hardware-backed environment?

SAIL does not, by itself, prove that an arbitrary AI model made the right decision, that an agent followed every business rule, or that a smart contract is correct. It provides hardware-backed evidence about the runtime that produced or signed data, which applications can combine with normal on-chain checks, quote verification, and application-level authorization.

## What SAIL Provides

**Hardware-backed runtime evidence** - Switchboard runtimes can produce AMD SEV-SNP attestation evidence that guardians and other verifiers can inspect before trusting the runtime.

**Verified oracle execution** - Switchboard uses attestation to confirm that oracle infrastructure is running approved code before it participates in sensitive network workflows.

**TEE-derived runtime identity** - SAIL exposes helpers for deriving enclave-bound keys, so a runtime can sign or identify itself from material tied to the TEE environment.

**Runtime randomness helpers** - SAIL includes randomness utilities for code running inside these environments. Treat these as low-level runtime helpers, not a replacement for chain-specific Switchboard randomness products.

## Where SAIL Shows Up Today

SAIL is part of the infrastructure behind Switchboard's verified oracle network.

- The [TEE architecture page](../how-it-works/technical-architecture/trusted-execution-environments-tees.md) explains why Switchboard uses TEEs and AMD SEV-SNP.
- The Surge docs describe price streaming through a SAIL-verified oracle network for [Solana/SVM](../docs-by-chain/solana-svm/surge/README.md), [EVM](../docs-by-chain/evm/surge/README.md), and [Sui](../docs-by-chain/sui/surge/README.md).
- The current advanced SDK surface is [`@switchboard-xyz/sail-sdk`](https://www.npmjs.com/package/@switchboard-xyz/sail-sdk). It is intended for low-level attestation and runtime work, not as a beginner application tutorial.

There is not currently a runnable SAIL example in `sb-on-demand-examples`. Start with the linked architecture and product docs unless you are working directly on TEE runtime integration.

## Current Developer Surface

The SAIL SDK exposes low-level primitives used by Switchboard runtime infrastructure:

- AMD SEV-SNP attestation helpers for generating attestation reports/evidence.
- JSON attestation helpers for newer Confidential Containers (CoCo) environments.
- Verification helpers for attestation evidence, including an optional verifier feature.
- Enclave-derived key helpers for Ed25519 and secp256k1 runtime identities.
- Runtime randomness helpers for TEE-bound code.

These APIs are advanced infrastructure tools. Most application developers should consume Switchboard through the chain-specific feed, randomness, Surge, or Crossbar docs instead of integrating SAIL directly.
