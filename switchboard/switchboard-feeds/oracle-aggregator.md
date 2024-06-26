---
description: Switchboard can fetch data from a number of oracles. Here's how to use them.
---

# Oracle Aggregator

## Pyth

The [Pyth Oracle Network](https://pyth.network/) provides a over [500 data feeds](https://pyth.network/price-feeds) that you can read through the Switchboard Oracle Aggregator task. &#x20;

Here's an example of the Pyth oracle task, being used to pull the price of [SNX/USD](https://pyth.network/price-feeds/crypto-snx-usd):&#x20;

```
// SNX/USD Task with accepted confidence interval of 1.2%
{
    oracleTask: {
        pythAddress: "4tgJv8ekst8Y3T8d3Sc9kiXQ4d9hedzLF8LdwvDQ1rjC",
        pythAllowedConfidenceInterval: 1.2,
    },
}
```

## Switchboard V2

[Switchboard V2 (Solana Push)](../switchboard-v2/) feeds can be referenced within on-demand feeds. It's simple, all you need is an Aggregator public key, which you can find on the [V2 Explorer App](https://app.switchboard.xyz/solana/mainnet). \
\
**Note:** Copying Oracle Jobs from the V2 Aggregator into a V3 feed is a more cost-effective solution than depending on a V2 Aggregator. It can be an effective stopgap for quickly porting an existing feed to V3.

Here's an example of a Switchboard Oracle Task for the price of [BTC/USD](https://app.switchboard.xyz/solana/mainnet/feed/8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee):

```
// BTC/USD Task
{
    oracleTask: {
        switchboardAddress: "8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee",
    }
}
```

