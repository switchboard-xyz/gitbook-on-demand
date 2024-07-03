---
description: Your server, your cloud, your data...
---

# Bare Metal with Kubernetes (K3s)

### Initial setup steps

Congrats, you've chosen the easier and straightforward solution to get to a running Oracle quickly.

First of all, let's move to the proper directory:

```bash
cd install/bare-metal/kubernetes
├── 00-docker-install.sh
├── 10-sgx-install.sh
├── 11-sgx-mcu-setup.sh
├── 12-sgx-mcu-check.sh
├── 13-sgx-check-sa.sh
├── 40-oracle-ctr-sol.sh
├── 41-oracle-create-sol-account.sh
├── 50-oracle-ctr-sb.sh
├── 51-oracle-prepare-request.sh
├── 52-oracle-check-perms.sh
├── 60-k3s-install.sh
├── 61-k3s-apps.sh
├── 70-k3s-vmagent.sh
├── 71-infisical-operator.sh
├── 80-test-cert-setup.sh
├── 81-test-cert-cleanup.sh
└── 99-k8s-oracle-install.sh
```

From here, we can start running all the scripts, step by step, using the first two chars in the filename as a numerical order, starting from the smallest and going in ascending order.

### Step by step installation

```shell
./00-docker-install.sh
```

This step will simply install Docker (Community Edition) on your system to enable containerized application deployments.

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

which is just to verifies if the SGX Machine Certificate Unit (MCU) was properly updated. If the current version is the same or higher than the old one, you can continue.

Another quick checking step (that is also optional):

```shell
./13-sgx-check-sa.sh
```

This step will run a quick check about your SGX  status and configuration and show the Security Advisories that Intel has published and affect your current hardware.

There are some advisories that we mitigate in code, but ideally you should have an empty list here.

### **Creating a payer.json Solana Account**

In this phase of the setup you're going to enter a temporary environment and create the Solana Account used by your Oracle. If you don't save the output when suggested to, once you'll leave this temporary container it will be really hard (if not impossible) to retrieve the content and thus the account you created. So please take time to read carefully instructions as you go through each step.

Let's start with:

```shell
./40-oracle-ctr-sol.sh
```

This step will drop you in a temporary container that will have all the necessary tools to run the following step:

```shell
# only choose the one that applies to your setup
./41-oracle-create-sol-account.sh # uses devnet by default
./41-oracle-create-sol-account.sh devnet  # equivalent to above
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
# only choose the one that applies to your setup
./51-oracle-prepare-request.sh # uses devnet by default
./51-oracle-prepare-request.sh devnet  # equivalent to above
./51-oracle-prepare-request.sh mainnet # run this for mainnet
```

You will be prompted if you intend to also run a `Guardian`. Answer `no` unless you what it is :sunglasses:.

Save the output of the command above and follow the link provided to send your request. Our operators will receive your request and provide you permission to be included in the queue as soon as possible.

You can check if you Oracle account got included in the queue by checking the output of the following command:

```shell
# only choose the one that applies to your setup
./52-oracle-check-perms.sh # uses devnet by default
./52-oracle-check-perms.sh devnet  # equivalent to above
./52-oracle-check-perms.sh mainnet # run this for mainnet
```

and searching for your Oracle public key in the list of allowed Oracles.

Once done with the steps above, you can leave the container by typing `exit` and will be dropped back to the `docker` installation directory.

Save values from the output in the file dedicated to `devnet` or `mainnet` inside the `cfg` directory, based on your current setup.

### Install Kubernetes (with k3s) and all needed apps

To proceed, let's start by installing Kubernetes with `k3s` using the following step:

```bash
./60-k3s-install.sh
```

This will just download and install `k3s` and start it. Then let's run:

```bash
# only choose the one that applies to your setup
./61-k3s-apps.sh # uses devnet by default
./61-k3s-apps.sh devnet  # equivalent to above
./61-k3s-apps.sh mainnet # run this for mainnet
```

This step will install all the dependency apps needed to run our Oracle code. Next you should run:

```bash
# only choose the one that applies to your setup - optional step
./70-k3s-vmagent.sh # uses devnet by default
./70-k3s-vmagent.sh devnet  # equivalent to above
./70-k3s-vmagent.sh mainnet # run this for mainnet
```

While this step is optional, we recommend running it as will send statistics about your Oracle to our systems so that we can keep an eye on anomalies or outliers behaviors and warn you promptly if we detect any.

Next is another optional step:

```
# only choose the one that applies to your setup - optional step
./71-infisical-operator.sh # uses devnet by default
./71-infisical-operator.sh devnet  # equivalent to above
./71-infisical-operator.sh mainnet # run this for mainnet
```

This will install all the needed artifacts and code for our integration with [Infisical](https://infisical.com/). \
This step is optional and needs to be completed by the data present in your `cfg` file with all the variables starting with `INFISICAL_`.

Another optional step:

```
# only choose the one that applies to your setup - optional step
./80-test-cert-setup.sh # uses devnet by default
./80-test-cert-setup.sh devnet  # equivalent to above
./80-test-cert-setup.sh mainnet # run this for mainnet
```

This script will create an Ingress that will test your Kuberentes installation, DNS setup and the entire flow.

To verify that it's working, run the script above, give it 3-5 minutes and then visit the DNS record you decided to use for your system.

When done, please `81-test-cert-cleanup.sh` to clean up the artificats that the test created.

### Finally start your Oracle!

If everything went well, it's now just a matter of running:

```
# only choose the one that applies to your setup
./99-k8s-oracle-install.sh # uses devnet by default
./99-k8s-oracle-install.sh devnet  # equivalent to above
./99-k8s-oracle-install.sh mainnet # run this for mainnet
```

So that the last step will install our Oracle code and run it in your Kubernetes cluster.

From this point onward, you can use the usual Kubernetes tools that you use to work with your cluster.
