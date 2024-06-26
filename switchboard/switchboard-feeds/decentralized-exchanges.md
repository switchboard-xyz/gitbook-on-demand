---
description: Some common tasks relating to Decentralized Exchanges and DeFi.
---

# Decentralized Exchanges

## **Jupiter Exchange Aggregator**

Users can fetch data from the [Jupiter Exchange Aggregator](https://jup.ag/). This can be an effective tool for quoting assets traded on Solana. &#x20;

```
// KMNO/USD with 2% slippage
{
    jupiterSwapTask: {
        inTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        outTokenAddress: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS", // KMNO
        slippage: 2.0
    }
}
```

## **Raydium**&#x20;

[Raydium](https://raydium.io/) is an active hub for DeFi activity on Solana, and Switchboard allows you to quote assets from its Concentrated and Standard pools. All you need is a pool address.&#x20;

The following is an example using Raydium to quote [SLERF/SOL](https://dexscreener.com/solana/agfnrluscrd2e4nwqxw73hdbsn7ekeub2jhx7tx9ytyc), and converting to its USD value using a Pyth task with SOL/USD.&#x20;

```typescript
// SLERF/USD using Raydium and Pyth
{
  lpExchangeRateTask: {
    raydiumPoolAddress: "AgFnRLUScRD2E4nWQxW73hdbSN7eKEUb2jHX7tx9YTYc", // SLERF/SOL Pool
  },
},
{
  multiplyTask: {
    job: {
      tasks: [
        {
          oracleTask: {
            pythAddress: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG", // SOL/USD
            pythAllowedConfidenceInterval: 1.2,
          }
        }
      ]
    }
  }
}
```

## **Orca**

You can pull exchange rates from [Orca](https://www.orca.so/pools) (Solana AMM). Plugging in any of these pools will yield the resulting price.&#x20;

```typescript
// SOL/USDC Orca Pool (Aquafarms & Whirlpools)
{
    lpExchangeRateTask: {
        orcaPoolAddress: "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9",
    }
}
```

## **Meteora**

You can read in prices from [Meteora](https://meteora.ag/) using a `meteoraSwapTask`. You can use it to pull in exchange rates from DLMM pools and standard pools.&#x20;

```
// mSOL/SOL using Meteora
{
  meteoraSwapTask: {
    pool: "HcjZvfeSNJbNkfLD4eEcRBr96AD3w1GpmMppaeRZf7ur",
    type: 1 // 0 for DLMM, 1 for standard
  }
}
```

## Sanctum

The LST protocol on Solana, [Sanctum](https://sanctum.so), is also supported. This task is useful for users who want to bring fair Solana LST prices into their protocols through Switchboard.&#x20;

```
// bonkSOL/USD
{
  sanctumLstPriceTask: {
    lstMint: "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs"
  }
}
```

## **Uniswap**

[Uniswap](https://uniswap.org/) is probably the most recognized AMM that exists. Switchboard enables users to pull prices from the protocol, along with clones on other chains.&#x20;

Using the `uniswapExchangeRateTask`, users can bring in exchange rates from [Uniswap V2](https://blog.uniswap.org/uniswap-v2) and [Uniswap V3](https://blog.uniswap.org/uniswap-v3), along with any Uniswap-ABI-compatible protocols (/Uniswap clones on other chains).&#x20;

Here's an example of a Uniswap Task pulling data from the [glyph.exchange](https://glyph.exchange) protocol, on [Core](https://coredao.org), which is a Uniswap V2 fork.&#x20;

```typescript
// StCore/wCORE on Glyph, a Uniswap V2 Protocol
{
  uniswapExchangeRateTask: {
    provider: "https://rpc.coredao.org",
    inTokenAddress:
      "0xb3A8F0f0da9ffC65318aA39E55079796093029AD",
    outTokenAddress:
      "0x191e94fa59739e188dce837f7f6978d84727ad01",
    inTokenAmount: 1.0,
    slippage: 0.5,
    version: 0,
    routerAddress: "0xbfa47708e79d446f0ecc9a9b07a87d5aa788f9df",
    factoryAddress:
      "0x3e723c7b6188e8ef638db9685af45c7cb66f77b9",
  },
},
```

In the same task for Uniswap V3, a Quoter address should also be passed. Here's an example from [corex.network](https://corex.network), a Uniswap V3 clone also on Core.&#x20;

```typescript
// StCore/wCORE on Corex, a Uniswap V3 Protocol
{
  uniswapExchangeRateTask: {
    provider: "https://rpc.coredao.org",
    inTokenAddress:
      "0xb3A8F0f0da9ffC65318aA39E55079796093029AD",
    outTokenAddress:
      "0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f",
    inTokenAmount: 1.0,
    slippage: 0.5,
    version: 1,
    factoryAddress:
      "0x526190295AFB6b8736B14E4b42744FBd95203A3a",
    routerAddress: "0xcc85A7870902f5e3dCef57E4d44F42b613c87a2E",
    quoterAddress: "0xaec2F2306EBEA7f1251ccAB8A409A48a8d8aAa61",
  },
},
```

## OpenBook&#x20;

The [OpenBook](https://openbookdex.com/) codebase was the first major CLOB on Solana, and we support it through the `serumSwapTask` . The following is an example of pulling a SOL/USDC price:

```json
// Openbook SOL/USDC
{
  "serumSwapTask": {
    "serumPoolAddress": "8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6"
  }
}
```

