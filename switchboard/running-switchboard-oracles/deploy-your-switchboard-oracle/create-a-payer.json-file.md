---
description: Identify yourself by creating a new wallet
---

# Create a payer.json file

In order to be able to run your Oracle, you'll need a wallet with at least 0.1 SOL

In the following example, we'll show how to create one and fund it on `devnet` so that you can get the general idea of the flow.

## Open the environment

Be sure that you're still in the directory `infra-external/scripts/install` that you cloned locally, then run:

```bash
./40-oracle-ctr-sol.sh
```

This command will open a temporary container to create your wallet.

Wait for the download phase to finish and for the prompt to be `/app` and then proceed with next step.

## Create a new wallet

Once you're inside the running container, run:

```bash
./41-oracle-create-sol-account.sh
```

This last command will generate a new wallet for you and create a representation of it as a an array of numbers in JSON format and save it inthe `payer.json` file.

BE SURE TO SAVE THE 24 WORDS that are in the output as it's the only wait to recreate your wallet in case you lose acces to your `payer.json` file.

Don't set a BIP39 password as it could be problematic to use the the wallet in a programatic way.

This script will also take care of funding your wallet automatically with 5 SOL (on devnet) so that all following operations should work.

You can run `exit` to leave the container environment as we won't need it anymore and proceed to the next step.

Before moving to the next step, remember the Infisical Operator setup where you left the `SOLANA_KEY` Secret empty? It's time to fix that by copying the content of your `payer.json` file and pasting it as-is in the `SOLANA-KEY` secret. The Infisical Operator will take care of detecting that you changed that and sync it in your Kubernetes cluster.

\
!!! WARNING: keep the 24 words and the content of your `payer.json` safe and away from unauthorized eyes or you other people may be able to sneak into your wallet.
