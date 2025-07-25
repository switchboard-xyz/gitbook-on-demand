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

x-rpc-env: &rpc-env
  SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC:-https://api.mainnet-beta.solana.com}
  SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC:-https://api.devnet.solana.com}

services:
  crossbar:
    image: switchboardlabs/crossbar:latest
    depends_on:
      - ipfs
    ports: ["8080:8080"]
    environment:
      <<: *rpc-env
      TASK_RUNNER_URL: "http://task-runner:8080"
      IPFS_GATEWAY_URL: "http://ipfs:8080"
  task-runner:
    image: switchboardlabs/task-runner-simulator
    ports: ["8000:8080"]
    environment:
      <<: *rpc-env
  ipfs:
    image: ipfs/kubo:latest
    container_name: ipfs_node
    volumes:
      - ./ipfs_staging:/export
      - ./ipfs_data:/data/ipfs
    ports: ["4001:4001", "4001:4001/udp", "5001:5001", "8090:8080"]
    environment:
      - IPFS_PROFILE=server
      - IPFS_PATH=/data/ipfs
    restart: unless-stopped
```

#### **Step 3: Create the `.env` File**

1. **Create a `.env` File**: In the same directory, create a `.env` file to store your environment variables. This file is read by `docker compose` and will override the default values in the compose file if specified.

```bash
# .env file

# recommended, but optional
SOLANA_MAINNET_RPC="your-mainnet-rpc-url"
SOLANA_DEVNET_RPC="your-devnet-rpc-url"
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
