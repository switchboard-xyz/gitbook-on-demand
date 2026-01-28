# Run Crossbar with Docker Compose

### Overview

Crossbar can be run pretty easily with Docker. The instructions below will walk you through running Crossbar in Docker containers using Docker Compose.

#### Crossbar Rust Implementation

The current version of Crossbar is implemented in Rust and includes built-in simulation capabilities, eliminating the need for a separate Task Runner Simulator service. This provides better performance and simplified deployment.

#### Prerequisites

Before running crossbar, ensure you have the following

* **Docker** and **Docker Compose** installed on your machine.
* A custom **Solana RPC** for improved performance (optional - strongly recommended)
* **Pinata** or another **IPFS** node for job storage (optional)

#### **Step 1: Set Up Your Project Directory**

1. **Create a Project Directory**: Create a directory for your project. This directory will contain all the necessary files for your Docker container deployment.

`mkdir my-crossbar-project cd my-crossbar-project`

#### **Step 2: Create the `docker-compose.yml` File**

1. **Create a `docker-compose.yml` File**: In your project directory, create a file named `docker-compose.yml`. This file will define the Docker services and environment variables.

> **Platform Compatibility Note:** The Crossbar Docker image is built for `linux/amd64` (x86/Intel architecture). If you're running on Apple Silicon (M1, M2, M3, M4 Macs) or other ARM-based systems, add the `platform: linux/amd64` line under the service definition. Docker Desktop will use Rosetta 2 or QEMU to emulate the x86 architecture. For best performance on Apple Silicon, ensure "Use Rosetta for x86/amd64 emulation" is enabled in Docker Desktop settings.

```yaml
version: '3.8'

services:
  crossbar:
    image: switchboardlabs/rust-crossbar:stable
    # Uncomment the following line if running on Apple Silicon (M1/M2/M3/M4) or other ARM systems:
    # platform: linux/amd64
    ports:
      - "8080:8080"  # HTTP API
      - "8081:8081"  # WebSocket
    environment:
      # === Core Configuration ===
      PORT: ${PORT:-8080}
      WS_PORT: ${WS_PORT:-8081}
      
      # === Blockchain RPCs (Optional - Recommended) ===
      SOLANA_MAINNET_RPC_URL: ${SOLANA_MAINNET_RPC_URL:-https://api.mainnet-beta.solana.com}
      SOLANA_DEVNET_RPC_URL: ${SOLANA_DEVNET_RPC_URL:-https://api.devnet.solana.com}

      # === IPFS Configuration (Optional) ===
      IPFS_GATEWAY_URL: ${IPFS_GATEWAY_URL:-https://ipfs.io}

      # === Performance (Optional) ===
      BROADCAST_WORKER_THREADS: ${BROADCAST_WORKER_THREADS:-32}
      RUST_LOG: ${RUST_LOG:-info}
```

#### **Step 3: Create the `.env` File**

1. **Create a `.env` File**: In the same directory, create a `.env` file to store your environment variables. This file is read by `docker compose` and will override the default values in the compose file if specified.

```bash
# .env file
# All environment variables are optional and have sensible defaults

# Recommended for better performance
SOLANA_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com

# Optional IPFS configuration
# PINATA_JWT_KEY="your-pinata-jwt-key"
# PINATA_GATEWAY_KEY="your-pinata-gateway-key"
# IPFS_GATEWAY_URL="https://ipfs.io"
```

#### **Step 4: Build and Run the Docker Container**

1. **Build and Run the Docker Container**: Navigate to your project directory and run the following command to start your Docker container:

`docker-compose up -d`

This command will start the container in detached mode. The `-d` flag stands for "detached," meaning the container runs in the background.

#### **Step 5: Verify the Deployment**

1. **Verify the Deployment**: Once the container is running, you can verify that the service is up and running by accessing it at `http://localhost:8080`. You can also check the status of the container by running:

`docker-compose ps`

This command will show the status of the running services.

#### **Step 6: Stopping and Restarting the Docker Container**

