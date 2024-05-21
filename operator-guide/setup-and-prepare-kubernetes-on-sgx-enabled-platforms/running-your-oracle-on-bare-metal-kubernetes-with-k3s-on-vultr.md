---
description: >-
  Basic setup steps to create a bare-metal Kubernetes infrastructure with K3S on
  Vultr.
---

# Running your Oracle on bare metal Kubernetes with (k3s) on Vultr

Creating a Kubernetes cluster on bare-metal is no easy task, but with the right tools, provider and workflow it'll allow to create a reliable self-healing machine that will run your Oracle in the best possible way.

Creating a Kubernetes cluster consisting of a single node on bare metal can be achieved in many ways and the best options (according to our recent tests) is [k3s](https://k3s.io).

To begin your installation, start by cloning our infra-external repo and change to the scripts installation directory in it:

```bash
git clone https://github.com/switchboard-xyz/infra-external/
cd infra-external/scripts/install
```

Once done, just start running the scripts one at a time, starting with the SGX libraries for Ubuntu:

```
./10-sgx-install.sh
```

SGX systems need to be kept up-to-date and patched constantly, and one of the components that needs to be updated is the microcode through a procedure called MCU (microcode update).

Updating and patching your system, microcode and BIOS is vital to any SGX enabled system as it will take care and mitigate Security Advisories (SA) to keep your code and data safe.

We created two scripts that should help you in doing that:

```
./11-sgx-mcu-setup.sh
```

At this point you'll have to reboot your server and then you can used the following step to check if the MCU succeeded:

```
./12-sgx-mcu-check.sh
```

If it all worked correctly, then continue by installing K3s (our kubernetes distribution of choice):

```
./20-k3s-install.sh
```

From this point on, the process is identical for all other Kubernetes clusters, so you can move to the next section which is [install-supporting-applications](../install-supporting-applications/ "mention")
