---
description: Your server, your cloud, your data...
---

# Bare Metal with Kubernetes (K3s) + AMD SEV SNP

### Initial setup steps

First of all, let's move to the proper directory:

```bash
cd install/bare-metal/kubernetes
├── 00-kernel-install.sh
├── 01-helm-install.sh
├── 02-snphost-install.sh
├── 30-k3s-install.sh
├── 31-k3s-sail-setup.sh
├── 40-oracle-ctr-sol.sh
├── 41-oracle-create-sol-account.sh
├── 50-oracle-ctr-sb.sh
├── 51-oracle-prepare-request.sh
├── 52-oracle-ncn-enroll.sh
├── 70-k8s-apps-cert-manager.sh
├── 71-k8s-apps-ingress-nginx.sh
├── 72-k8s-apps-watchtower.sh
├── 73-k8s-apps-vmagent.sh
├── 74-k8s-apps-logs.sh
├── 79-k8s-apps-infisical.sh
├── 80-test-cert-setup.sh
├── 81-test-cert-cleanup.sh
├── 90-k8s-oracle-install.sh
└── 91-k8s-ctr-cleanup.sh
```

From here, we can start running all the scripts, step by step, using the first two chars in the filename as a numerical order, starting from the smallest and going in ascending order.

### Step by step installation

```shell
./00-kernel-install.sh
```

This step will download and install a custom version of the Linux kernel, patched by AMD engineers to support SNP correctly.

Remember to reboot and verify that your system is then running kernel version `6.8.0-rc5-next-20240221-snp-host-cc2568386`.

Reboot done? good! If you haven't enable AMD SEV SNP in your BIOS now is a good time to do so.\
\
Now you can proceed with:

```shell
./01-helm-install.sh
```

This step will install a few utility tools like helm and k9s to interact with Kubernetes in amore efficient way.

```shell
./02-snphost-install.sh
```

This will install a small utility called `snphost` that can be used effectively by running:

```
snphost ok
```

anywhere in your system to run all the necessary AMD SEV SNP checks. You will get a list of checks that should all report `PASS` .

If that's not the case, you probably forgot to change/enable some of the needed settings in BIOS.

To proceed, let's start by installing Kubernetes with `k3s` using the following step:

```bash
./30-k3s-install.sh
```

This will just download and install `k3s` and start it.

After Kubernetes settles (you can check by connecting via `k9s` or `kubectl`) you can proceed by running next step:

```
31-k3s-sail-setup.sh
```

which will download our custom components and set `k3s` up to use them.

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

You will be prompted if you intend to also run a `Guardian`. Answer `no` unless you know what it is :sunglasses:.

Save the output of the command above and follow the link provided to send your request. Our operators will receive your request and provide you permission to be included in the queue as soon as possible.

Once done with the steps above, you can leave the container by typing `exit` and will be dropped back to the `docker` installation directory.

Save values from the output in the file dedicated to `devnet` or `mainnet` inside the `cfg` directory, based on your current setup.

#### \[RECOMMENDED] Enrolling Your Oracle in a Node Consensus Network (NCN)

After your Oracle has been granted permissions to participate in the Switchboard network, you can optionally enroll it in a Node Consensus Network (NCN) to participate in the restaking ecosystem.\
\
\&#xNAN;_**This allows your Oracle to earn additional rewards while contributing to network security.**_

To enroll your Oracle in an NCN, run the following command from the same temporary container you used for the previous steps:

```bash
# Make sure you're in the temporary container first by running:
./50-oracle-ctr-sb.sh

# Then run the NCN enrollment script (inside the container)
# only choose the one that applies to your setup
./52-oracle-ncn-enroll.sh # uses devnet by default
./52-oracle-ncn-enroll.sh devnet  # equivalent to above
./52-oracle-ncn-enroll.sh mainnet # run this for mainnet
```

This script will:

1. Check if you already have an NCN operator account or create a new one if needed
2. Link your Switchboard Oracle to your NCN operator
3. Initialize and prepare your operator for vault interactions
4. Guide you through the enrollment process with clear instructions

**What to Expect During Enrollment**

The script will display important information about your enrollment, including:

* Solana cluster (devnet or mainnet)
* NCN address
* Vault address
* NCN operator address
* Oracle operator address

**Important:** You must save this information when prompted. The script will display several notices with boxes around them - these contain critical information you'll need.

**Two-Phase Enrollment Process**

The NCN enrollment is a two-phase process:

1. **Initial Setup**: The script will execute the first set of transactions to link your Oracle to the NCN operator and initialize vault permissions.
2. **Completion Phase**: After Switchboard confirms your enrollment on their side, you'll need to return to the temporary container and run the final command displayed by the script to complete the process.

**Different Authority Scenarios**

