---
description: Switchboard can fetch data from a number of oracles. Here's how to use them.
---

# Oracle Aggregator

## Pyth

The [Pyth Oracle Network](https://pyth.network/) publishes [price feeds](https://pyth.network/developers/price-feed-ids) that the Oracle Aggregator task can read through Hermes or from an on-chain Solana push-feed account. The two paths have different authentication and freshness behavior.

### Hermes-backed feeds with `pythAddress`

Use `pythAddress` for the Hermes-backed path. It accepts existing Pyth Solana price account addresses and Pyth price-feed IDs. For authenticated Hermes access, place an API-key placeholder in `pythConfigs.apiKey`:

```typescript
// SNX/USD with a 1.2% maximum confidence interval
{
  oracleTask: {
    pythAddress: "0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3",
    pythConfigs: {
      apiKey: "${PYTH_API_KEY}",
      pythAllowedConfidenceInterval: 1.2,
      maxStaleSeconds: 15,
    },
  },
}
```

Provide the key on the same execution request:

```typescript
const response = await gateway.fetchSignaturesConsensus({
  // ...feed request fields
  variableOverrides: {
    PYTH_API_KEY: process.env.PYTH_API_KEY!,
  },
});
```

For new feed definitions, prefer an explicit `pythConfigs.apiKey` placeholder. It makes the task's credential dependency visible and allows different Pyth tasks in one request to name different keys. After placeholder expansion, a non-empty task-level `apiKey` takes precedence.

Existing `pythAddress` jobs do not need to be rewritten during the Pyth Core transition. When `pythConfigs.apiKey` is omitted or empty, the task accepts the reserved request override `PYTH_API_KEY` as a compatibility fallback. One fallback value covers every `pythAddress` task in that execution request that does not set its own `apiKey`; it does not apply to other requests or become an oracle-wide key. This preserves existing feed definitions while allowing the customer making the request to pay for its Hermes calls.

The compatibility fallback assumes one execution request belongs to one customer or security domain. Do not combine unrelated customers' jobs and credentials in a single request.

### On-chain push feeds with `pythPushFeedId`

Use `pythPushFeedId` for an upgraded Solana push feed. This path derives and reads the on-chain price account; it does not call Hermes and does not use a Hermes API key.

When authoring, storing, hashing, or updating a feed that uses this task, use
`@switchboard-xyz/common@5.8.5` and
`@switchboard-xyz/on-demand@3.10.6` or newer. The current Common serializer
preserves the Pyth-push fields and explicitly set optional defaults in the
canonical feed identity.

```typescript
{
  oracleTask: {
    pythPushFeedId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    pythConfigs: {
      pushFeedShardId: 0,
      maxStaleSeconds: 75,
    },
  },
}
```

`pushFeedShardId` defaults to `0`. `maxStaleSeconds` defaults to `15` for `pythAddress` and `75` for `pythPushFeedId`. `pythConfigs.hermesUrl` can select a different Hermes endpoint for `pythAddress`. Use the nested `pythConfigs.pythAllowedConfidenceInterval` field for confidence limits; values are percentages, so `10` means 10%. The top-level `pythAllowedConfidenceInterval` field is retained only for compatibility.

See [Data Feed Variable Overrides](data-feed-variable-overrides.md) for the request trust model, [Jupiter API keys](decentralized-exchanges.md#jupiter-exchange-aggregator) for its conventional placeholder behavior, and the [OracleTask reference](../task-types.md#oracletask) for every field.

## Chainlink

The Chainlink Oracle Network provides [145](https://docs.chain.link/data-feeds/price-feeds/addresses?network=arbitrum\&page=1) data feeds at the time of writing on the [Arbitrum L2](https://arbitrum.io/) Mainnet. Check out the available feed addresses [here](https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum\&page=1).

```
// AAVE/USD Task with accepted confidence interval of 1.2%
{
    oracleTask: {
        chainlinkAddress: "0x3c6AbdA21358c15601A3175D8dd66D0c572cc904"
    },
}
```

## Switchboard V2

Switchboard V2 (Solana Push) feeds can be referenced within on-demand feeds. It's simple, all you need is an Aggregator public key, which you can find on the [V2 Explorer App](https://app.switchboard.xyz/solana/mainnet).

Here's an example of a Switchboard Oracle Task for the price of [BTC/USD](https://app.switchboard.xyz/solana/mainnet/feed/8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee):

```
// BTC/USD Task
{
    oracleTask: {
        switchboardAddress: "8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee",
    }
}
```
