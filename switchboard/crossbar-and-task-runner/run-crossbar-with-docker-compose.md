---
icon: docker
description: Operating a crossbar server with Docker Compose
---

# Run Crossbar with Docker Compose

## Overview

Crossbar can be run pretty easily with Docker. The instructions below will walk you through running Crossbar in Docker containers using Docker Compose.

For Swagger documentation, see: [https://crossbar.switchboard.xyz/docs](https://crossbar.switchboard.xyz/docs)

### Crossbar Rust Implementation

The current version of Crossbar is implemented in Rust and includes built-in simulation capabilities, eliminating the need for a separate Task Runner Simulator service. This provides better performance and simplified deployment.

### Prerequisites

Before running crossbar, ensure you have the following

* **Docker** and **Docker Compose** installed on your machine.
* A custom **Solana RPC** for improved performance (optional - strongly recommended)
* **Pinata** or another **IPFS** node for job storage (optional)

#### **Step 1: Set Up Your Project Directory**

1. **Create a Project Directory**: Create a directory for your project. This directory will contain all the necessary files for your Docker container deployment.

```sh
mkdir my-crossbar-project
cd my-crossbar-project
```

#### **Step 2: Create the `docker-compose.yml` File**

2. **Create a `docker-compose.yml` File**: In your project directory, create a file named `docker-compose.yml`. This file will define the Docker services and environment variables.

```yaml
version: '3.8'

services:
  crossbar:
    image: switchboardlabs/crossbar:stable
    ports:
      - "8080:8080"  # HTTP API
      - "8081:8081"  # WebSocket
    environment:
      # === Core Configuration ===
      PORT: ${PORT:-8080}
      WS_PORT: ${WS_PORT:-8081}
      DISABLE_API: ${DISABLE_API:-false}
      
      # === Blockchain RPCs (Optional - Recommended) ===
      SOLANA_MAINNET_RPC_URL: ${SOLANA_MAINNET_RPC_URL:-"https://api.mainnet-beta.solana.com"}
      SOLANA_DEVNET_RPC_URL: ${SOLANA_DEVNET_RPC_URL:-"https://api.devnet.solana.com"}
      
      # === IPFS Configuration (Optional) ===
      IPFS_GATEWAY_URL: ${IPFS_GATEWAY_URL:-"https://ipfs.io"}
      PINATA_JWT_KEY: ${PINATA_JWT_KEY}  # Optional: for IPFS storage
      PINATA_GATEWAY_KEY: ${PINATA_GATEWAY_KEY}  # Optional: for IPFS storage
      KUBO_URL: ${KUBO_URL}  # Optional: for local IPFS node
      
      # === Database (Optional) ===
      DATABASE_URL: ${DATABASE_URL}  # Optional: PostgreSQL connection
      
      # === Performance Tuning (Optional) ===
      BROADCAST_WORKER_THREADS: ${BROADCAST_WORKER_THREADS:-32}
      SIMULATION_CACHE_TTL_SECONDS: ${SIMULATION_CACHE_TTL_SECONDS:-3}
      DISABLE_CACHE: ${DISABLE_CACHE:-false}
      
      # === Logging & Debugging (Optional) ===
      RUST_LOG: ${RUST_LOG:-"info"}
      IS_LOCALHOST: ${IS_LOCALHOST:-false}
      
      # === Legacy Environment Variables (Optional) ===
      # Note: These are supported for backwards compatibility
      SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC}  # Maps to SOLANA_MAINNET_RPC_URL
      SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC}    # Maps to SOLANA_DEVNET_RPC_URL
```

#### **Step 3: Create the `.env` File**

3. **Create a `.env` File**: In the same directory, create a `.env` file to store your environment variables. This file is read by `docker compose` and will override the default values in the compose file if specified.

```bash
# .env file
# All environment variables are optional and have sensible defaults
# Only uncomment and set the variables you need to customize

# === Core Configuration ===
# PORT=8080
# WS_PORT=8081
# DISABLE_API=false

# === Blockchain RPCs (Recommended for better performance) ===
SOLANA_MAINNET_RPC_URL="your-mainnet-rpc-url"
SOLANA_DEVNET_RPC_URL="your-devnet-rpc-url"

# === IPFS Configuration (Optional) ===
# IPFS_GATEWAY_URL="https://ipfs.io"
# PINATA_JWT_KEY="your-pinata-jwt-key"
# PINATA_GATEWAY_KEY="your-pinata-gateway-key"
# KUBO_URL="http://localhost:5001"

# === Database (Optional - only if you need persistence) ===
# DATABASE_URL="postgresql://user:pass@localhost/crossbar"

# === Performance Tuning (Optional) ===
# BROADCAST_WORKER_THREADS=32
# SIMULATION_CACHE_TTL_SECONDS=3
# DISABLE_CACHE=false

# === Development & Debugging (Optional) ===
# RUST_LOG="debug"
# IS_LOCALHOST=true
# TOKIO_CONSOLE=true
# TOKIO_CONSOLE_PORT=6669

```

#### **Step 4: Build and Run the Docker Container**

4. **Build and Run the Docker Container**: Navigate to your project directory and run the following command to start your Docker container:

```sh
docker-compose up -d
```

This command will start the container in detached mode. The `-d` flag stands for "detached," meaning the container runs in the background.

#### **Step 5: Verify the Deployment**

5. **Verify the Deployment**: Once the container is running, you can verify that the service is up and running by accessing it at `http://localhost:8080`. You can also check the status of the container by running:

```sh
docker-compose ps
```

This command will show the status of the running services.

#### **Step 6: Stopping and Restarting the Docker Container**

6. **Stop the Docker Container**: To stop the container, run:

```sh
docker-compose down
```

This command will stop and remove the containers defined in your `docker-compose.yml` file.

7. **Restart the Docker Container**: To restart the container, run:

```sh
docker-compose up -d
```

#### Additional Tips

* **Logs**: To view the logs of the running container, use the following command:

```sh
docker-compose logs -f
```

* **Updating Environment Variables**: If you need to update the environment variables, edit the `.env` file and restart the container:

```sh
docker-compose down
docker-compose up -d
```

## Testing it out:

Try the deployment out by navigating to (can take a few seconds the first run): [http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)

The equivalent result should look something like the output from the public node: [https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)
