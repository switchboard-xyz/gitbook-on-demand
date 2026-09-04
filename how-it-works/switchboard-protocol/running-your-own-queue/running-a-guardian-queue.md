---
description: >-
  What the Guardian Queue is, why it is not permissionless, and how to run one
  on your own Switchboard deployment.
---

# Running a Guardian Queue

Guardians are the root of trust for TEE attestation. Before an oracle can serve data, it must prove to guardians that it is running approved software inside a genuine AMD SEV-SNP enclave. The **Guardian Queue** is the registry of the nodes allowed to make that judgement — see [Node Architecture](../../technical-architecture/node-architecture.md) for where guardians sit in the network.

## Why this is not permissionless

Unlike an Oracle Queue, you cannot create a Guardian Queue that the network will honour, and you cannot add yourself to the existing one.

* **There is one Guardian Queue per program deployment.** It is a single field on the program's global state account. An Oracle Queue cannot nominate guardians of its own — attestation always resolves through the deployment's Guardian Queue.
* **Registering a guardian requires the program state authority.** On Switchboard's mainnet and devnet deployments that authority is Switchboard. If you want to operate a guardian on the main network, that is a conversation with the team, not a command you can run.

So oracles on [your own Oracle Queue](creating-an-oracle-queue.md) are attested by Switchboard's guardians. What you control on your Queue is the enclave allowlist — which software you accept — and that is usually the control people actually want.

Running your own Guardian Queue means running your own Switchboard program deployment. That is a legitimate thing to do for a private network, a testnet, or local development, and the rest of this page covers it.

## How attestation flows

Worth understanding before you operate any part of it:

1. The oracle generates a SEV-SNP attestation report over a checksum binding its identity, its enclave measurement, a recent slot hash, and the public keys it intends to sign with.
2. It sends that report to guardians on the Guardian Queue, through their public gateways.
3. Each guardian verifies the report against AMD's certificate chain, recomputes the checksum, confirms it matches the report data, and returns a signature.
4. The **oracle** submits those signatures on-chain to have its enclave marked verified. The guardian never transacts on the oracle's behalf.
5. The now-verified oracle heartbeats onto its Oracle Queue and publishes its gateway URI.

Attestations expire. Oracles re-attest on a rolling basis, and a Queue's `maxQuoteVerificationAge` bounds how long one stays valid.

A guardian signs with its own authority key rather than an enclave-derived key — guardians are trusted by registration, not by measurement. They still run on SEV-SNP hardware, because the node image requires it.

## Running your own deployment

{% hint style="info" %}
This is for private networks, testnets and local development. Nothing here affects Switchboard's mainnet or devnet deployments.
{% endhint %}

**1. Deploy the Switchboard program** and note its program ID. Pass `--programId ` on every command below, or the CLI will target the canonical deployment instead of yours.

**2. Initialise the program state.** There is no CLI command for this; call it through the SDK. The payer of that transaction becomes the state authority — the key that can register guardians.

```typescript
import { State } from '@switchboard-xyz/on-demand';

const [state, sig] = await State.create(program);
```

**3. Create a Queue to serve as the Guardian Queue**, then point the state at it:

```bash
sb solana on-demand queue init --cluster localnet -k  --programId 

sb solana on-demand state configure --cluster localnet -k  \
  --programId  \
  --guardianQueue 
```

**4. Create and register your guardians:**

```bash
sb solana on-demand guardian create --cluster localnet -k  \
  --programId 

sb solana on-demand guardian register --cluster localnet -k  \
  --programId  \
  --guardian 
```

`guardian create` reads the Guardian Queue from the program state, so it takes no queue argument. `guardian register` must be signed by the state authority, and takes `--disable` to deregister.

**5. Create your Oracle Queues** as normal, following [Creating an Oracle Queue](creating-an-oracle-queue.md). They will attest through the guardians you just registered.

### Cold start

The first guardian has no one to attest it. The program handles this: while the Guardian Queue is empty, the on-chain signature check is skipped, so the first guardian can bootstrap itself. Every registration after that requires a signature from an already-registered guardian.

## Running a guardian node

The node software is the same image used for oracles, configured for the guardian role. Two things differ from an oracle deployment:

* **A guardian must also run the gateway role.** Oracles never reach the guardian service directly — they call the public gateway, which forwards inward. If the gateway cannot reach the local guardian service, every attestation through your node fails.
* **Only the gateway should be publicly exposed.** The guardian service itself is internal.

Host provisioning — hardware, SEV-SNP enablement, Kubernetes — is identical to an oracle and is covered in [Running a Switchboard Oracle](../running-a-switchboard-oracle/).

Verify a running guardian the same way as an oracle: it should appear on the Guardian Queue with heartbeat permission, a recent heartbeat, and a published gateway URI. Until that URI is on-chain, oracles cannot find it.

## Troubleshooting

| Symptom                                   | Cause                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Oracles never select your guardian        | No gateway URI on-chain — the gateway self-test is failing, or it is not verified |
| Attestation requests fail at your gateway | The gateway cannot reach the local guardian service                       |
| Attestation reports fail verification     | Usually the oracle's report, not your guardian — check the oracle's TEE stack |
| `guardian register` is rejected           | Not signed by the program state authority                                 |
