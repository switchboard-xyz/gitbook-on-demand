---
description: >-
  A tutorial on the Switchboard utility server for simulation and resolving
  feeds. This is highly recommended for frontend user interfaces and bots that
  will simulate prices with high frequency.
---

# Running Crossbar

### Official images are published at:

### [https://hub.docker.com/r/switchboardlabs/crossbar](https://hub.docker.com/r/switchboardlabs/crossbar)

**Crossbar** is a useful utility service for interacting with the Switchboard network. It comes loaded with utility functions for resolving feeds on all chains with active Switchboard deployments, IPFS utilities for storing and fetching jobs, and a simulator for constantly fetching feed updates for liquidators and other bots.

The goal with Crossbar is to make Switchboard as easy to use as possible.

**Crossbar's features**:

* **Fetch feeds by feed hash**: Given a `feedHash`, a content identifier for a feed, you can pull in a feed's job definitions and queue in JSON.&#x20;
* **Store jobs**: Given a feed definition and queue public key, you can store feeds using your configured IPFS node. Note: this will only work if you have [Piñata](https://www.pinata.cloud/) credentials passed in (or a [Kubo node](https://github.com/ipfs/kubo)).&#x20;
* **Simulate feeds by feed hash**: You can simulate a number of feeds with a set of feedHashes. This is a useful tool for tracking custom price feeds off-chain for triggering some action with bots.&#x20;

**Solana-specific features**:

* **Fetch encoded update instructions**: Using a set of Solana feed public keys, you can fetch the relevant update instructions from the live set of oracles (on devnet and mainnet).&#x20;
* **Fetch simulated results for feeds**: Due to the intense rate-limiting of oracle node requests, it makes sense to use crossbar for fetching current prices. It runs the same task-runner internally, and you can constantly stream data from it since it'll be running on your very own instance.&#x20;

**Ethereum Virtual Machine (EVM) features**:

* **Fetch an encoded update**: Using crossbar you can pull an encoded update for a feed to submit on-chain. This is useful for frontends in which you may not want to bring feed definitions to interact with oracles directly. It's also useful for individuals that want to run feed updates via a contract explorer (like Etherscan).&#x20;
* **Settle randomness**: If a user has requested randomness using the Switchboard EVM Randomness features, a settlement message can be fetched off-chain with crossbar.&#x20;

## Public Instance of Crossbar

Switchboard oracles are heavily rate-limited by IP address, so it's recommended users run their own instance. For quick testing and easy oracle job submissions there is a public instance of crossbar available at:&#x20;

```
https://crossbar.switchboard.xyz
```

* Check out this job definition fetch: [https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7](https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7)
* An example EVM oracle fetch (Core Testnet): [https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)

