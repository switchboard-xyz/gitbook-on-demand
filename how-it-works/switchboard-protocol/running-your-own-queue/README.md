---
description: >-
  This guide is aimed at teams that want to operate their own Oracle Queue
  rather than use the shared Switchboard queues.
---

# Running your own Queue

Most integrations never need this page. Data feeds work out of the box on the
shared Switchboard queues, which you load with `getDefaultQueue()` or
`getDefaultDevnetQueue()` — see [Oracle Queues](../../technical-architecture/oracle-queues.md)
for what a Queue is and why every feed belongs to one.

Creating a Queue is permissionless. You may want your own if you need to:

* **Control which oracles serve your feeds.** Your Queue, your oracle set.
* **Pin the exact software your oracles run**, through the enclave measurement
  allowlist.
* **Set your own reward and timeout parameters** rather than inherit the
  network defaults.
* **Isolate your feeds** from load or incidents on the shared queues.

The trade-off is that you now operate infrastructure: at least one oracle
machine per queue, funded payer keys, and the upgrade discipline described in
[Creating an Oracle Queue](creating-an-oracle-queue.md).

## What is and is not permissionless

|                                        | Permissionless                   |
| -------------------------------------- | -------------------------------- |
| Creating an Oracle Queue               | Yes                              |
| Permissioning oracles onto your Queue  | Yes — you are the queue authority |
| Setting your Queue's enclave allowlist | Yes                              |
| Registering a **Guardian**             | No — see below                   |

Guardians are the network-wide root of trust for TEE attestation, and there is
a single Guardian Queue per Switchboard program deployment. Registering a
guardian requires the program state authority, so on Switchboard's mainnet and
devnet deployments you cannot add your own. Oracles on your Queue are attested
by the existing guardians; your Queue's enclave allowlist is the control you
own.

If you need the entire trust chain, that means running your own program
deployment — see [Running a Guardian Queue](running-a-guardian-queue.md).

## Before you start

* **The `sb` CLI.** Every command here uses it — see [CLI](../../../tooling/cli.md)
  (`npm i -g @switchboard-xyz/cli`). Add `--mainnetBeta` for mainnet or
  `--cluster devnet` for devnet, and `-k ` for the signer.
* **A funded Solana keypair** to act as queue authority.
* **At least one oracle host.** Oracles run in AMD SEV-SNP, and provisioning one
  is covered end to end in
  [Running a Switchboard Oracle](../running-a-switchboard-oracle/).

## Next

[Creating an Oracle Queue](creating-an-oracle-queue.md)

[Running a Guardian Queue](running-a-guardian-queue.md)
