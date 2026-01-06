# Table of contents

* [Introduction](README.md)
* [Quick Start](quick-start.md)

## Docs by Chain

* [Solana / SVM](docs-by-chain/solana-svm/README.md)
  * [Price Feeds](docs-by-chain/solana-svm/price-feeds/README.md)
    * [Basic Price Feed Tutorial](docs-by-chain/solana-svm/price-feeds/basic-price-feed.md)
    * [Advanced Price Feed Tutorial](docs-by-chain/solana-svm/price-feeds/advanced-price-feed.md)
  * [Surge Price Feeds](docs-by-chain/solana-svm/surge/README.md)
    * [Surge Tutorial](docs-by-chain/solana-svm/surge/surge.md)
  * [Prediction Market](docs-by-chain/solana-svm/prediction-market/README.md)
    * [Prediction Market Tutorial](docs-by-chain/solana-svm/prediction-market/prediction-market-tutorial.md)
  * [Randomness](docs-by-chain/solana-svm/randomness/README.md)
    * [Randomness Tutorial](docs-by-chain/solana-svm/randomness/randomness-tutorial.md)
* [EVM](docs-by-chain/evm/README.md)
  * [Price Feeds](docs-by-chain/evm/price-feeds/README.md)
    * [Price Feeds Tutorial](docs-by-chain/evm/price-feeds/price-feeds-tutorial.md)
  * [Surge Price Feeds](docs-by-chain/evm/surge/README.md)
    * [Surge Tutorial](docs-by-chain/evm/surge/surge-tutorial.md)
  * [Randomness](docs-by-chain/evm/randomness/README.md)
    * [Randomness Tutorial](docs-by-chain/evm/randomness/randomness-tutorial.md)
  * [Monad](docs-by-chain/evm/monad.md)
  * [Hyperliquid](docs-by-chain/evm/hyperliquid.md)
* [Sui](docs-by-chain/sui/README.md)
  * [Price Feeds](docs-by-chain/sui/price-feeds/README.md)
    * [Price Feeds Tutorial](docs-by-chain/sui/price-feeds/price-feeds-tutorial.md)
  * [Surge Price Feeds](docs-by-chain/sui/surge/README.md)
    * [Surge Tutorial](docs-by-chain/sui/surge/surge-tutorial.md)
* [Aptos](docs-by-chain/aptos/data-feeds.md)
* [Iota](docs-by-chain/iota/data-feeds.md)
* [Movement](docs-by-chain/movement/data-feeds.md)
* [SAIL](docs-by-chain/sail.md)

## Custom Feeds

* [Feed Builder UI](custom-feeds/feed-builder-ui.md)
* [Building Feeds with TypeScript](custom-feeds/custom-feeds-typescript.md)
* [Deploying Custom Feeds](custom-feeds/deploying-custom-feeds.md)
* [Advanced Feed Configuration](custom-feeds/advanced-feed-configuration/README.md)
  * [Data Feed Variable Overrides](custom-feeds/advanced-feed-configuration/data-feed-variable-overrides.md)
  * [Variables with CacheTask](custom-feeds/advanced-feed-configuration/variables-with-cachetask.md)
  * [REST APIs with HttpTask](custom-feeds/advanced-feed-configuration/rest-apis-with-httptask.md)
  * [How Feeds are Resolved](custom-feeds/advanced-feed-configuration/how-feeds-are-resolved.md)
  * [Bounding Results](custom-feeds/advanced-feed-configuration/bounding-results.md)
  * [Decentralized Exchanges](custom-feeds/advanced-feed-configuration/decentralized-exchanges.md)
  * [Oracle Aggregator](custom-feeds/advanced-feed-configuration/oracle-aggregator.md)
  * [FAQ](custom-feeds/advanced-feed-configuration/faq.md)

## How it Works

