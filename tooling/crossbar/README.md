# Crossbar

## Crossbar: Switchboard's Utility Server

Crossbar is a high-performance utility server implemented in Rust, designed to simplify interactions with the Switchboard network. It provides essential functionalities for simulating and resolving feeds across various blockchains. Crossbar comes with a set of useful utility functions for resolving feeds on all chains with active Switchboard deployments, IPFS utilities for storing and fetching jobs, and built-in simulation capabilities for constantly fetching feed updates for liquidators and other bots.

> **Note**: The Rust version includes built-in simulation and no longer requires a separate Task Runner Simulator service.

> Running your own instance of Crossbar is highly recommended for user interfaces and bots that require frequent price simulations.

Refer to [Run Crossbar with Docker Compose ](run-crossbar-with-docker-compose.md)for instructions on setting up your own Crossbar instance.

### Key Features

Crossbar aims to streamline the Switchboard experience, offering the following core functionalities:

* **Fetch Feeds by Feed Hash:** Retrieve a feed's job definitions and queue in JSON format using its unique feed hash (content identifier).
* **Store Jobs:** Store feed definitions using your configured IPFS node (requires Piñata credentials or a Kubo node).
* **Simulate Feeds by Feed Hash:** Simulate multiple feeds simultaneously using their feed hashes, enabling off-chain tracking of custom price feeds for bot automation.

### Blockchain-Specific Features

Crossbar provides tailored features for specific blockchains:

**Solana and Aptos/Sui:**

* **Fetch Encoded Update Instructions:** Retrieve update instructions from live oracles for Solana feeds (available on devnet and mainnet).
* **Fetch Simulated Results for Feeds:** Fetch current prices for feeds. This is a useful feature for tracking custom price feeds off-chain, for triggering an action that the bots can use.

**Ethereum Virtual Machine (EVM):**

* **Fetch Encoded Updates:** Obtain an encoded update for a feed to submit on-chain via a contract explorer (like Etherscan), eliminating the need to include feed definitions directly in your frontend.
* **Settle Randomness:** Fetch a settlement message for resolving randomness requests when using Switchboard's EVM Randomness features.

### Rust Implementation Benefits

The Rust implementation provides several advantages:

* **High Performance:** Built with actix-web for maximum throughput
* **Built-in Simulation:** No separate Task Runner Simulator required
* **WebSocket Support:** Real-time data streaming capabilities
* **Memory Efficiency:** Optimized for high concurrent connections
* **Simplified Deployment:** Single binary with minimal dependencies

### Environment Variables

All environment variables are optional and have sensible defaults:

**Core Configuration:**

* `PORT` (default: 8080) - HTTP server port
* `WS_PORT` (default: 8081) - WebSocket server port
* `DISABLE_API` (default: false) - Disable HTTP API entirely

**Performance:**

* `BROADCAST_WORKER_THREADS` (default: 32) - Tokio worker threads
* `SIMULATION_CACHE_TTL_SECONDS` (default: 3) - Cache TTL
* `DISABLE_CACHE` (default: false) - Disable caching

**Blockchain RPCs (Recommended):**

* `SOLANA_MAINNET_RPC_URL` - Solana mainnet RPC
* `SOLANA_DEVNET_RPC_URL` - Solana devnet RPC

**IPFS (Optional):**

* `IPFS_GATEWAY_URL` (default: https://ipfs.io) - IPFS gateway
* `PINATA_JWT_KEY` - Pinata storage key
* `KUBO_URL` - Local IPFS node

For a complete list of environment variables, see the [Docker Compose guide](run-crossbar-with-docker-compose.md#environment-variables-reference).

#### Public Instance of Crossbar

While a public instance is available for quick testing, running your own Crossbar instance is highly recommended. Switchboard oracles are heavily rate-limited by IP address, so using a dedicated instance prevents disruptions.

* **Public Instance:** [https://crossbar.switchboard.xyz](https://crossbar.switchboard.xyz)

**Examples:**

* **Job Definition Fetch:** [https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7](https://crossbar.switchboard.xyz/fetch/2718f49aa8fb6b71452ef149fa654a06d3996113034c27e2dca5c71b4a2866e7)
* **EVM Oracle Fetch (Core Mainnet):** [https://crossbar.switchboard.xyz/updates/evm/1116/0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c](https://crossbar.switchboard.xyz/updates/evm/1116/0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c)
