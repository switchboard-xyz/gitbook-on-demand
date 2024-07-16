---
description: common vars
---

# cfg/00-common-vars.cfg

We'll now go through the file content, one chuck and variable at a time:

```bash
# customize the data below according to your setup
EMAIL="YOUR@EMAIL.IS.NEEDED.HERE" # change this to be your E-MAIL
```

This variable should simply contain a reference email that will be used for certificates and future reference.

```bash
IP4="0.0.0.0" # add the external IPv4 address of your cluster
IP6="0000::0000" # add the external IPv6 address of your cluster (optional)
```

This are the PUBLIC STATIC IPs associated with your Oracle.\
Right now we're only using IPv4 but we plan to include soon support for IPv6 too.

```bash
CLUSTER_DOMAIN="${IP4}.xip.switchboard-oracles.xyz"
```

This is a DNS record that points to the IP specified above. \
If you don't have a DNS record, fear not, as explained in section [#custom-dns-or-use-our-automagic-one-xip.switchboard-oracles.xyz](../prerequisites/network-requirements.md#custom-dns-or-use-our-automagic-one-xip.switchboard-oracles.xyz "mention") you can just leave it as it is written now and it will automatically resolve to your DNS.

```bash
# this URL should always be a MAINNET non rate-limited RPC (even when using devnet)
TASK_RUNNER_SOLANA_RPC="https://api.mainnet-beta.solana.com"
```

Regardless of installing a `devnet` or `mainnet` Oracle you should add here your own RPC pool for `mainnet` that is NOT rate limited or you may find that some Oracle operations will have a hard time going through.

You're free to use the one we specify there, but it's quite possible that your Oracle will be frequently heavy rate limited in the requests it sends to that RPC.
