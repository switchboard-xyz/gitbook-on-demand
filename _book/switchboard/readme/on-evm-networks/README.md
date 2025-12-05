# On EVM Networks

We have built some tooling for the Switchboard On-Demand service allows users to create custom data feeds on the Ethereum Virtual Machine (EVM) networks.&#x20;

### Deployments

* Core Mainnet: [0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C](https://scan.coredao.org/address/0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C)
* Core Testnet: [0x2f833D73bA1086F3E5CDE9e9a695783984636A76](https://scan.test.btcs.network/address/0x2f833D73bA1086F3E5CDE9e9a695783984636A76)
* Arbitrum Sepolia: [0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b](https://sepolia.arbiscan.io/address/0xa2a0425fa3c5669d384f4e6c8068dfcf64485b3b)
* Arbitrum One: [0xad9b8604b6b97187cde9e826cdeb7033c8c37198](https://arbiscan.io/address/0xad9b8604b6b97187cde9e826cdeb7033c8c37198)
* Morph Holesky: [0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5](https://explorer-holesky.morphl2.io/address/0x3c1604DF82FDc873D289a47c6bb07AFA21f299e5)

### Getting Started

Custom data feeds can be configured aggregate data from any oracle ([Switchboard V2](../../switchboard-v2/), Chainlink, Pyth), any REST API, custom on-chain sources (like Uniswap, Raydium, Meteora, Orca, etc), and almost any other data provider.&#x20;

Just like in Switchboard-V2, and On-Demand on Solana, the feed sources can be configured with user-customizable [Oracle Jobs](https://protos.docs.switchboard.xyz/protos/OracleJob).

If you're not sure how to build a feed definition, please see the section on [Switchboard Feeds](../designing-feeds/).

If you want to build feeds quickly in a friendly User-Interface, please try out our [On-Demand Builder](https://ondemand.switchboard.xyz/) (just click 'builder'). It's a drag-n-drop interface with which you can build and deploy feeds.&#x20;

For a quick guide on creating feeds, updating, and reading from them, see [Getting Started](developers-quickstart.md).

For a detailed walkthrough on the design and deployment process with Switchboard, begin with [Designing a Feed](designing-a-feed-evm.md).
