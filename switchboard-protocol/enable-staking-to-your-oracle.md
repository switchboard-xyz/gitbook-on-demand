---
description: Enable svSWTCH delegation to your oracle through Jito NCN integration
---

# Enable Staking to your Oracle

Setting up your oracle to start earning SWTCH rewards is easy. In less than 5 minutes, Jito vaults can start delegating stake to your oracle to start earning!

## Overview

Oracle operators in the Switchboard network **must have svSWTCH delegated to them** to participate. This "skin in the game" model ensures oracle incentives are aligned with network security and data reliability.

**Benefits of enabling staking:**

* 🏆 **Earn SWTCH rewards** from network fees and subsidies
* 📈 **Competitive advantage** - more delegation = more work opportunities
* 🔒 **Network participation** - required to validate and submit oracle data
* ⚡ **Performance rewards** - high uptime and accuracy earn bonus rewards

For complete details on the economic model, see [Governance & Tokenomics](governance-and-tokenomics.md).

To start earning, you must first create your NCN operator or provide a pre-existing operator. This operator account is what manages the permissions to allow stake to be delegated to your oracle from a Jito vault.

Prerequisites:

To get started with re-staking, you must have already installed the Jito restaking CLI:

```bash
curl -fsSL -o jito-restaking-0.0.4.tar.gz https://github.com/jito-foundation/restaking/archive/refs/tags/v0.0.4.tar.gz
tar -xvzf jito-restaking-0.0.4.tar.gz
rm jito-restaking-0.0.4.tar.gz
cd restaking-0.0.4/cli/
cargo build --release
mkdir -p ~/.local/bin
cp ../target/release/jito-restaking-cli ~/.local/bin/
```

To create an NCN operator account, run

```bash
jito-restaking-cli restaking operator initialize ${OPERATOR_FEE_BPS?} --rpc-url ${URL?} --keypair ${KP?}
```

Note that the operator fee is not a setting that has any effect in the NCN protocol. This configuration acts as an indicator of what amount of rewards will go directly to your oracle instead of being sent to the vault. Do note that a higher fee de-incentivizes the vault to provide you stake.

Once your operator is set up, you must link it to the Switchboard NCN:

```bash
export NCN=BGTtt2wdTdhLyFQwSGbNriLZiCxXKBbm29bDvYZ4jD6G
jito-restaking-cli restaking ncn initialize-ncn-operator-state ${NCN?} ${OPERATOR?} --keypair ${KP?} --rpc-url ${URL?}
jito-restaking-cli restaking operator operator-warmup-ncn ${OPERATOR?} ${NCN?} --rpc-url ${URL?} --keypair ${KP?}
```

At this point, your operator must be approved by Switchboard to continue, you may reach out via the application form or via the `#sb-operators`discord channel for Switchboard to run

```bash
jito-restaking-cli restaking ncn ncn-warmup-operator ${NCN?} ${OPERATOR?} --rpc-url ${URL?} --keypair ${KP?}
```

At this point your operator will be registered with the Switchboard NCN!

Now, it's time to onboard to our supported **Vaults**

Switchboard currently supports stake delegation via the [Fragmetric vault](https://fragmetric.xyz/)

The Fragmetric vault may be found at address `HR1ANmDHjaEhknvsTaK48M5xZtbBiwNdXM5NTiWhAb4S`

To onboard your operator to the Fragmetric vault, run

```bash
jito-restaking-cli restaking operator inititalize-operator-vault-ticket ${OPERATOR?} ${VAULT?} --rpc-url ${URL?} --keypair ${KP?}
jito-restaking-cli restaking operator warmup-operator-vault-ticket ${OPERATOR?} ${VAULT?} --rpc-url ${URL?} --keypair ${KP?}
```

And you are all set! Fragmetric may now delegates stake to your node at the vault's discretion.

May the odds forever be in your favor...

<figure><img src="../.gitbook/assets/giphy.gif" alt=""><figcaption></figcaption></figure>
