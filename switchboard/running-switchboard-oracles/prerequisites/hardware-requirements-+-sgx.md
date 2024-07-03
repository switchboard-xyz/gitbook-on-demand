---
description: What is SGX and why do Switchboard Oracles need it?
---

# Hardware Requirements and SGX

Switchboard Oracles code uses a security feature called [TEE (Trusted Execution Environment)](https://en.wikipedia.org/wiki/Trusted\_execution\_environment) to ensure that the code and data in transit is safe and secure even from the Oracle Operators themselves.

To achieve this solution, a server that supports TEE via [Intel SGX](https://en.wikipedia.org/wiki/Software\_Guard\_Extensions) is needed.

In order for SGX to be enabled, you'll have to get a CPU and motherboard that supports it (we suggest getting the latest Xeon that supports it) and set it `enabled` or `software controlled` via your server BIOS (or request your provider support to do so for you, most likely by opening a ticket).

While not mandatory, if possible ensure to **disable hyperthreading** as it is a potential security issue on a number of Intel CPUs when used with SGX enabled.&#x20;

We identified a set of trusted providers that we know works well with SGX and our own code, you can find a list later in the manual.
