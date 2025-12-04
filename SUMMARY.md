# Table of contents

* [Switchboard On Demand](README.md)
* [Why Switchboard?](why-switchboard.md)
* [Quick Start](quick-start.md)

## Understanding Switchboard

* [Introduction](understanding-switchboard/introduction/README.md)
  * [Why Switchboard Oracles?](understanding-switchboard/introduction/why-switchboard-oracles.md)
  * [Vision & mission](understanding-switchboard/introduction/vision-and-mission.md)
  * [Brief History and Key Achievements to Date](understanding-switchboard/introduction/brief-history-and-key-achievements-to-date.md)
  * [Switchboard’s Architecture, Tech Stack and Security](understanding-switchboard/introduction/switchboards-architecture-tech-stack-and-security/README.md)
    * [Trusted Execution Environments (TEEs)](understanding-switchboard/introduction/switchboards-architecture-tech-stack-and-security/trusted-execution-environments-tees.md)
    * [Oracle Queues](understanding-switchboard/introduction/switchboards-architecture-tech-stack-and-security/oracle-queues.md)
    * [Node Architecture](understanding-switchboard/introduction/switchboards-architecture-tech-stack-and-security/node-architecture.md)

## Product Documentation

* [Solana / SVM](product-documentation/solana-svm/README.md)
  * [Data Feeds](product-documentation/solana-svm/data-feeds.md)
  * [Oracle Aggregator](product-documentation/solana-svm/oracle-aggregator/README.md)
    * [How to use the Switchboard Oracle Aggregator](product-documentation/solana-svm/oracle-aggregator/how-to-use-the-switchboard-oracle-aggregator.md)
  * [Randomness](product-documentation/solana-svm/randomness.md)
* [Data Feeds](product-documentation/data-feeds/README.md)
  * [Getting Started with Switchboard Data Feeds](product-documentation/data-feeds/getting-started-with-switchboard-data-feeds.md)
  * [Solana / SVM](product-documentation/data-feeds/solana-svm/README.md)
    * [Part 1: Designing and Simulating Your Feed](product-documentation/data-feeds/solana-svm/part-1-designing-and-simulating-your-feed/README.md)
      * [Option 1: Drag-and-Drop Feed Builder](product-documentation/data-feeds/solana-svm/part-1-designing-and-simulating-your-feed/option-1-drag-and-drop-feed-builder.md)
      * [Option 2: Designing a Feed in Typescript](product-documentation/data-feeds/solana-svm/part-1-designing-and-simulating-your-feed/option-2-designing-a-feed-in-typescript.md)
    * [Part 2: Deploying your Feed On-Chain](product-documentation/data-feeds/solana-svm/part-2-deploying-your-feed-on-chain.md)
    * [Part 3: Integrating your Feed](docs-by-chain/solana-svm/data-feeds/part-3-integrating-your-feed/README.md)
      * [Integrating your Feed On-Chain](product-documentation/data-feeds/solana-svm/part-3-integrating-your-feed/integrating-your-feed-on-chain.md)
      * [Integrating into Frontends](product-documentation/data-feeds/solana-svm/part-3-integrating-your-feed/integrating-into-frontends.md)
    * [Costs](product-documentation/data-feeds/solana-svm/costs.md)
    * [Integrating on Eclipse](product-documentation/data-feeds/solana-svm/integrating-on-eclipse.md)
  * [EVM](product-documentation/data-feeds/evm/README.md)
    * [Part 1: Prerequisites and Quick Start Guide](product-documentation/data-feeds/evm/part-1-prerequisites-and-quick-start-guide.md)
    * [Part 2: Designing and Creating Your Feed](product-documentation/data-feeds/evm/part-2-designing-and-creating-your-feed/README.md)
      * [Option 1: Drag-and-Drop Feed Builder](product-documentation/data-feeds/evm/part-2-designing-and-creating-your-feed/option-1-drag-and-drop-feed-builder.md)
      * [Option 2: Designing a Feed in Typescript](product-documentation/data-feeds/evm/part-2-designing-and-creating-your-feed/option-2-designing-a-feed-in-typescript.md)
    * [Part 3: Integrating your Feed](product-documentation/data-feeds/evm/part-3-integrating-your-feed/README.md)
      * [Integrating your Feed On-Chain](product-documentation/data-feeds/evm/part-3-integrating-your-feed/integrating-your-feed-on-chain.md)
      * [Integrating your Feed with Typescript](product-documentation/data-feeds/evm/part-3-integrating-your-feed/integrating-your-feed-with-typescript.md)
      * [Integrating into Frontends (EVM)](product-documentation/data-feeds/evm/part-3-integrating-your-feed/integrating-into-frontends-evm.md)
  * [Aptos](product-documentation/data-feeds/aptos.md)
  * [Sui](product-documentation/data-feeds/sui.md)
  * [Iota](product-documentation/data-feeds/iota.md)
  * [Movement](product-documentation/data-feeds/movement.md)
  * [Starknet](product-documentation/data-feeds/starknet.md)
  * [Optional Features](product-documentation/data-feeds/optional-features.md)
  * [Task Types](product-documentation/data-feeds/task-types.md)
  * [Advanced Feed Configuration](product-documentation/data-feeds/designing-feeds/README.md)
    * [Data Feed Variable Overrides](product-documentation/data-feeds/designing-feeds/data-feed-variable-overrides.md)
    * [Variables with CacheTask](product-documentation/data-feeds/designing-feeds/variables-with-cachetask.md)
    * [REST APIs with HttpTask](product-documentation/data-feeds/designing-feeds/rest-apis-with-httptask.md)
    * [How Feeds are Resolved](product-documentation/data-feeds/designing-feeds/how-feeds-are-resolved.md)
    * [Bounding Results](product-documentation/data-feeds/designing-feeds/bounding-results.md)
    * [Decentralized Exchanges](product-documentation/data-feeds/designing-feeds/decentralized-exchanges.md)
    * [Oracle Aggregator](product-documentation/data-feeds/designing-feeds/oracle-aggregator.md)
    * [LLMs Integration](product-documentation/data-feeds/designing-feeds/llms-integration.md)
    * [FAQ](product-documentation/data-feeds/designing-feeds/faq.md)
