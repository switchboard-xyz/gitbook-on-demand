---
description: >-
  List of providers and hints that we verified being compatible and fully
  supporting TEE/SGX
---

# Setup and prepare Kubernetes on SGX-enabled platforms

While there's many ways to run Kubernetes clusters, we identified a few trusted and tested providers that we know are compatible with the set of tools and setup that we need in our installation workflow.

Below is a list of all the ones that we tested for our own Oracle installations, and in the following pages you'll be able to find dedicated instructions for each of them.

## Azure:

* Website: [https://portal.azure.com/#home](https://portal.azure.com/#home)&#x20;
* Azure supports TEE/SGX via their [confidential compute platforms](https://learn.microsoft.com/en-us/azure/confidential-computing/trusted-execution-environment)
* Tested machine types:
  * [DCsv3/DCdsv3-series](https://learn.microsoft.com/en-us/azure/virtual-machines/dcv3-series)

## Equinix Metal

* Website: [https://console.equinix.com/](https://console.equinix.com/)
  * In order to enable SGX on your machine, you must reserve a bare-metal machine and then submit a support ticket to enabled SGX

## Vultr

* Website: [https://www.vultr.com/](https://www.vultr.com/products/bare-metal/#pricing)
* Using the Boot Connection log into the BIOS and ensure that Hyperthreading & overclocking/undervolting are disabled in the bios and SGX is enabled
  * follow step 3 in [this guide](https://docs.vultr.com/custom-iso-on-bare-metal) to enter BIOS
