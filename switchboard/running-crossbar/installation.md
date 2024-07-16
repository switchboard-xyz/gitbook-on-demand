---
description: Operating a crossbar server
---

# Installation

### Install

Crossbar can be run pretty easily with Docker. The Crossbar docker image ships with a version of the Switchboard Task-Runner which runs in simulate routes.

#### Configuring the Environment

Configuring the environment is optional, but it's highly recommended that users configure a custom Solana RPC for task-runner actions, and use Pinata or a self-hosted Kubo node for job storage.&#x20;

#### .env

```bash
# .env file
# delete any environment variables that you're not using

# recommended, but optional
SOLANA_MAINNET_RPC="your-mainnet-rpc-url"
SOLANA_DEVNET_RPC="your-devnet-rpc-url"

# ipfs / optional
PINATA_JWT_KEY="your-pinata-jwt-key"
PINATA_GATEWAY_KEY="your-pinata-gateway-key"
# or 
KUBO_URL="your-kubo-url"
# or
IPFS_GATEWAY_URL="your-ipfs-gateway-url"

# evm networks
CORE_MAINNET_RPC="your-core-mainnet-rpc"
CORE_TESTNET_RPC="your-core-testnet-rpc"
MORPH_HOLESKY_RPC="your-morph-holesky-rpc"
ARBITRUM_SEPOLIA_RPC="your-arbitrum-sepolia-rpc"
ARBITRUM_ONE_RPC="your-arbitrum-one-rpc"
```

#### Docker

Official images are published at [https://hub.docker.com/r/switchboardlabs/crossbar](https://hub.docker.com/r/switchboardlabs/crossbar):

```bash
$ docker pull switchboardlabs/crossbar:latest
$ docker run --rm -it --env-file=.env -p 8080:8080 switchboardlabs/crossbar:latest
```

