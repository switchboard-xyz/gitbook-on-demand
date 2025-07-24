# Run Crossbar with Docker Compose

### Overview

Crossbar can be run pretty easily with Docker. The instructions below will walk you through running Crossbar in Docker containers using Docker Compose.

For Swagger documentation, see: [https://crossbar.switchboard.xyz/docs](https://crossbar.switchboard.xyz/docs)

#### Crossbar and Task Runner Simulator

Crossbar uses another piece of software called Task Runner Simulator to simulate feeds. You can provide Crossbar with the address of the Task Runner Simulator instance via an environment variable. If you don't provide it, Crossbar will fall back on using the public Task Runner Simulator endpoint at `crossbar.switchboard.xyz`, however it's not recommended to rely on this and we don't provide any guarantee of service. The instructions in this guide include running the Task Runner Simulator server alongside Crossbar.

#### Prerequisites

Before running crossbar, ensure you have the following

* **Docker** and **Docker Compose** installed on your machine.
* A custom **Solana RPC** for Task Runner Simulator actions (optional - strongly recommended)
* **Pinata** or another **IPFS** node for job storage

#### **Step 1: Set Up Your Project Directory**

1. **Create a Project Directory**: Create a directory for your project. This directory will contain all the necessary files for your Docker container deployment.

`mkdir my-crossbar-project cd my-crossbar-project`

#### **Step 2: Create the `docker-compose.yml` File**

1. **Create a `docker-compose.yml` File**: In your project directory, create a file named `docker-compose.yml`. This file will define the Docker services and environment variables.

```yaml
version: '3.8'

services:
  crossbar:
    image: switchboardlabs/crossbar:latest
    depends_on:
      - ipfs
    ports:
      - "8080:8080"
    environment:
      # dedicated solana rpc's recommended
      SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC:-"https://api.mainnet-beta.solana.com"}
      SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC:-"https://api.devnet.solana.com"}

      # task-runner-simulator
      TASK_RUNNER_URL: ${TASK_RUNNER_URL:-"http://task-runner:8080"}
      
      # ipfs gateways
      PINATA_JWT_KEY: ${PINATA_JWT_KEY}
      PINATA_GATEWAY_KEY: ${PINATA_GATEWAY_KEY}
      # or 
      IPFS_GATEWAY_URL: ${IPFS_GATEWAY_URL}

      # Required for SUI projects
      SUI_MAINNET_RPC: ${SUI_MAINNET_RPC}
      SUI_TESTNET_RPC: ${SUI_TESTNET_RPC}
      
      # Required for Aptos projects
      APTOS_MAINNET_RPC: ${APTOS_MAINNET_RPC}
      APTOS_TESTNET_RPC: ${APTOS_TESTNET_RPC}
      
      # RPCs (all optional)
      SOLANA_MAINNET_PUBLIC_RPC: ${SOLANA_MAINNET_PUBLIC_RPC} # will default to mainnet rpc if not listed
      SOLANA_DEVNET_PUBLIC_RPC: ${SOLANA_DEVNET_PUBLIC_RPC} # will default to devnet rpc if not listed
      ECLIPSE_MAINNET_RPC: ${ECLIPSE_MAINNET_RPC}
      ECLIPSE_TESTNET_RPC: ${ECLIPSE_TESTNET_RPC}
      ETH_MAINNET_RPC: ${ETH_MAINNET_RPC}
      ETH_HOLESKY_RPC: ${ETH_HOLESKY_RPC}
      CORE_MAINNET_RPC: ${CORE_MAINNET_RPC}
      CORE_TESTNET_RPC: ${CORE_TESTNET_RPC}
      MORPH_MAINNET_RPC: ${MORPH_MAINNET_RPC}
      MORPH_HOLESKY_RPC: ${MORPH_HOLESKY_RPC}
      ARBITRUM_SEPOLIA_RPC: ${ARBITRUM_SEPOLIA_RPC}
      ARBITRUM_ONE_RPC: ${ARBITRUM_ONE_RPC}    
  task-runner:
    image: switchboardlabs/task-runner-simulator
    ports:
      - "8000:8080"
    environment:
      # dedicated solana rpc's recommended
      SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC:-"https://api.mainnet-beta.solana.com"}
      SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC:-"https://api.devnet.solana.com"}
  ipfs:
    image: ipfs/kubo:latest
    container_name: ipfs_node
    volumes:
      - ./ipfs_staging:/export
      - ./ipfs_data:/data/ipfs
    ports:
      - "4001:4001"     # Swarm listening port
      - "4001:4001/udp" # Swarm UDP
      - "5001:5001"     # API port
      - "8090:8080"     # Gateway port (changed from 8080 to avoid conflict)
    environment:
      - IPFS_PROFILE=server
      - IPFS_PATH=/data/ipfs
    restart: unless-stopped
```

#### **Step 3: Create the `.env` File**

1. **Create a `.env` File**: In the same directory, create a `.env` file to store your environment variables. This file is read by `docker compose` and will override the default values in the compose file if specified.

```bash
# .env file
# delete any environment variables that you're not using

# recommended, but optional
SOLANA_MAINNET_RPC="your-mainnet-rpc-url"
SOLANA_DEVNET_RPC="your-devnet-rpc-url"

# ipfs
PINATA_JWT_KEY="your-pinata-jwt-key"
PINATA_GATEWAY_KEY="your-pinata-gateway-key"
# or
IPFS_GATEWAY_URL="your-ipfs-gateway-url"

# RPCs (all optional)
SUI_MAINNET_RPC="your-sui-testnet-rpc"
SUI_TESTNET_RPC="your-sui-testnet-rpc"
APTOS_MAINNET_RPC="your-aptos-mainnet-rpc"
APTOS_TESTNET_RPC="your-aptos-testnet-rpc"
ECLIPSE_MAINNET_RPC="your-eclipse-mainnet-rpc"
ECLIPSE_TESTNET_RPC="your-eclipse-testnet-rpc"
ETH_MAINNET_RPC="your-eth-mainnet-rpc"
ETH_HOLESKY_RPC="your-eth-holesky-rpc"
CORE_MAINNET_RPC="your-core-mainnet-rpc"
CORE_TESTNET_RPC="your-core-testnet-rpc"
MORPH_MAINNET_RPC="your-morph-mainnet-rpc"
MORPH_HOLESKY_RPC="your-morph-holesky-rpc"
ARBITRUM_SEPOLIA_RPC="your-arbitrum-sepolia-rpc"
ARBITRUM_ONE_RPC="your-arbitrum-one-rpc"
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

### Testing it out:

Try the deployment out by navigating to (can take a few seconds the first run): [http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)

The equivalent result should look something like the output from the public node: [https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)