* [Switchboard Protocol](how-it-works/switchboard-protocol/README.md)
  * [(Re)staking](how-it-works/switchboard-protocol/re-staking/README.md)
    * [What is (re)staking?](how-it-works/switchboard-protocol/re-staking/what-is-re-staking.md)
    * [What are Node Consensus Networks (NCNs)?](how-it-works/switchboard-protocol/re-staking/what-are-node-consensus-networks-ncns.md)
    * [What are Vault Receipt Tokens (VRTs)?](how-it-works/switchboard-protocol/re-staking/what-are-vault-receipt-tokens-vrts.md)
    * [The Node Partner Program](how-it-works/switchboard-protocol/re-staking/the-node-partner-program.md)
    * [The Switchboard NCN](how-it-works/switchboard-protocol/re-staking/the-switchboard-ncn.md)
  * [Running a Switchboard Oracle](how-it-works/switchboard-protocol/running-a-switchboard-oracle/README.md)
    * [Prerequisites](how-it-works/switchboard-protocol/running-a-switchboard-oracle/prerequisites/README.md)
      * [Knowledge about Linux, containers and Self-Hosting](how-it-works/switchboard-protocol/running-a-switchboard-oracle/prerequisites/knowledge-about-linux-containers-and-self-hosting.md)
      * [Hardware Requirements and AMD SEV SNP](how-it-works/switchboard-protocol/running-a-switchboard-oracle/prerequisites/hardware-requirements-and-amd-sev-snp.md)
      * [Software Requirements](how-it-works/switchboard-protocol/running-a-switchboard-oracle/prerequisites/software-requirements.md)
      * [Network Requirements](how-it-works/switchboard-protocol/running-a-switchboard-oracle/prerequisites/network-requirements.md)
    * [Hardware: tested providers and setup](how-it-works/switchboard-protocol/running-a-switchboard-oracle/hardware-tested-providers-and-setup/README.md)
      * [OVH](how-it-works/switchboard-protocol/running-a-switchboard-oracle/hardware-tested-providers-and-setup/ovh.md)
    * [Platform: Kubernetes + AMD SEV SNP](how-it-works/switchboard-protocol/running-a-switchboard-oracle/platform-kubernetes-+-amd-sev-snp/README.md)
      * [Bare Metal with Kubernetes (K3s)](how-it-works/switchboard-protocol/running-a-switchboard-oracle/platform-kubernetes-+-amd-sev-snp/bare-metal-with-kubernetes-k3s.md)
    * [The Git Repo: Clone Our Code](how-it-works/switchboard-protocol/running-a-switchboard-oracle/the-git-repo-clone-our-code/README.md)
      * [Repo Structure](how-it-works/switchboard-protocol/running-a-switchboard-oracle/the-git-repo-clone-our-code/repo-structure.md)
    * [Configuration: Tweaking Configurations](how-it-works/switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/README.md)
      * [cfg/00-common-vars.cfg](how-it-works/switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/cfg-00-common-vars.cfg.md)
      * [cfg/00-devnet-vars.cfg and cfg/00-mainnet-vars.cfg](how-it-works/switchboard-protocol/running-a-switchboard-oracle/configuration-tweaking-configurations/cfg-00-devnet-vars.cfg-and-cfg-00-mainnet-vars.cfg.md)
    * [Installation: Setup Via Scripts](how-it-works/switchboard-protocol/running-a-switchboard-oracle/installation-setup-via-scripts/README.md)
      * [Bare Metal with Kubernetes (K3s) + AMD SEV SNP](how-it-works/switchboard-protocol/running-a-switchboard-oracle/installation-setup-via-scripts/bare-metal-with-kubernetes-k3s-+-amd-sev-snp.md)
  * [Enable Staking to your Oracle](how-it-works/switchboard-protocol/enable-staking-to-your-oracle.md)
  * [Providing stake to Switchboard](how-it-works/switchboard-protocol/providing-stake-to-switchboard.md)
* [Technical Architecture](how-it-works/technical-architecture/README.md)
  * [Trusted Execution Environments (TEEs)](how-it-works/technical-architecture/trusted-execution-environments-tees.md)
  * [Oracle Queues](how-it-works/technical-architecture/oracle-queues.md)
  * [Node Architecture](how-it-works/technical-architecture/node-architecture.md)

## Tooling

* [Crossbar](tooling/crossbar/README.md)
  * [Run Crossbar with Docker Compose](tooling/crossbar/run-crossbar-with-docker-compose.md)
* [CLI (Command Line Interface)](tooling/switchboard-command-line-interface.md)
* [SDKs (Software Developer Kits)](tooling/technical-resources-and-documentation/sdks-and-documentation.md)

## Governance & Tokenomics

* [SWTCH Token Overview](how-it-works/switchboard-protocol/swtch-token-overview.md)
* [Governance & Tokenomics](how-it-works/switchboard-protocol/governance-and-tokenomics.md)

## Miscellaneous

* [FAQ](faq.md)
* [Glossary](glossary.md)
