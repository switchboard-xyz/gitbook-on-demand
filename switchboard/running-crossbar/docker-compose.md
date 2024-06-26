---
description: Mini-tutorial on setting up crossbar with docker-compose
---

# Docker Compose

## Operating Crossbar with Docker Compose

#### Prerequisites

Before deploying the Docker container, ensure you have the following:

* **Docker** and **Docker Compose** installed on your machine.

**Step 1: Set Up Your Project Directory**

1. **Create a Project Directory**: Create a directory for your project. This directory will contain all the necessary files for your Docker container deployment.

```sh
mkdir my-crossbar-project
cd my-crossbar-project
```

**Step 2: Create the `docker-compose.yml` File**

2. **Create a `docker-compose.yml` File**: In your project directory, create a file named `docker-compose.yml`. This file will define the Docker services and environment variables.

```yaml
version: '3.8'

services:
  my_service:
    image: switchboardlabs/crossbar:latest
    ports:
      - "8080:8080"
    environment:
      # dedicated solana rpc's recommended
      SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC:-"https://api.mainnet-beta.solana.com"}
      SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC:-"https://api.devnet.solana.com"}
      # ipfs gateways
      PINATA_JWT_KEY: ${PINATA_JWT_KEY}
      PINATA_GATEWAY_KEY: ${PINATA_GATEWAY_KEY}
      # or 
      IPFS_GATEWAY_URL: ${IPFS_GATEWAY_URL}
      # or
      KUBO_URL: ${KUBO_URL}
      # EVM RPCs (all optional)
      CORE_MAINNET_RPC: ${CORE_MAINNET_RPC}
      CORE_TESTNET_RPC: ${CORE_TESTNET_RPC}
      MORPH_HOLESKY_RPC: ${MORPH_HOLESKY_RPC}
      ARBITRUM_SEPOLIA_RPC: ${ARBITRUM_SEPOLIA_RPC}
      ARBITRUM_ONE_RPC: ${ARBITRUM_ONE_RPC}
```

**Step 3: Create the `.env` File**

3. **Create a `.env` File**: In the same directory, create a `.env` file to store your environment variables. This file will override the default values if specified.

```bash
# .env file

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

**Step 4: Build and Run the Docker Container**

4. **Build and Run the Docker Container**: Navigate to your project directory and run the following command to start your Docker container:

```sh
docker-compose up -d
```

This command will start the container in detached mode. The `-d` flag stands for "detached," meaning the container runs in the background.

**Step 5: Verify the Deployment**

5. **Verify the Deployment**: Once the container is running, you can verify that the service is up and running by accessing it at `http://localhost:8080`. You can also check the status of the container by running:

```sh
docker-compose ps
```

This command will show the status of the running services.

**Step 6: Stopping and Restarting the Docker Container**

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

* **Scaling Services**: If you need to scale your service, you can do so by specifying the number of instances:

```sh
docker-compose up -d --scale my_service=3
```

This command will run three instances of `my_service`.

## Testing it out:

Try the deployment out by navigating to (can take a few seconds the first run): [http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](http://localhost:8080/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)

The equivalent result should look something like the output from the public node: [https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0](https://crossbar.switchboard.xyz/updates/evm/1115/4f0e020e3d6f65cf21adb7766d065f787293154964be259dddb56e848ff838a0)
