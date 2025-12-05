---
description: devnet and mainnet variables
---

# cfg/00-devnet-vars.cfg and cfg/00-mainnet-vars.cfg

### Intro

The two following files are basically identical, besides some small details that makes them dedicated to specific SOLANA clusters (or chains), that is `devnet` and `mainnet`(sometimes also referred to as `mainnet-beta` for historical reasons).

Let's go through the content, chunk by chunk.

### Network definition

```bash
# ADD YOUR DEVNET ORACLE/GUARDIAN DATA

# NETWORK can be "devnet" or "mainnet"
NETWORK="devnet"
```

This just refers to the SOLANA cluster you're settings this up for. Could be `devnet` or `mainnet`.

### Oracle pubkeys

```bash
# ORACLE DATA
PULL_ORACLE=""
PULL_QUEUE=""

# GUARDIAN DATA
GUARDIAN_ORACLE=""
GUARDIAN_QUEUE=""
```

These variables are the public keys of the accounts you will use to host your Oracle and will be created in a following step, later in the installation process.

Leave them empty for now and you will come back later to this section when the setup script that creates them will tell you to do so.

### RPC URLs

```
# RPC endpoints - Add your NON-rate-limited RPC endpoints
RPC_URL="https://api.${NETWORK}.solana.com"
WSS_URL="wss://api.${NETWORK}.solana.com"
```

These variables are referring to SOLANA RPC URLs and once again we invite you to find one that is not rate limited from a trusted provider like [https://triton.one/](https://triton.one/) or [https://www.helius.dev/](https://www.helius.dev/) or other similar solutions.

These two endpoints must be dedicatd to the network you're using, ie: devnet or mainnet.

### Infisical settings

```bash
# CHANGE ONLY IF YOU USE INFISICAL
#INFISICAL_SECRET_KEY="SOLANA_KEY"
#INFISICAL_SECRET_PATH="/"
#INFISICAL_SECRET_SLUG="dev" # usually "dev" or "prod"
#INFISICAL_TOKEN_NS="infisical" # the K8S namespace where the Infisical TOKEN lives
```

This section is entirely dedicated to Infisical and is mostly related to Kubernetes based setup.

While it is usable with Docker Compose, we decided that it was beyond the scope of such a simple setup so we intentionally left it out (that's why it's entirely commented via `#`).

If you chose the Kubernetes setup, you'll have to come back to this, once you have the full details to add here.

### Namespace and Ingresses

```bash
##########
### !!! - DO NOT CHANGE ANYTHING BELOW THIS POINT - !!!
##########

NAMESPACE="switchboard-oracle-${NETWORK}"

# INGRESS gateway
ORACLE_INGRESS="https://${CLUSTER_DOMAIN}/devnet"
GATEWAY_INGRESS="https://${CLUSTER_DOMAIN}/devnet"
GUARDIAN_INGRESS="https://${CLUSTER_DOMAIN}/devnet"

DOCKER_IMAGE_TAG="${DEVNET_DOCKER_IMAGE_TAG}"
```

This section is mostly meant to stay untouched unless you know what you're changing.

If you changed the `CLUSTER_DOMAIN` variable in the `00-common-vars.cfg` file, then you also need to adjust the `*_INGRESS` variables accordingly, remember to leave the `/devnet` and `/mainnet` string at the end to be able to host multiple Oracles on the same Docker Compose node.  &#x20;
