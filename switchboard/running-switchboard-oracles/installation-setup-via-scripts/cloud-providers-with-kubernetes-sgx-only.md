---
description: All the power of Kubernetes, all the ease of a PaaS environment
---

# Cloud providers with Kubernetes

### Initial setup steps

First of all, let's move to the proper directory:

```sh
cd install/cloud/azure
├── 01-helm-install.sh
├── 40-oracle-ctr-sol.sh
├── 41-oracle-create-sol-account.sh
├── 50-oracle-ctr-sb.sh
├── 51-oracle-prepare-request.sh
├── 52-oracle-check-perms.sh
├── 70-k8s-apps-cert-manager.sh
├── 71-k8s-apps-sgx.sh
├── 72-k8s-apps-ingress-nginx.sh
├── 73-k8s-apps-vmagent.sh
├── 74-k8s-apps-watchtower.sh
├── 80-test-cert-setup.sh
├── 81-test-cert-cleanup.sh
└── 99-k8s-oracle-install.sh
```

From here, we can start running all the scripts, step by step, using the first two chars in the filename as a numerical order, starting from the smallest and going in ascending order.

### Install Helm

```shell
./01-helm-install.sh
```

This will install the [helm](https://helm.sh/) cli tool, which will be used later on to install helm charts on your kubernetes cluster.

### **Creating a payer.json Solana Account**

In this phase of the setup you're going to enter a temporary environment and create the Solana Account used by your Oracle. If you don't save the output when suggested to, once you'll leave this temporary container it will be really hard (if not impossible) to retrieve the content and thus the account you created. So please take time to read carefully instructions as you go through each step.

Let's start with:

```shell
./40-oracle-ctr-sol.sh
```

This step will drop you in a temporary container that will have all the necessary tools to run the following step:

```shell
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
./51-oracle-prepare-request.sh # uses devnet by default
./51-oracle-prepare-request.sh devnet  # equivalent to above
./51-oracle-prepare-request.sh mainnet # run this for mainnet
```

You will be prompted if you intend to also run a `Guardian`. Answer `no` unless you know what it is :sunglasses:.

Save the output of the command above and follow the link provided to send your request. Our operators will receive your request and provide you permission to be included in the queue as soon as possible.

You can check if you Oracle account got included in the queue by checking the output of the following command:

```shell
./52-oracle-check-perms.sh # uses devnet by default
./52-oracle-check-perms.sh devnet  # equivalent to above
./52-oracle-check-perms.sh mainnet # run this for mainnet
```

and searching for your Oracle public key in the list of allowed Oracles.

Once done with the steps above, you can leave the container by typing `exit` and will be dropped back to the `docker` installation directory.

Save values from the output in the file dedicated to `devnet` or `mainnet` inside the `cfg` directory, based on your current setup.

### Install the necessary kubernetes apps

For the following steps, you should only run the ones that apply to your specific Kubernetes setup, so you can read the comments below, the content of the scripts or the output of the scripts:

```bash
./70-k8s-apps-cert-manager.sh # installs cert-manager
./71-k8s-apps-sgx.sh # installs SGX libraries
```

This step will install SGX and TLS certificate manager dependencies needed to run our Oracle code.&#x20;

Next you should install our Ingress toolset based on `nginx`, just specify which option suits your setup best:&#x20;

```sh
./72-k8s-apps-ingress-nginx.sh azure # deploys nginx
```

This will install nginx with the correct platform setup.

### \[OPTIONAL] Enable metrics reporting and monitoring

While the following step is optional, we recommend running it as this will send statistics about your Oracle to our systems so that we can keep an eye on anomalies or outliers behaviors and warn you promptly if we detect any and keep our network safe:

```bash
./73-k8s-apps-vmagent.sh # uses devnet by default
./73-k8s-apps-vmagent.sh devnet  # equivalent to above
./73-k8s-apps-vmagent.sh mainnet # run this for mainnet
```

### \[OPTIONAL] Enable watchtower auto-update mechanism

To make maintenance and regular updates easier for our partners we propose a mechanism based on `watchtower`.

This software will monitor our repos automatically for you and pull and deploy newer versions of our Oracle automatically without any intervention on your side.

If you want to enable this feature, please run:

```
./74-k8s-apps-watchtower.sh
```

You can always disable it by removing it via `helm`.

If you don't use watchtower, please note that old Oracles that are not up-to-date will be excluded from running tasks in our queues.

### \[OPTIONAL] TLS certificate creation test

Another optional step:

```bash
./80-test-cert-setup.sh # uses devnet by default
./80-test-cert-setup.sh devnet  # equivalent to above
./80-test-cert-setup.sh mainnet # run this for mainnet
```

This script will create an Ingress that will test your Kubernetes installation, DNS setup and the entire flow.

To verify that it's working, run the script above, give it 3-5 minutes and then visit the DNS record you decided to use for your system.

When done, please the next step to clean up the artifacts that the test created:

```
81-test-cert-cleanup.sh 
```

### Finally, start your Oracle!

If everything went well, it's now just a matter of running:

```bash
./99-k8s-oracle-install.sh # uses devnet by default
./99-k8s-oracle-install.sh devnet  # equivalent to above
./99-k8s-oracle-install.sh mainnet # run this for mainnet
```

So that the last step will install our Oracle code and run it in your Kubernetes cluster.

From this point onward, you can use the usual Kubernetes tools that you use to work with your cluster.
