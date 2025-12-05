---
description: What is a TEE and why do Switchboard Oracles need it?
---

# Hardware Requirements and AMD SEV / SGX

Switchboard Oracles code uses a security feature called [TEE (Trusted Execution Environment)](https://en.wikipedia.org/wiki/Trusted\_execution\_environment) to ensure that the code and data in transit is safe and secure even from the Oracle Operators themselves.

To achieve this solution, a server that supports TEE via [AMD SEV](https://en.wikipedia.org/wiki/Secure\_Encrypted\_Virtualization) or [Intel SGX](https://en.wikipedia.org/wiki/Software\_Guard\_Extensions) is needed.

### AMD SEV (on EPYC CPUs)

In order for AMD SEV and AMD SEV SNP to be enabled, you'll have to get a CPU and motherboard that supports it and ensure SEV is enabled in BIOS. \
You'll need an AMD EPYC processors that is from a 7xxx or 9xxx model for SEV to be working (check the following link for a complete list [AMD SEV CPUs list in PDF](https://www.amd.com/content/dam/amd/en/documents/epyc-technical-docs/tuning-guides/58207-using-sev-with-amd-epyc-processors.pdf)).\
SEV as a TEE encrypts virtual machines to protect against unauthorized access, even from the hypervisor but it's fundamental to keep your BIOS and firmware updated for optimal security and performance. \
For validated providers and specific setup instructions, refer to later sections.&#x20;

A quick note about nomenclature: whenever we talk about AMD SEV we're really referring to AMD SEV + AMD SEV SNP as we need both technologies for our Oracle, so be sure to enable both in your BIOS.

**Critical: AMD SEV VM vs AMD SEV Host**

Once confirmed that your AMD SEV Host is set up, in case you run your own virtualization host on bare metal, it's time to focus on the guest (the Virtual Machine - VM).\
When referring to "host" or "system," it indicates the AMD SEV guest (the Virtual Machine). To run Oracle, an AMD SEV Virtual Machine Guest is essential

### Intel SGX (on Xeon CPUs)

In order for SGX to be enabled, you'll have to get a CPU and motherboard that supports it (we suggest getting the latest Xeon that supports it) and set it `enabled` or `software controlled` via your server BIOS (or request your provider support to do so for you, most likely by opening a ticket).

While not mandatory, if possible ensure to **disable hyperthreading** as it is a potential security issue on a number of Intel CPUs when used with SGX enabled.&#x20;

We identified a set of trusted providers that we know works well with SGX and our own code, you can find a list later in the manual.

Be aware that due to how SGX is implemented on certain CPUs, Xeon Gold CPU are not supported by our Oracles.
