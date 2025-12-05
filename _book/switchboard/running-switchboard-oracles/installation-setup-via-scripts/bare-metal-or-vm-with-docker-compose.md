---
description: Containers... containers everywhere.
---

# Bare Metal or VM with Docker Compose

### Initial setup steps

Congrats, you've chosen the easier and straightforward solution to get to a running Oracle quickly.

First of all, let's move to the proper directory:

```bash
cd install/bare-metal/docker
├── 00-docker-install.sh
├── 10-sgx-install.sh
├── 11-sgx-mcu-setup.sh
├── 12-sgx-mcu-check.sh
├── 13-sgx-check-sa.sh
├── 40-oracle-ctr-sol.sh
├── 41-oracle-create-sol-account.sh
├── 50-oracle-ctr-sb.sh
├── 51-oracle-prepare-request.sh
├── 52-check-oracle-perms.sh
├── 60_cfg_enable_deprecated_v2.sh
├── 60_cfg_enable_devnet.sh
├── 60_cfg_enable_mainnet.sh
├── 61_cfg_disable_deprecated_v2.sh
├── 61_cfg_disable_devnet.sh
├── 61_cfg_disable_mainnet.sh
├── 70_cfg_enable_watchtower.sh
├── 71_cfg_disable_watchtower.sh
├── 90_docker_compose_up.sh
├── 91_docker_compose_wrapper.sh
└── 99_docker_compose_down.sh
```

From here, we can start running all the scripts, step by step, using the first two chars in the filename as a numerical order, starting from the smallest and going in ascending order.

Although you will only see below a description of some of the steps, please take each and every of them into consideration in regards to your specific setup and situation.

### Step by step installation

```shell
./00-docker-install.sh
```

This step will simply install Docker (Community Edition) on your system to enable containerized application deployments.

_**!!! SKIP ALL THE FOLLOWING STEPS ABOUT SGX IF YOU ARE ON AN AMD SEV SYSTEM !!!**_

```shell
./10-sgx-install.sh
```

This step will install all the necessary Intel SGX components and libraries on your system for secure enclave operations.

You may be asked to reboot your system, but let's wait til the next step to do so.

```shell
./11-sgx-mcu-setup.sh
```

This step will update your CPU Microcode with the official Intel latest one. At this point, you should reboot your system, as the script may have suggested you.

Reboot done? good! Now you can proceed with:

```shell
./12-sgx-mcu-check.sh
```

which is just to verify that the SGX Machine Certificate Unit (MCU) was properly updated. If the current version is the same or higher than the old one, you can continue.

Another quick checking step (that is also optional):

```shell
./13-sgx-check-sa.sh
```

This step will run a quick check about your SGX  status and configuration and show the Security Advisories that Intel has published and affect your current hardware.

