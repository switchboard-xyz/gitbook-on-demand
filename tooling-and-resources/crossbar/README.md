# Crossbar

## Crossbar: Switchboard's Utility Server

Crossbar is a utility server designed to simplify interactions with the Switchboard network. It provides essential functionalities for simulating and resolving feeds across various blockchains. Crossbar comes with a set of useful utility functions for resolving feeds on all chains with active Switchboard deployments, IPFS utilities for storing and fetching jobs, and a simulator for constantly fetching feed updates for liquidators and other bots.

> Running your own instance of Crossbar is highly recommended for user interfaces and bots that require frequent price simulations.

Refer to [Run Crossbar with Docker Compose ](run-crossbar-with-docker-compose.md)for instructions on setting up your own Crossbar instance.

### Key Features

Crossbar aims to streamline the Switchboard experience, offering the following core functionalities:

* **Fetch Feeds by Feed Hash:** Retrieve a feed's job definitions and queue in JSON format using its unique feed hash (content identifier).
* **Store Jobs:** Store feed definitions using your configured IPFS node (requires Piñata credentials or a Kubo node).
* **Simulate Feeds by Feed Hash:** Simulate multiple feeds simultaneously using their feed hashes, enabling off-chain tracking of custom price feeds for bot automation.

### Blockchain-Specific Features

Crossbar provides tailored features for specific blockchains:

**Solana, Aptos/Sui, and Eclipse:**

* **Fetch Encoded Update Instructions:** Retrieve update instructions from live oracles for Solana feeds (available on devnet and mainnet).
* **Fetch Simulated Results for Feeds:** Fetch current prices for feeds. This is a useful feature for tracking custom price feeds off-chain, for triggering an action that the bots can use.

**Ethereum Virtual Machine (EVM):**

* **Fetch Encoded Updates:** Obtain an encoded update for a feed to submit on-chain via a contract explorer (like Etherscan), eliminating the need to include feed definitions directly in your frontend.
* **Settle Randomness:** Fetch a settlement message for resolving randomness requests when using Switchboard's EVM Randomness features.

#### Public Instance of Crossbar

While a public instance is available for quick testing, running your own Crossbar instance is highly recommended. Switchboard oracles are heavily rate-limited by IP address, so using a dedicated instance prevents disruptions.

* **Public Instance:** [https://crossbar.switchboard.xyz](https://crossbar.switchboard.xyz)

**Examples:**

* **Job Definition Fetch:** [https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7](https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7)
* **EVM Oracle Fetch (Core Testnet):** [https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)
