---
description: Using Switchboard On-Demand on Sui
---

# On Sui

**DISCLAIMER: SWITCHBOARD ON-DEMAND FOR SUI IS UNAUDITED. USE AT YOUR OWN RISK.**

## Switchboard On-Demand Integration Guide

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Mainnet: [0x0b884dbc39d915f32a82cc62dabad75ca3efd3c568c329eba270b03c6f58cbd8](https://suiscan.xyz/mainnet/object/0x0b884dbc39d915f32a82cc62dabad75ca3efd3c568c329eba270b03c6f58cbd8)
* Testnet: [0x81fc6bbc64b7968e631b2a5b3a88652f91a617534e3755efab2f572858a30989](https://suiscan.xyz/testnet/object/0x81fc6bbc64b7968e631b2a5b3a88652f91a617534e3755efab2f572858a30989)

### Getting Started

Custom data feeds can be configured aggregate data from any oracle ([Switchboard V2](../../switchboard-v2/), Chainlink, Pyth), any REST API, custom on-chain sources (like Uniswap, Raydium, Meteora, Orca, etc), and almost any other data provider.&#x20;

Just like in Switchboard-V2, and On-Demand on Solana, the feed sources can be configured with user-customizable [Oracle Jobs](https://protos.docs.switchboard.xyz/protos/OracleJob).

If you're not sure how to build a feed definition, please see the section on [Switchboard Feeds](../designing-feeds/).

If you want to build feeds quickly in a friendly User-Interface, please try out our [On-Demand Builder](https://ondemand.switchboard.xyz/) (just click 'builder'). It's a drag-n-drop interface with which you can build and deploy feeds.&#x20;

For a quick guide on creating feeds, updating, and reading from them, see [Getting Started](../on-evm-networks/developers-quickstart.md).