You should see toward the end of the output, a line containing \`SGX QUOTE VERIFY\` similar to:

```
SGX QUOTE VERIFY: (true, ["INTEL-SA-00828", "INTEL-SA-00289", "INTEL-SA-00615"])
```

There are some advisories that we mitigate in code (like the ones in the example) but ideally you should have an empty list here.

_**!!! YOU CAN RESUME FROM HERE - IF YOU ARE ON AN AMD SEV SYSTEM !!!**_

### **Creating a payer.json Solana Account**

In this phase of the setup you're going to enter a temporary environment and create the Solana Account used by your Oracle. If you don't save the output when suggested to, once you'll leave this temporary container it will be really hard (if not impossible) to retrieve the content and thus the account you created. So please take time to read carefully instructions as you go through each step.

Let's start with:

```shell
./40-oracle-ctr-sol.sh
```

This step will drop you in a temporary container that will have all the necessary tools to run the following step:

```shell
# CHOOSE ONLY ONE, RELATED TO YOUR SETUP
./41-oracle-create-sol-account.sh # uses devnet by default
./41-oracle-create-sol-account.sh devnet # equivalent to above
./41-oracle-create-sol-account.sh mainnet # run this for mainnet
```

This step will create a new account on the Solana network that will be used by your Oracle and save it in the `data` directory, in the respective `devnet` and `mainnet` files.\
By default this script will crate a `devnet` account, so you want to create one for `mainnet` you have to call by adding `mainnet` at the end as shown above.\
Once done with the steps above, you can leave the container by typing `exit` and will be dropped back to the `docker` installation directory.

### Create a request to register your Oracle and Guardian to Switchboard queue

Now that you have a Solana account that can be used by your Oracle, you can send a request to be allowed to cooperate to the Switchboard network by contributing to tasks on a specific queue.

To do so, we have another special container that will make your life easy. To enter it just type:

```shell
./50-oracle-ctr-sb.sh
```

This will bring you in a temporary container that has our [Switchboard CLI tool](https://www.npmjs.com/package/@switchboard-xyz/cli/) available and is ready to send your request to be allow to contribute to the Switchboard network.

To send your request simply run:

```shell
./51-oracle-prepare-request.sh # uses devnet by default
./51-oracle-prepare-request.sh devnet  # equivalent to above
./51-oracle-prepare-request.sh mainnet # run this for mainnet
```

You will be prompted if you intend to also run a `Guardian`. Answer `no` unless you what know it is :sunglasses:.

Save the output of the command above and follow the link provided to send your request. Our operators will receive your request and provide you permission to be included in the queue as soon as possible.

You can check if you Oracle account got included in the queue by checking the output of the following command:

```shell
./52-oracle-check-perms.sh
```

and searching for your Oracle public key in the list of allowed Oracles.

Once done with the steps above, you can leave the container by typing `exit` and will be dropped back to the `docker` installation directory.

Save values from the output in the file dedicated to `devnet` or `mainnet` inside the `cfg` directory, based on your current setup.

### Enable the right Solana cluster network

Now that everything is configured and ready, you need to enable or disable the specific networks you configured, we created a set of steps to enable `devnet` or `mainnet` and their counter-parts to disable them:

```shell
./60_cfg_enable_deprecated_v2.sh  # IGNORE THIS - NOT NEEDED
./61_cfg_disable_deprecated_v2.sh # IGNORE THIS - NOT NEEDED

./60_cfg_enable_devnet.sh   # ENABLE DEVNET
./60_cfg_enable_mainnet.sh  # ENABLE MAINNET
./61_cfg_disable_devnet.sh  # DISABLE DEVNET
./61_cfg_disable_mainnet.sh # DISABLE MAINNET
```

Disable the network you're not using and enable the one you are using, you can run the same step multiple time if you're unsure whether you already run it or not.

### \[OPTIONAL] Enable watchtower auto-update mechanism

To make maintenance and regular updates easier for our partners we propose a mechanism based on `watchtower` this software will monitor our repos automatically for you and pull and deploy newer versions of our Oracle automatically without any intervention on your side.

If you want to enable this feature, please run:

```
./70_cfg_enable_watchtower.sh
```

You can always disable it by running step `./71_cfg_disable_watchtower.sh`.

If you don't use watchtower, please note that old Oracles that are not up-to-date will be excluded from running tasks in our queues.

### Finally start your Oracle!

If everything went well, it's now just a matter of running:

```shell
./90_docker_compose_up.sh
```

And your own Switchboard on-demand Oracle should be up and running!

You should see Docker Compose run through some output where it downloads the container images and starts them and then drops to background where it will continue execution.

If you want to interact with the Docker compose running your Oracle you can use all the usual Docker and Docker Compose tools or you can use the wrapper script that we created to make your life easier:

```shell
./91_docker_compose_wrapper.sh ps
./91_docker_compose_wrapper.sh logs --tail 10 -f
./91_docker_compose_wrapper.sh logs --tail 10 -f devnet-oracle devnet-gateway
```

This script is just a wrapper that will pass whatever arguments you give it to the Docker Compose configuration that is running your Oracle.

Whenever you want to download the latest Oracle image, just run:

```
./91_docker_compose_wrapper.sh pull
./90_docker_compose_up.sh
```

This will download the latest `stable` image and restart all containers that use it.

If for whatever reasons you want to stop your Oracle and all the related services, you can use the following step:

```shell
./99_docker_compose_down.sh
```

Which will shut down the Docker Compose environment and all running services.

You can then use step `90` again to start it back up.
