---
description: Switchboard can fetch data from a number of oracles. Here's how to use them.
---

# Oracle Aggregator

## Pyth

The [Pyth Oracle Network](https://pyth.network/) provides a over [500 data feeds](https://pyth.network/developers/price-feed-ids) that you can read through the Switchboard Oracle Aggregator task. &#x20;

Here's an example of the Pyth oracle task, being used to pull the price of [SNX/USD](https://pyth.network/price-feeds/crypto-snx-usd):&#x20;

```
// SNX/USD Task with accepted confidence interval of 1.2%
{
    oracleTask: {
        pythAddress: "0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3",
        pythAllowedConfidenceInterval: 1.2,
    },
}
```

## Chainlink

The Chainlink Oracle Network provides [145](https://docs.chain.link/data-feeds/price-feeds/addresses?network=arbitrum\&page=1)  data feeds at the time of writing on the [Arbitrum L2](https://arbitrum.io/) Mainnet. Check out the available feed addresses [here](https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum\&page=1).

```
// AAVE/USD Task with accepted confidence interval of 1.2%
{
    oracleTask: {
        chainlinkAddress: "0x3c6AbdA21358c15601A3175D8dd66D0c572cc904"
    },
}
```

## Switchboard V2

[Switchboard V2 (Solana Push)](../../switchboard-v2/) feeds can be referenced within on-demand feeds. It's simple, all you need is an Aggregator public key, which you can find on the [V2 Explorer App](https://app.switchboard.xyz/solana/mainnet).&#x20;

Here's an example of a Switchboard Oracle Task for the price of [BTC/USD](https://app.switchboard.xyz/solana/mainnet/feed/8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee):

```
// BTC/USD Task
{
    oracleTask: {
        switchboardAddress: "8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee",
    }
}
```

