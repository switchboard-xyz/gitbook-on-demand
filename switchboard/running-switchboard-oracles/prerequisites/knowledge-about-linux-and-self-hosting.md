---
description: You know Linux right.. right?!?
---

# Knowledge about Linux, Docker and Self-Hosting

## About self-hosting and ...

Throughout this manual we assume a good grasp and knowledge of basic networking concepts, Linux system administration and cloud hosting, especially via Docker containers and potentially Kubernetes.

During the installation process multiple of the following tools will be used:

* Linux (Ubuntu 22.04 recommended)
* ctr (containerd) / Docker
* git
* ssh
* solana CLI tool
* switchboard CLI tool

## ... maybe some Docker compose? :robot:

If you choose to go with the Docker Compose based setup:

* Docker Compose

## ... maybe some Kubernetes? :cloud:

If you choose to go with the Kubernetes based setup:

* Kubernetes (via k3s or Azure/AKS)
* helm
* kubectl
* (optional) k9s

## ... definitely some TEE (AMD SEV or SGX)! :unlock:

In order to enable **Trusted Computing** via **AMD SEV** or _**SGX**_ (more on this in the next section) a minimal knowledge about navigating a server/computer motherboard BIOS could potentially also be needed, especially in case of going with the bare-metal solution but in general depending on the way you provision your hardware.
