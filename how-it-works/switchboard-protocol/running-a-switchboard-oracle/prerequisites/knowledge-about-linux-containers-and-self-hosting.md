---
description: You know Linux right.. right?!?
---

# Knowledge about Linux, containers and Self-Hosting

## About self-hosting and ...

Throughout this manual we assume a good grasp and knowledge of basic networking concepts, Linux system administration and cloud hosting, especially via containers and a basic understanding of Kubernetes.

During the installation process multiple of the following tools will be used:

* Linux (Ubuntu 24.04)
* ctr (containerd)
* git
* ssh
* Solana CLI tool
* Switchboard CLI tool

## ... definitely some Kubernetes? :cloud:

Our deployment platform of choice is Kubernetes on bare metal via \`k3s\`, so you'll also use the following tools:

* Kubernetes (via k3s or Azure/AKS)
* helm
* kubectl
* (optional) k9s

## ... definitely some TEE (AMD SEV SNP)! :unlock:

In order to enable **Trusted Computing** via **AMD SEV** SNP (more on this in the next section) a minimal knowledge about navigating a server/computer motherboard BIOS will also be needed to configure your system to enable the needed features.
