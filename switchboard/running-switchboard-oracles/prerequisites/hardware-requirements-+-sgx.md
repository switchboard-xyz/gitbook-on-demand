# Hardware requirements + SGX

Switchboard Oracle code uses a security feature called [TEE (Trusted Execution Environment)](https://en.wikipedia.org/wiki/Trusted\_execution\_environment) to ensure that the code is safe and secure.

To do so a server that supports [Intel SGX](https://en.wikipedia.org/wiki/Software\_Guard\_Extensions) is needed.

In order for SGX to be enabled, you'll have to set it to `enabled` via your server BIOS (or request support to do so for you by opening a ticket in some cases).

Also ensure to **disable hyperthreading** as it is potentially a security issue with a good number of Intel CPUs when used with SGX enabled.&#x20;

We identified a set of trusted providers that we know works well with SGX and our own code, you can find a list in the next section.
