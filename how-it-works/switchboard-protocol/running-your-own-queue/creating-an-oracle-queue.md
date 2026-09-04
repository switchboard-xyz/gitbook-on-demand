---
description: >-
  Create a Queue, permission oracles onto it, and control which software those
  oracles are allowed to run.
---

# Creating an Oracle Queue

## 1. Create the Queue

```bash
sb solana on-demand queue init \
  --mainnetBeta \
  -k ~/.config/solana/queue-authority.json \
  --reward 100000 \
  --nodeTimeout 180
```

The command prints your new Queue's public key. Save it — every oracle you onboard, and every feed you point at this Queue, needs it.

The signer becomes the **queue authority**. That key controls oracle permissions and the enclave allowlist, so treat it accordingly.

| Parameter                             | Value    | Meaning                                                        |
| ------------------------------------- | -------- | -------------------------------------------------------------- |
| `--reward`                            | lamports | Paid per oracle per update                                      |
| `--nodeTimeout`                       | seconds  | Silence after which an oracle may be garbage-collected          |
| `requireAuthorityHeartbeatPermission` | `true`   | Oracles need explicit permission from you before they can join  |
| `requireUsagePermission`              | `false`  | Anyone may read feeds on this Queue                             |
| `maxQuoteVerificationAge`             | 7 days   | How long a guardian attestation stays valid                     |
| `allowAuthorityOverrideAfter`         | 600s     | Delay before the authority can be force-rotated                 |

Queue creation also allocates an address lookup table, so the command reads a recent finalized slot and takes a moment.

Mutable parameters can be changed later:

```bash
sb solana on-demand queue configure <QUEUE> --mainnetBeta -k <AUTHORITY> \
  --reward 120000 \
  --nodeTimeout 300 \
  --oracleFeeProportionBps 5000
```

## 2. Create an oracle account

On the machine you provisioned (see [Running a Switchboard Oracle](../running-a-switchboard-oracle/)):

```bash
sb solana on-demand oracle create \
  --mainnetBeta \
  -k ~/.config/solana/oracle-payer.json \
  --queue <QUEUE>
```

This prints the oracle's public key and the queue it belongs to. The signer becomes the oracle's authority, and must be the same key the oracle node runs with as its payer — attestation transactions are signed by that authority.

## 3. Permission the oracle onto your Queue

Because the Queue was created with `requireAuthorityHeartbeatPermission`, an oracle cannot join until you grant it heartbeat permission:

```bash
sb solana on-demand permission set \
  --mainnetBeta -k ~/.config/solana/queue-authority.json \
  --granter <QUEUE> \
  --grantee <ORACLE>
```

Run this with the **queue authority**; the command refuses any other signer.

To remove an oracle, add `--disable`. That revokes the permission and, if the oracle is currently seated, removes it from the Queue in the same transaction.

## 4. Control which software your oracles run

This is the security boundary a Queue exists to provide. Each oracle proves what code it is running through its TEE attestation, which produces an enclave measurement. Your Queue holds an allowlist of accepted measurements, and an oracle whose measurement is not on it cannot heartbeat.

Read the measurement from the oracle's own boot log — it prints `ENCLAVE MEASUREMENT: <hex>` on startup — then:

```bash
sb solana on-demand queue addMrEnclave <QUEUE> --mainnetBeta -k <AUTHORITY> \
  --mrEnclave <HEX>
```

Remove a retired measurement with `rmMrEnclave`:

```bash
sb solana on-demand queue rmMrEnclave <QUEUE> --mainnetBeta -k <AUTHORITY> \
  --mrEnclave <HEX>
```

{% hint style="warning" %}
**An empty allowlist is trust-on-first-use.** While your Queue has no measurements registered, the first oracle to heartbeat writes its own measurement into the list, and the Queue is pinned to it from then on. If you care which image your Queue accepts, add the measurement deliberately before the first oracle heartbeats.
{% endhint %}

## 5. Verify

```bash
sb solana on-demand queue print <QUEUE> --mainnetBeta
```

You are looking for:

* your oracle appearing in `oracleKeys`,
* a non-empty `gatewayUri` on it — an oracle whose gateway is not publicly reachable never publishes one, and stays invisible to the network,
* a recent `lastHeartbeat`.

Keep the Queue's escrow funded. It pays the per-update reward to oracles.

## Upgrading oracle software

Every image build has a different measurement, so ordering matters:

1. Add the new measurement with `addMrEnclave`.
2. Roll your oracles onto the new image; each re-attests under the new measurement.
3. Once every oracle has rotated, remove the retired measurement.

Doing step 3 before step 2 knocks your fleet off the Queue.

## Operational commands

| Situation                       | Command                                             |
| ------------------------------- | --------------------------------------------------- |
| Stale oracle stuck on the Queue | `sb solana on-demand queue rmOracle`                 |
| Lookup table needs rebuilding   | `sb solana on-demand queue resetLut`                 |
| Rotate the queue authority      | `queue configure <QUEUE> --authority <NEW>`          |

If you are wiring the Queue into restaking, `queue setNcn`, `queue setVault` and `queue allowSubsidy` are the relevant commands — see [(Re)staking](../re-staking/).

## Troubleshooting

| Symptom                                  | Cause                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Heartbeat fails with a permission error  | Heartbeat permission not granted, or granted by the wrong signer  |
| Heartbeat fails on the measurement check | The oracle's measurement is not on the Queue allowlist            |
| Oracle seated but has no `gatewayUri`    | Its gateway is not reachable from the public internet             |
| Oracle never becomes verified            | Attestation is failing — check the oracle's TEE setup             |
