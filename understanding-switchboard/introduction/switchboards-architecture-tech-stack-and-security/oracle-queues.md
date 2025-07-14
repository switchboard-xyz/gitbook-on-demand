# Oracle Queues

An Oracle Queue (often just called a “Queue”) is a core component of Switchboard, designed to manage and secure data feeds by creating a structured and secure environment that facilitates efficient management, isolation, and reliable data delivery.

Think of a Queue as:

* **A Dedicated Subnetwork of the larger Switchboard Protocol:** A whitelisted environment within the Switchboard protocol, controlling which software can be executed and which oracles are authorised to respond in its network.
* **An Oracle Registry:** A list of on-chain oracle accounts, each linked to a physical machine that fetches and publishes data.
* **A Security Boundary**: Oracles within a Queue must run verified code. This ensures that only trusted nodes contribute to the data feeds.
* **A Multi-Chain Entity**: Defined on Solana and synchronised across all Switchboard deployments on different blockchains.

Queues have an important key characteristic:

* Each data feed _must_ belong to **one**, and only **one**, Queue.