If your Oracle keypair authority is different from your NCN operator admin, the script will detect this and provide you with specific instructions for completing the enrollment using separate keypairs.

After completing the enrollment process, your Oracle will be fully integrated with the NCN ecosystem, allowing you to participate in restaking and earn additional rewards.

Remember to exit the temporary container when you're done by typing `exit`.

### Install Kubernetes (with k3s) and all needed apps

For the following steps, you should be able to run them in order with no particular change. Just give each step 30-60 seconds to settle before proceeding to the next one:

```bash
./70-k8s-apps-cert-manager.sh
./71-k8s-apps-ingress-nginx.sh
```

The first the TLS certificate manager needed to create the HTTPs certificate that runs the reverse proxy in front of your gateway component.

Next you should install our Ingress toolset based on `nginx`:

```sh
./71-k8s-apps-ingress-nginx.sh bare-metal # deploys nginx
```

This will install nginx ingress and enable it.

### \[RECOMMENDED] Enable watchtower auto-update mechanism

To make maintenance and regular updates easier for our partners we propose a mechanism based on `watchtower`.

This software will monitor our repos automatically for you and pull and deploy newer versions of our Oracle automatically without any intervention on your side.

If you want to enable this feature, please run:

```
./72-k8s-apps-watchtower.sh
```

You can always disable it by removing it via `helm`.

If you don't use watchtower, please note that old Oracles that are not up-to-date will be excluded from running tasks in our queues.

### \[OPTIONAL] Enable metrics reporting and monitoring

While the following step is optional, we recommend running it as this will send statistics about your Oracle to our systems so that we can keep an eye on anomalies or outliers behaviors and warn you promptly if we detect any and keep our network safe:

```bash
# only choose the one that applies to your setup - optional step
./73-k8s-apps-vmagent.sh # uses devnet by default
./73-k8s-apps-vmagent.sh devnet  # equivalent to above
./73-k8s-apps-vmagent.sh mainnet # run this for mainnet
```

### \[OPTIONAL] Enable logs reporting for debugging purpose during support reqs

This step will enable sending all logs from your deployment to our central loggging aggregation system.

To do so we'll have to provide you a `username`and `password` to use in the command below.

This is a set of ephemeral credentials that will only work for the time need for the support request and will be deactivated afterwards.

After getting credentials from us please run:

```bash
./74-k8s-apps-logs.sh "my_username" "my_password"
```

remember to run the following command to clean up the logs forward installation after the support phase is completed:

```
helm uninstall -n sb-log-forwarding sb-log-forwarding 
```

and verify that the installation is gone.

### \[OPTIONAL] Secrets management via Infisical

Next is another optional step:

```bash
# only choose the one that applies to your setup - optional step
./79-k8s-apps-infisical.sh # uses devnet by default
./79-k8s-apps-infisical.sh devnet  # equivalent to above
./79-k8s-apps-infisical.sh mainnet # run this for mainnet
```

This will install all the needed artifacts and code for our integration with [Infisical](https://infisical.com/).\
This step is optional and needs to be completed by the data present in your `cfg` file with all the variables starting with `INFISICAL_`.

### \[OPTIONAL] TLS certificate creation test

Another optional step:

```bash
# only choose the one that applies to your setup - optional step
./80-test-cert-setup.sh # uses devnet by default
./80-test-cert-setup.sh devnet  # equivalent to above
./80-test-cert-setup.sh mainnet # run this for mainnet
```

This script will create an Ingress that will test your Kubernetes installation, DNS setup and the entire flow.

To verify that it's working, run the script above, give it 3-5 minutes and then visit the DNS record you decided to use for your system.

When done, please run:

```bash
# only choose the one that applies to your setup - optional step
./81-test-cert-cleanup.sh # uses devnet by default
./81-test-cert-cleanup.sh devnet  # equivalent to above
./81-test-cert-cleanup.sh mainnet # run this for mainnet
```

to clean up the artifacts that the test created.

### Finally start your Oracle!

If everything went well, it's now just a matter of running:

```bash
# only choose the one that applies to your setup
./90-k8s-oracle-install.sh # uses devnet by default
./90-k8s-oracle-install.sh devnet  # equivalent to above
./90-k8s-oracle-install.sh mainnet # run this for mainnet
```

So that the last step will install our Oracle code and run it in your Kubernetes cluster.

From this point onward, you can use the usual Kubernetes tools that you use to work with your cluster.

### Troubleshooting

#### Oracle not starting after reboot

Sometimes after a serve reboot, your Oracle containers may refuse to start and give back an error saying something like:

```
Error: failed to create containerd container: create instance 105: object with key "105" already exists: unknown
```

In this case, just run the step:

```
./91-k8s-ctr-cleanup.sh
```

and delete the Kubernetes PODs so that they will be recreated correctly.