1. **Stop the Docker Container**: To stop the container, run:

`docker-compose down`

This command will stop and remove the containers defined in your `docker-compose.yml` file.

1. **Restart the Docker Container**: To restart the container, run:

`docker-compose up -d`

#### Additional Tips

* **Logs**: To view the logs of the running container, use the following command:

`docker-compose logs -f`

* **Updating Environment Variables**: If you need to update the environment variables, edit the `.env` file and restart the container:

`docker-compose down docker-compose up -d`

## Environment Variables Reference

### Core Server Configuration

| Variable      | Type     | Default | Description                       |
| ------------- | -------- | ------- | --------------------------------- |
| `PORT`        | Optional | `8080`  | HTTP server port                  |
| `WS_PORT`     | Optional | `8081`  | WebSocket server port             |
| `DISABLE_API` | Optional | `false` | Set to "true" to disable HTTP API |

### Blockchain RPC Configuration

| Variable                 | Type     | Default                               | Description                 |
| ------------------------ | -------- | ------------------------------------- | --------------------------- |
| `SOLANA_MAINNET_RPC_URL` | Optional | `https://api.mainnet-beta.solana.com` | Solana mainnet RPC endpoint |
| `SOLANA_DEVNET_RPC_URL`  | Optional | `https://api.devnet.solana.com`       | Solana devnet RPC endpoint  |

### IPFS Configuration

| Variable             | Type     | Default           | Description                    |
| -------------------- | -------- | ----------------- | ------------------------------ |
| `IPFS_GATEWAY_URL`   | Optional | `https://ipfs.io` | IPFS gateway for fetching data |
| `PINATA_JWT_KEY`     | Optional | -                 | Pinata JWT key for storage     |
| `PINATA_GATEWAY_KEY` | Optional | -                 | Pinata gateway key             |
| `KUBO_URL`           | Optional | -                 | Local Kubo IPFS node URL       |

### Database Configuration (Optional)

| Variable       | Type     | Default | Description                  |
| -------------- | -------- | ------- | ---------------------------- |
| `DATABASE_URL` | Optional | -       | PostgreSQL connection string |
| `PGUSER`       | Optional | -       | PostgreSQL username          |
| `PGPASSWORD`   | Optional | -       | PostgreSQL password          |
| `PGDATABASE`   | Optional | -       | PostgreSQL database name     |
| `PGHOST`       | Optional | -       | PostgreSQL host              |
| `PGPORT`       | Optional | -       | PostgreSQL port              |

### Performance & Caching

| Variable                       | Type     | Default | Description                    |
| ------------------------------ | -------- | ------- | ------------------------------ |
| `BROADCAST_WORKER_THREADS`     | Optional | `32`    | Number of Tokio worker threads |
| `SIMULATION_CACHE_TTL_SECONDS` | Optional | `3`     | Cache TTL for simulations      |
| `DISABLE_CACHE`                | Optional | `false` | Disable caching entirely       |
| `RATE_LIMIT`                   | Optional | -       | Rate limiting configuration    |

### Development & Debugging

| Variable             | Type     | Default | Description                                 |
| -------------------- | -------- | ------- | ------------------------------------------- |
| `RUST_LOG`           | Optional | `info`  | Log level (error, warn, info, debug, trace) |
| `TOKIO_CONSOLE`      | Optional | `false` | Enable tokio console debugging              |
| `TOKIO_CONSOLE_PORT` | Optional | `6669`  | Port for tokio console                      |
| `IS_LOCALHOST`       | Optional | `false` | Development mode flag                       |

### Testing it out:

Try the deployment out by navigating to (can take a few seconds the first run): [http://localhost:8080/updates/evm/1116/fd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c](http://localhost:8080/updates/evm/1116/fd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c)

The equivalent result should look something like the output from the public node: [https://crossbar.switchboard.xyz/updates/evm/1116/fd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c](https://crossbar.switchboard.xyz/updates/evm/1116/fd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c)
