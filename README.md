---
description: Introduction to On-Demand Oracles
---

# Switchboard On-Demand (Pull)

Welcome to the **Switchboard On-Demand** documentation! **Switchboard On-Demand** is designed to be a cost optimized, low latency and high security data solution for blockchain applications.&#x20;

It is built to support high fidelity financial systems where users can specify how data is ingested and transformed from on-chain or off-chain sources.

## How it works

Using Switchboard On-Demand is a just a 5 step process:

1. [Design Feed](switchboard/readme/designing-feeds/) (Pick your sources, build the job) in our builder app or by script.&#x20;
2. Create the Feed ([Solana](switchboard/readme/links-and-technical-documentation/creating-a-solana-feed.md), [EVM](switchboard/readme/on-evm-networks/creating-a-feed-evm.md))  in the builder app or by script.&#x20;
3. Query signed updates for your feed off-chain from oracles ([Solana](switchboard/readme/links-and-technical-documentation/integrating-into-frontends.md), [EVM](switchboard/readme/on-evm-networks/integrating-on-chain-evm.md))
4. Submit the updates on-chain for verification as part of a user transaction that uses this data ([Solana](switchboard/readme/links-and-technical-documentation/integrating-on-chain-svm.md), [EVM](switchboard/readme/on-evm-networks/integrating-on-chain-evm.md))
5. Use the fresh value(s) on-chain for your application

In this documentation, we'll cover each of these steps. Switchboard can support values from any api you can imagine.&#x20;



