---
description: What is a TEE and why do Switchboard Oracles need it?
---

# Hardware Requirements and AMD SEV SNP

Switchboard Oracles code uses a security feature called a [TEE (Trusted Execution Environment)](../../../switchboards-architecture-tech-stack-and-security/trusted-execution-environments-tees.md) to ensure that the code and data in transit is safe and secure, even from the Oracle Operators themselves.

To achieve this solution, a server that supports TEE via [AMD SEV SNP](https://en.wikipedia.org/wiki/Secure_Encrypted_Virtualization).

### AMD SEV SNP on AMD EPYC CPUs

In order for AMD SEV SNP to be enabled, you'll have to get a CPU and motherboard that supports it and ensure AMD SEV SNP is enabled in BIOS.\
You'll need an AMD EPYC processors that is part of family 7xx3, 7xx4, 9xx3 or 9xx4 series (or newer) with AMD SEV SNP support.

We specifically successfully tested with 7413 and 7313 CPUs.

Check the following link for a complete list [AMD SEV CPUs list in PDF](https://www.amd.com/content/dam/amd/en/documents/epyc-technical-docs/tuning-guides/58207-using-sev-with-amd-epyc-processors.pdf).

To sum it up, we use the AMD SEV SNP set of technologies as a TEE platform to encrypt virtual machines memory and isolate them to protect against unauthorized access, even from the hypervisor. However, it's fundamental to keep your BIOS and firmware updated for optimal security and performance. For validated providers and specific setup instructions, refer to later sections.

While not technically mandatory, if possible ensure to **disable hyperthreading (SMT)** as it is a potential security issue in a number of cases when working with TEEs.

We identified a set of trusted providers that we know works well with AMD SEV SNP and our own code, you can find a list later in the manual.

### How to enable AMD SEV SNP in MOST BIOS

Connect to your system BIOS and then be sure to change the following settings:

#### AMD CBS → CPU Common Options OR Advanced → CPU Configuration

* SVM Mode: Enabled
* SMEE: Enabled

#### AMD CBS → CPU Common Options

* SEV-ES ASID Count: 509 ASIDs
* SEV-ES ASID Space Limit Control: Manual
* SEV-ES ASID Space Limit: 32 (or more)
* SEV Control: Enabled
* SNP Memory (RMP Table) Coverage: Enabled

#### AMD CBS → CPU Common Options

Performance OR CCD/Core/Thread Enablement

* SMT (Multithreading): Disabled

#### AMD CBS → NBIO Common Options

* SEV-SNP Support : Enabled (_**NOT Auto**_)
