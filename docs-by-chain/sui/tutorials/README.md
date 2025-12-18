# Sui Tutorials

Step-by-step guides for integrating Switchboard oracles into your Sui Move contracts.

## Available Tutorials

### [Price Feeds](price-feeds.md)

Learn how to integrate Switchboard oracle price feeds into your Sui Move contracts using the Quote Verifier pattern. This tutorial covers:

- Building a QuoteConsumer Move contract with built-in security
- Fetching and verifying oracle signatures
- Implementing freshness and deviation checks
- TypeScript client integration

**Best for:** DeFi protocols, lending platforms, DEXs, and any application needing verified price data.

### [Surge Price Stream](surge-price-stream.md)

Learn how to stream real-time price data via WebSocket and submit updates to the Sui blockchain. This tutorial covers:

- Setting up Switchboard Surge for real-time streaming
- Processing signed price updates
- Transaction queue management for Sui
- Mainnet and testnet configurations

**Best for:** High-frequency trading, real-time dashboards, and applications requiring sub-second price updates.

## Prerequisites

All tutorials assume you have:

- Sui CLI installed ([Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install))
- Node.js 18+ and npm/pnpm
- A Sui keypair with SUI tokens (testnet or mainnet)
- Basic understanding of Move and TypeScript

## Quick Links

- [Switchboard Explorer](https://ondemand.switchboard.xyz/) - Find feed IDs
- [Sui SDK NPM Package](https://www.npmjs.com/package/@switchboard-xyz/sui-sdk)
- [Example Repository](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sui)