* [Tutorials](product-documentation/tutorials.md)
* [Aggregator](product-documentation/aggregator/README.md)
  * [How to use the Switchboard Oracle Aggregator](product-documentation/aggregator/how-to-use-the-switchboard-oracle-aggregator.md)
* [Randomness](product-documentation/randomness/README.md)
  * [Why Randomness is important?](product-documentation/randomness/why-randomness-is-important.md)
  * [Switchboard's Approach to Verifiable Randomness](product-documentation/randomness/switchboards-approach-to-verifiable-randomness.md)
  * [Tutorials](product-documentation/randomness/tutorials/README.md)
    * [Solana / SVM](product-documentation/randomness/tutorials/solana-svm.md)
    * [EVM](product-documentation/randomness/tutorials/evm.md)
* [SAIL](product-documentation/sail.md)

## Tooling and Resources

* [Crossbar](tooling-and-resources/crossbar/README.md)
  * [Run Crossbar with Docker Compose](tooling-and-resources/crossbar/run-crossbar-with-docker-compose.md)
* [Switchboard Command Line Interface](tooling-and-resources/switchboard-command-line-interface.md)
* [Technical Resources and Documentation](tooling-and-resources/technical-resources-and-documentation/README.md)
  * [SDKs and Documentation](tooling-and-resources/technical-resources-and-documentation/sdks-and-documentation.md)
  * [Solana Accounts](tooling-and-resources/technical-resources-and-documentation/solana-accounts.md)
  * [EVM Identifiers](tooling-and-resources/technical-resources-and-documentation/evm-identifiers.md)
  * [Code Examples (Github)](https://github.com/switchboard-xyz/sb-on-demand-examples)

## 📦 Oracle Quotes: The New Standard

* [Oracle Quotes Overview](oracle-quotes-the-new-standard/oracle-quotes.md)
* [Oracle Quotes Quick Start](oracle-quotes-the-new-standard/oracle-quotes.md#getting-started)
* [Oracle Quotes Integration Examples](oracle-quotes-the-new-standard/oracle-quotes.md#real-world-examples)

## 🌊 Switchboard Surge

* [🌊 Surge Overview](switchboard-surge/surge-overview.md)
* [Getting Started with Surge](switchboard-surge/surge.md)
* [Surge Implementation Guide](switchboard-surge/surge.md#implementation)
* [Using Crossbar for Surge](switchboard-surge/surge.md#using-crossbar-to-stream-surge-prices-to-your-ui)

## Switchboard Protocol

* [(Re)staking](switchboard-protocol/re-staking/README.md)
  * [What is (re)staking?](switchboard-protocol/re-staking/what-is-re-staking.md)
  * [What are Node Consensus Networks (NCNs)?](switchboard-protocol/re-staking/what-are-node-consensus-networks-ncns.md)
  * [What are Vault Receipt Tokens (VRTs)?](switchboard-protocol/re-staking/what-are-vault-receipt-tokens-vrts.md)
  * [The Node Partner Program](switchboard-protocol/re-staking/the-node-partner-program.md)
  * [The Switchboard NCN](switchboard-protocol/re-staking/the-switchboard-ncn.md)
* [Running a Switchboard Oracle](switchboard-protocol/running-a-switchboard-oracle/README.md)
  * [Prerequisites](switchboard-protocol/running-a-switchboard-oracle/prerequisites/README.md)
    * [Knowledge about Linux, containers and Self-Hosting](switchboard-protocol/running-a-switchboard-oracle/prerequisites/knowledge-about-linux-containers-and-self-hosting.md)
    * [Hardware Requirements and AMD SEV SNP](switchboard-protocol/running-a-switchboard-oracle/prerequisites/hardware-requirements-and-amd-sev-snp.md)
    * [Software Requirements](switchboard-protocol/running-a-switchboard-oracle/prerequisites/software-requirements.md)
    * [Network Requirements](switchboard-protocol/running-a-switchboard-oracle/prerequisites/network-requirements.md)
  * [Hardware: tested providers and setup](switchboard-protocol/running-a-switchboard-oracle/hardware-tested-providers-and-setup/README.md)
    * [OVH](switchboard-protocol/running-a-switchboard-oracle/hardware-tested-providers-and-setup/ovh.md)
  * [Platform: Kubernetes + AMD SEV SNP](switchboard-protocol/running-a-switchboard-oracle/platform-kubernetes-+-amd-sev-snp/README.md)
    * [Bare Metal with Kubernetes (K3s)](switchboard-protocol/running-a-switchboard-oracle/platform-kubernetes-+-amd-sev-snp/bare-metal-with-kubernetes-k3s.md)
  * [The Git Repo: Clone Our Code](switchboard-protocol/running-a-switchboard-oracle/the-git-repo-clone-our-code/README.md)
    * [Repo Structure](switchboard-protocol/running-a-switchboard-oracle/the-git-repo-clone-our-code/repo-structure.md)
  * [Configuration: Tweaking Configurations](switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/README.md)
    * [cfg/00-common-vars.cfg](switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/cfg-00-common-vars.cfg.md)
    * [cfg/00-devnet-vars.cfg and cfg/00-mainnet-vars.cfg](switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/cfg-00-devnet-vars.cfg-and-cfg-00-mainnet-vars.cfg.md)
  * [Installation: Setup Via Scripts](switchboard-protocol/running-a-switchboard-oracle/installation-setup-via-scripts/README.md)
    * [Bare Metal with Kubernetes (K3s) + AMD SEV SNP](switchboard-protocol/running-a-switchboard-oracle/installation-setup-via-scripts/bare-metal-with-kubernetes-k3s-+-amd-sev-snp.md)
* [Enable Staking to your Oracle](switchboard-protocol/enable-staking-to-your-oracle.md)
* [Providing stake to Switchboard](switchboard-protocol/providing-stake-to-switchboard.md)

## Governance & Tokenomics

* [SWTCH Token Overview](switchboard-protocol/swtch-token-overview.md)
* [Governance & Tokenomics](switchboard-protocol/governance-and-tokenomics.md)

## Copy of Frequently Asked Questions and Glossary

* [FAQ](copy-of-frequently-asked-questions-and-glossary/faq.md)
* [Glossary](copy-of-frequently-asked-questions-and-glossary/glossary.md)
