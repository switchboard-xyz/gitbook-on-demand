---
description: Using Switchboard On-Demand on Sui
---

# On Sui

**DISCLAIMER: SWITCHBOARD ON-DEMAND FOR SUI IS CURRENTLY PENDING AUDIT**

## Switchboard On-Demand Integration Guide

Examples and source code for Switchboard On-Demand on Sui can be found [here](https://github.com/switchboard-xyz/sui/).

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Mainnet: [0xe6717fb7c9d44706bf8ce8a651e25c0a7902d32cb0ff40c0976251ce8ac25655](https://suiscan.xyz/mainnet/object/0xe6717fb7c9d44706bf8ce8a651e25c0a7902d32cb0ff40c0976251ce8ac25655)
* Testnet: [0x578b91ec9dcc505439b2f0ec761c23ad2c533a1c23b0467f6c4ae3d9686709f6](https://suiscan.xyz/testnet/object/0x578b91ec9dcc505439b2f0ec761c23ad2c533a1c23b0467f6c4ae3d9686709f6)

### Getting Started

Custom data feeds can be configured aggregate data from any oracle ([Switchboard V2](../../switchboard-v2/), Chainlink, Pyth), any REST API, custom on-chain sources (like Uniswap, Raydium, Meteora, Orca, etc), and almost any other data provider.&#x20;

Just like in Switchboard-V2, and On-Demand on Solana, the feed sources can be configured with user-customizable [Oracle Jobs](https://protos.docs.switchboard.xyz/protos/OracleJob).

If you're not sure how to build a feed definition, please see the section on [Switchboard Feeds](../designing-feeds/).

If you want to build feeds quickly in a friendly User-Interface, please try out our [On-Demand Builder](https://ondemand.switchboard.xyz/) (just click 'builder'). It's a drag-n-drop interface with which you can build and deploy feeds.&#x20;

For a quick guide on creating feeds, updating, and reading from them, see [Getting Started](../on-evm-networks/developers-quickstart.md).
