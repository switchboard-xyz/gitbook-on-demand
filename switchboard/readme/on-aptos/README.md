---
description: Using Switchboard On-Demand on APtos
---

# On Aptos

**DISCLAIMER: SWITCHBOARD ON-DEMAND ON APTOS IS CURRENTLY PENDING AUDIT**

## Switchboard On-Demand Integration Guide

A repository with examples can be found [here](https://github.com/switchboard-xyz/aptos/).

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Aptos Mainnet: [0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a59057752b8](https://explorer.aptoslabs.com/object/0xfea54925b5ac1912331e2e62049849b37842efaea298118b66f85a59057752b8/modules/code/aggregator?network=mainnet)
* Aptos Testnet: [0x81fc6bbc64b7968e631b2a5b3a88652f91a617534e3755efab2f572858a30989](https://explorer.aptoslabs.com/object/0x4fc1809ffb3c5ada6b4e885d4dbdbeb70cbdd99cbc0c8485965d95c2eab90935/modules/code/aggregator?network=testnet)

### Getting Started

Custom data feeds can be configured aggregate data from any oracle ([Switchboard V2](../../switchboard-v2/), Chainlink, Pyth), any REST API, custom on-chain sources (like Uniswap, Raydium, Meteora, Orca, etc), and almost any other data provider.&#x20;

Just like in Switchboard-V2, and On-Demand on Solana, the feed sources can be configured with user-customizable [Oracle Jobs](https://protos.docs.switchboard.xyz/protos/OracleJob).

If you're not sure how to build a feed definition, please see the section on [Switchboard Feeds](../designing-feeds/).

If you want to build feeds quickly in a friendly User-Interface, please try out our [On-Demand Builder](https://ondemand.switchboard.xyz/) (just click 'builder'). It's a drag-n-drop interface with which you can build and deploy feeds.&#x20;

For a quick guide on creating feeds, updating, and reading from them, see [Getting Started](../on-evm-networks/developers-quickstart.md).
