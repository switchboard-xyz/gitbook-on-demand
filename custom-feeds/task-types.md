# Task Types

> This documentation is automatically generated from the [job_schemas.proto](https://github.com/switchboard-xyz/sbv3/blob/main/protos/job_schemas.proto) source file.

An **OracleJob** is a collection of tasks that are chained together to arrive at a single numerical value. Tasks execute sequentially, with each task's output feeding into the next.

Some tasks do not consume the running input (such as HttpTask and WebsocketTask), effectively resetting the running result. Others transform the current value through mathematical operations or parsing.

## Data Fetching

### AnchorFetchTask

*Documentation pending.*

---

### HttpTask

The adapter will report the text body of a successful HTTP request to the
specified url, or return an error if the response status code is greater
than or equal to 400.

_**Input**_: None

_**Returns**_: String representation of the http response.

_**Example**_: Basic HttpTask

```json
{"httpTask": {"url": "https://mywebsite.org/path"} }
```

_**Example**_: HttpTask example with headers

```json
{ "httpTask": { "url": "https://mywebsite.org/path", "method": "METHOD_POST", "headers": [ { "key": "MY_HEADER_KEY", "value": "MY_HEADER_VALUE" } ], "body": "{\"MY_BODY_KEY\":\"MY_BODY_VALUE\"}" } }
```

---

### SolanaAccountDataFetchTask

*Documentation pending.*

---

### SolanaToken2022ExtensionTask

Apply Solana Token 2022 extension modifiers to a feed.
_**Input**_: Token address and extension type.
_**Returns**_: The value associated with the token2022 extension.

---

### SplTokenParseTask

*Documentation pending.*

---

### WebsocketTask

Opens and maintains a websocket for light speed data retrieval.

_**Input**_: None

_**Returns**_: String representation of the websocket subscription message.

_**Example**_: Opens a coinbase websocket

```json
{ "websocketTask": { "url": "wss://ws-feed.pro.coinbase.com", "subscription": "{\"type\":\"subscribe\",\"product_ids\":[\"BTC-USD\"],\"channels\":[\"ticker\",{\"name\":\"ticker\",\"product_ids\":[\"BTC-USD\"]}]}", "maxDataAgeSeconds": 15, "filter": "$[?(@.type == 'ticker' && @.product_id == 'BTC-USD')]" } }
```

---

## Parsing

### BufferLayoutParseTask

*Documentation pending.*

---

### CronParseTask

Return a timestamp from a crontab instruction.

_**Input**_: None

_**Returns**_: A timestamp

_**Example**_: Return the unix timestamp for the on-chain SYSCLOCK

```json
{"cronParseTask":{"cronPattern":"* * * * * *","clockOffset":0,"clock":"SYSCLOCK"}}
```

_**Example**_: Return the unix timestamp for next friday at 5pm UTC

```json
{"cronParseTask":{"cronPattern":"0 17 * * 5","clockOffset":0,"clock":0}}
```

---

### JsonParseTask

The adapter walks the path specified and returns the value found at that result. If returning
JSON data from the HttpGet or HttpPost adapters, you must use this adapter to parse the response.

_**Input**_: String representation of a JSON object.

_**Returns**_: A numerical result.

_**Example**_: Parses the price field from a JSON object

```json
{"jsonParse": {"path": "$.price"} }
```

---

### RegexExtractTask

Find and extract text using regular expressions from the previous task's output.

_**Input**_: String output from previous task

_**Returns**_: The matched string based on the regex pattern and group number

_**Example**_: Extract the first number from a string

```json
{
  "regexExtractTask": {
    "pattern": "\\d+",
    "groupNumber": 0
  }
}
```

_**Example**_: Extract text between quotes

```json
{
  "regexExtractTask": {
    "pattern": "\"([^\"]+)\"",
    "groupNumber": 1
  }
}
```

_**Example**_: Extract the first JSON object from a stream

```json
{
  "regexExtractTask": {
    "pattern": "\\{[^}]+\\}"
  }
}
```

---

### StringMapTask

Map a string input to a predefined output value using exact string matching.

_**Input**_: String from previous task output or specified value

_**Returns**_: The mapped value as a string if a match is found, or the default value if no match is found.

_**Example**_: Map "yes" to "1", "no" to "2", "maybe" to "3" (case-insensitive)

```json
{
  "stringMapTask": {
    "mappings": [
      {"key": "yes", "value": "1"},
      {"key": "no", "value": "2"},
      {"key": "maybe", "value": "3"}
    ],
    "defaultValue": "0",
    "caseSensitive": false
  }
}
```

_**Example**_: Map HTTP response status with case-sensitive matching

```json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://api.example.com/status"
      }
    },
    {
      "regexExtractTask": {
        "pattern": "status\":\\s*\"([^\"]+)\""
      }
    },
    {
      "stringMapTask": {
        "mappings": [
          {"key": "active", "value": "100"},
          {"key": "inactive", "value": "0"},
          {"key": "pending", "value": "50"}
        ],
        "defaultValue": "-1",
        "caseSensitive": true
      }
    }
  ]
}
```

---

## Mathematical Operations

### AddTask

This task will add a numerical input by a scalar value from a job of subtasks, an aggregator, or a big.

_**Input**_: The current running numerical result output from a scalar value, an aggregator, a job of subtasks or a big.

_**Returns**_: A numerical result.

_**Example**_: Returns the numerical result by adding by a job of subtasks.

```json
{"tasks":[{"valueTask":{"value":100}},{"addTask":{"job":{"tasks":[{"valueTask":{"value":10}}]}}}]}
```

_**Example**_: Returns the numerical result by multiplying by an aggregator.

```json
{"tasks":[{"valueTask":{"value":100}},{"addTask":{"aggregatorPubkey":"GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"}}]}
```

_**Example**_: Returns the numerical result by multiplying by a big.

```json
{"tasks":[{"cacheTask":{"cacheItems":[{"variableName":"TEN","job":{"tasks":[{"valueTask":{"value":10}}]}}]}},{"valueTask":{"value":100}},{"addTask":{"big":"${TEN}"}}]}
```

---

### BoundTask

Bound the running result to an upper/lower bound. This is typically the last task in an OracleJob.

_**Input**_: The current running numerical result.

_**Returns**_: The running result bounded to an upper or lower bound if it exceeds a given threshold.

_**Example**_: Bound the running result to a value between 0.90 and 1.10

```json
{ "boundTask": { "lowerBoundValue": "0.90","onExceedsLowerBoundValue": "0.90","upperBoundValue": "1.10","onExceedsUpperBoundValue": "1.10" } }
```

---

### DivideTask

This task will divide a numerical input by a scalar value from a job of subtasks, an aggregator, or a big.

_**Input**_: The current running numerical result output from a scalar value, an aggregator, a job of subtasks or a big.

_**Returns**_: A numerical result.

_**Example**_: Returns the numerical result by dividing by a job of subtasks.

```json
{"tasks":[{"valueTask":{"value":100}},{"divideTask":{"job":{"tasks":[{"valueTask":{"value":10}}]}}}]}
```

_**Example**_: Returns the numerical result by dividing by an aggregator.

```json
{"tasks":[{"valueTask":{"value":100}},{"divideTask":{"aggregatorPubkey":"GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"}}]}
```

_**Example**_: Returns the numerical result by dividing by a big.

```json
{"tasks":[{"cacheTask":{"cacheItems":[{"variableName":"TEN","job":{"tasks":[{"valueTask":{"value":10}}]}}]}},{"valueTask":{"value":100}},{"divideTask":{"big":"${TEN}"}}]}
```

---

### MaxTask

Returns the maximum value of all the results returned by the provided subtasks and subjobs. Nested tasks or jobs must return a Number.

_**Input**_: None

_**Returns**_: A numerical result.

_**Example**_: Returns the maximum numerical result from 3 tasks.

```json
{"maxTask": {"tasks": [{"valueTask": {"value": 10}},{"valueTask": {"value": 20}},{"valueTask": {"value": 30}}]}}
```

_**Example**_: Returns the maximum numerical result from 3 jobs.

```json
{"maxTask": {"jobs": [{"tasks": [{"httpTask": {"url": "https://www.binance.com/api/v3/ticker/price?symbol=SOLUSDT"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://www.binance.us/api/v3/ticker/price?symbol=SOLUSD"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://api-pub.bitfinex.com/v2/tickers?symbols=tSOLUSD"}},{"jsonParseTask": {"path": "$[0][7]"}}]}]}}
```

---

### MeanTask

Returns the mean (average) of all the results returned by the provided subtasks and subjobs. Nested tasks or jobs must return a Number.

_**Input**_: None

_**Returns**_: A numerical result.

_**Example**_: Returns the mean numerical result of 3 tasks.

```json
{"meanTask": {"tasks": [{"valueTask": {"value": 10}},{"valueTask": {"value": 20}},{"valueTask": {"value": 30}}]}}
```

_**Example**_: Returns the mean numerical result of 3 jobs.

```json
{"meanTask": {"jobs": [{"tasks": [{"httpTask": {"url": "https://www.binance.com/api/v3/ticker/price?symbol=SOLUSDT"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://www.binance.us/api/v3/ticker/price?symbol=SOLUSD"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://api-pub.bitfinex.com/v2/tickers?symbols=tSOLUSD"}},{"jsonParseTask": {"path": "$[0][7]"}}]}]}}
```

---

### MedianTask

Returns the median (middle) of all the results returned by the provided subtasks and subjobs. Nested tasks must return a Number.

_**Input**_: None

_**Returns**_: A numerical result.

_**Example**_: Returns the median numerical result of 3 tasks.

```json
{"medianTask": {"tasks": [{"valueTask": {"value": 10}},{"valueTask": {"value": 20}},{"valueTask": {"value": 30}}]}}
```

_**Example**_: Returns the median numerical result of 3 jobs.

```json
{"medianTask": {"jobs": [{"tasks": [{"httpTask": {"url": "https://www.binance.com/api/v3/ticker/price?symbol=SOLUSDT"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://www.binance.us/api/v3/ticker/price?symbol=SOLUSD"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://api-pub.bitfinex.com/v2/tickers?symbols=tSOLUSD"}},{"jsonParseTask": {"path": "$[0][7]"}}]}]}}
```

---

### MinTask

Returns the minimum value of all the results returned by the provided subtasks and subjobs. Nested tasks or jobs must return a Number.

_**Input**_: None

_**Returns**_: A numerical result.

_**Example**_: Returns the minimum numerical result from 3 tasks.

```json
{"minTask": {"tasks": [{"valueTask": {"value": 10}},{"valueTask": {"value": 20}},{"valueTask": {"value": 30}}]}}
```

_**Example**_: Returns the minimum numerical result from 3 jobs.

```json
{"minTask": {"jobs": [{"tasks": [{"httpTask": {"url": "https://www.binance.com/api/v3/ticker/price?symbol=SOLUSDT"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://www.binance.us/api/v3/ticker/price?symbol=SOLUSD"}},{"jsonParseTask": {"path": "$.price"}}]},{"tasks": [{"httpTask": {"url": "https://api-pub.bitfinex.com/v2/tickers?symbols=tSOLUSD"}},{"jsonParseTask": {"path": "$[0][7]"}}]}]}}
```

---

### MultiplyTask

This task will multiply a numerical input by a scalar value from a job of subtasks, an aggregator, or a big.

_**Input**_: The current running numerical result output from a scalar value, an aggregator, a job of subtasks or a big.

_**Returns**_: A numerical result.

_**Example**_: Returns the numerical result by multiplying by a job of subtasks.

```json
{"tasks":[{"valueTask":{"value":100}},{"multiplyTask":{"job":{"tasks":[{"valueTask":{"value":10}}]}}}]}
```

_**Example**_: Returns the numerical result by multiplying by an aggregator.

```json
{"tasks":[{"valueTask":{"value":100}},{"multiplyTask":{"aggregatorPubkey":"GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"}}]}
```

_**Example**_: Returns the numerical result by multiplying by a big.

```json
{"tasks":[{"cacheTask":{"cacheItems":[{"variableName":"TEN","job":{"tasks":[{"valueTask":{"value":10}}]}}]}},{"valueTask":{"value":100}},{"multiplyTask":{"big":"${TEN}"}}]}
```

---

### PowTask

Round the current running result to an exponential power.

_**Input**_: The current running numerical result.

_**Returns**_: The input raised to an exponential power.

_**Example**_: Raise 2 to the power of 3, 2^3

```json
{"tasks":[{"valueTask":{"value":2}},{"powTask":{"scalar":3}}]}
```

---

### RoundTask

Round the current running result to a set number of decimal places.

_**Input**_: The current running numerical result.

_**Returns**_: The running result rounded to a set number of decimal places.

_**Example**_: Round down the running resul to 8 decimal places

```json
{ "roundTask": { "method": "METHOD_ROUND_DOWN", "decimals": 8 } }
```

---

### SubtractTask

This task will subtract a numerical input by a scalar value from a job of subtasks, an aggregator, or a big.

_**Input**_: The current running numerical result output from a scalar value, an aggregator, a job of subtasks or a big.

_**Returns**_: A numerical result.

_**Example**_: Returns the numerical result by subtracting by a job of subtasks.

```json
{"tasks":[{"valueTask":{"value":100}},{"subtractTask":{"job":{"tasks":[{"valueTask":{"value":10}}]}}}]}
```

_**Example**_: Returns the numerical result by multiplying by an aggregator.

```json
{"tasks":[{"valueTask":{"value":100}},{"subtractTask":{"aggregatorPubkey":"GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"}}]}
```

_**Example**_: Returns the numerical result by multiplying by a big.

```json
{"tasks":[{"cacheTask":{"cacheItems":[{"variableName":"TEN","job":{"tasks":[{"valueTask":{"value":10}}]}}]}},{"valueTask":{"value":100}},{"subtractTask":{"big":"${TEN}"}}]}
```

---

## DeFi & DEX

### CurveFinanceTask

Fetch pricing information from Curve Finance pools.

_**Input**_: None

_**Returns**_: The current price/exchange rate from the specified Curve pool.

_**Example**_: Fetch the price from a Curve pool on Ethereum

```json
{
  "curveFinanceTask": {
    "chain": "CHAIN_ETHEREUM",
    "poolAddress": "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
    "outDecimals": 18
  }
}
```

_**Example**_: Fetch the price using a custom RPC provider

```json
{
  "curveFinanceTask": {
    "chain": "CHAIN_ETHEREUM",
    "provider": "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
    "poolAddress": "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
    "outDecimals": 18
  }
}
```

---

### HyloTask

*Documentation pending.*

---

### JupiterSwapTask

Fetch the simulated price for a swap on JupiterSwap.

_**Input**_: None

_**Returns**_: The swap price on Jupiter for a given input and output token mint address.

_**Example**_: Fetch the JupiterSwap price for exchanging 1 SOL into USDC.

```json
{ "jupiterSwapTask": { "inTokenAddress": "So11111111111111111111111111111111111111112", "outTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" } }
```

_**Example**_: Fetch the JupiterSwap price for exchanging 1000 SOL into USDC.

```json
{ "jupiterSwapTask": { "inTokenAddress": "So11111111111111111111111111111111111111112", "outTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "baseAmount": "1000" } }
```

---

### KuruTask

Fetch a swap quote from Kuru API for best path routing on EVM chains.

_**Input**_: None

_**Returns**_: The expected output amount for swapping tokens via Kuru.

_**Example**_: Fetch a quote for swapping 1 WETH to USDC.

```json
{ "kuruTask": { "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "amount": "1000000000000000000" } }
```

_**Example**_: Fetch a quote with custom slippage tolerance.

```json
{ "kuruTask": { "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "amount": "1000000000000000000", "autoSlippage": false, "slippageTolerance": 100 } }
```

---

### LpExchangeRateTask

Fetch the current swap price for a given liquidity pool

_**Input**_: None

_**Returns**_: The swap price for a given AMM pool.

_**Example**_: Fetch the exchange rate from the Orca SOL/USDC pool

```json
{ "lpExchangeRateTask": { "orcaPoolAddress": "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9" } }
```

_**Example**_: Fetch the exchange rate from the Raydium SOL/USDC pool

```json
{ "lpExchangeRateTask": { "raydiumPoolAddress": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2" } }
```

---

### LpTokenPriceTask

Fetch LP token price info from a number of supported exchanges.

See our blog post on [Fair LP Token Oracles](/blog/2022/01/20/Fair-LP-Token-Oracles)
*NOTE**: This is not the swap price but the price of the underlying LP token.

_**Input**_: None

_**Returns**_: The price of an LP token for a given AMM pool.

_**Example**_: Fetch the Orca LP token price of the SOL/USDC pool

```json
{ "lpTokenPriceTask": { "orcaPoolAddress": "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9" } }
```

_**Example**_: Fetch the fair price Orca LP token price of the SOL/USDC pool

```json
{ "lpTokenPriceTask": { "orcaPoolAddress": "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9", "useFairPrice": true, "priceFeedAddresses": [ "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR", "BjUgj6YCnFBZ49wF54ddBVA9qu8TeqkFtkbqmZcee8uW" ] } }
```

_**Example**_: Fetch the fair price Raydium LP token price of the SOL/USDC pool

```json
{ "lpTokenPriceTask": { "raydiumPoolAddress": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2", "useFairPrice": true,"priceFeedAddresses": ["GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR","BjUgj6YCnFBZ49wF54ddBVA9qu8TeqkFtkbqmZcee8uW" ] } }
```

---

### MaceTask

Fetch a swap quote from MACE (M.A.C.E.) aggregator for best path routing on EVM chains.
MACE is a Multi-DEX EVM trade solver that uses simulated transactions for optimal routing.

_**Input**_: None

_**Returns**_: The expected output amount for swapping tokens via MACE aggregator.

_**Example**_: Fetch a quote for swapping 1 WETH to USDC on Ethereum.

```json
{ "maceTask": { "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "amount": "1000000000000000000" } }
```

_**Example**_: Fetch a quote with custom slippage and gas price.

```json
{ "maceTask": { "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "amount": "1000000000000000000", "slippageToleranceBps": 100, "gasPriceWei": "50000000000" } }
```

---

### MeteoraSwapTask

*Documentation pending.*

---

### PancakeswapExchangeRateTask

*Documentation pending.*

---

### PumpAmmLpTokenPriceTask

Derive the fair LP token price for a given Pump AMM liquidity pool.
_**Input**_: Pool address, X token price job, Y token price job.
_**Returns**_: The fair LP token price for the given Pump AMM liquidity pool.
_**Example**_: Derive the fair LP token price for a given Pump AMM liquidity pool.
```json
   {
     "pumpAmmLpTokenPriceTask": {
       "pool_address": "Gf7sXMoP8iRw4iiXmJ1nq4vxcRycbGXy5RL8a8LnTd3v", // USDC/SOL
       "x_price_job": {
         "oracleTask": {
           "switchboardAddress": "..." // USDC/USD
         }
       },
       "y_price_job": {
         "oracleTask": {
           "switchboardAddress": "..." // SOL/USD
         }
       }
     }
   }

---

### PumpAmmTask

Execute a swap task in the Pump AMM based on the given parameters.

  _**Input**_: Pool address, input token amount, max allowed slippage, and swap direction.

  _**Returns**_: Executes the swap operation in the Pump AMM with the given parameters.

  _**Example**_: Swap 10 tokens from X to Y with a maximum slippage of 0.5%

  ```json
  {
    "pumpAmmTask": {
      "pool_address": "Gf7sXMoP8iRw4iiXmJ1nq4vxcRycbGXy5RL8a8LnTd3v",
      "in_amount": "10",
      "max_slippage": 0.5,
      "is_x_for_y": true
    }
  }

---

### SerumSwapTask

*Documentation pending.*

---

### SushiswapExchangeRateTask

*Documentation pending.*

---

### TitanTask

Fetch the simulated swap price from Titan API.

_**Input**_: None

_**Returns**_: The swap price on Titan for a given input and output token mint address.

_**Example**_: Fetch the Titan price for exchanging 1 SOL into USDC.

```json
{ "titanTask": { "inTokenAddress": "So11111111111111111111111111111111111111112", "outTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" } }
```

_**Example**_: Fetch the Titan price for exchanging 1000 SOL into USDC with slippage.

```json
{ "titanTask": { "inTokenAddress": "So11111111111111111111111111111111111111112", "outTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "amount": "1000", "slippageBps": 50 } }
```

---

### UniswapExchangeRateTask

*Documentation pending.*

---

## LST & Staking

### LstHistoricalYieldTask

Query historical yield data for a given Liquid Staking Token (LST)
and perform a statistical reduction operation over the dataset.

_**Input**_: LST mint address, reduction operation type, and number of epochs to sample.

_**Returns**_: The computed yield value based on the specified operation.

_**Example**_: Compute the median APY for an LST over the last 100 epochs

```json
{
  "lstHistoricalYieldTask": {
    "lstMint": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    "operation": "OPERATION_MEDIAN",
    "epochs": 100
  }
}

---

### MarinadeStateTask

*Documentation pending.*

---

### SanctumLstPriceTask

*Documentation pending.*

---

### SolayerSusdTask

Fetch the current price of Solayer's sUSD stablecoin by reading its interest-bearing mint configuration.

_**Input**_: None

_**Returns**_: The current price of sUSD relative to USD (1.0 = $1.00)

_**Example**_: Fetch the current sUSD price

```json
{ "solayerSusdTask": {} }
```

---

### SplStakePoolTask

*Documentation pending.*

---

### SuiLstPriceTask

Get the exchange rate for Sui Liquid Staking Tokens (LSTs) relative to SUI.

All configuration is passed as parameters, allowing support for any LST without code changes.

_**Input**_: None

_**Returns**_: The exchange rate (e.g., 1.068 means 1 LST = 1.068 SUI)

_**Example**_: haSUI (simple - 1 shared object):

```json
{
  "suiLstPriceTask": {
    "packageId": "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d",
    "module": "staking",
    "function": "get_sui_by_stsui",
    "sharedObjects": ["0x47b224762220393057ebf4f70501b6e657c3e56684737568439a04f80849b2ca"],
    "provideLstAmount": true
  }
}
```

_**Example**_: vSUI (2 shared objects - StakePool + Metadata):

```json
{
  "suiLstPriceTask": {
    "packageId": "0x68d22cf8bdbcd11ecba1e094922873e4080d4d11133e2443fddda0bfd11dae20",
    "module": "stake_pool",
    "function": "lst_amount_to_sui_amount",
    "sharedObjects": [
      "0x2d914e23d82fedef1b5f56a32d5c64bdcc3087ccfea2b4d6ea51a71f587840e5",
      "0x680cd26af32b2bde8d3361e804c53ec1d1cfe24c7f039eb7f549e8dfde389a60"
    ],
    "provideLstAmount": true
  }
}
```

---

### VsuiPriceTask

*Documentation pending.*

---

## Oracle Integration

### EwmaTask

*Documentation pending.*

---

### OracleTask

Fetch the current price of a Solana oracle protocol.

_**Input**_: None

_**Returns**_: The current price of an on-chain oracle.

_**Example**_: The Switchboard SOL/USD oracle price.

```json
{ "oracleTask": { "switchboardAddress": "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR" } }
```

_**Example**_: The Pyth SOL/USD oracle price.

```json
{ "oracleTask": { "pythAddress": "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG" } }
```

_**Example**_: The Chainlink SOL/USD oracle price.

```json
{ "oracleTask": { "chainlinkAddress": "CcPVS9bqyXbD9cLnTbhhHazLsrua8QMFUHTutPtjyDzq" } }
```

---

### SurgeTwapTask

*Documentation pending.*

---

### SwitchboardSurgeTask

Fetch a *live* spot price straight out of the global **Surge** websocket
cache – the same cache that powers our high-speed on-chain oracles.
_**Input**_
• `symbol` – the trading-pair symbol as it appears on the exchange
• `source` – which exchange's stream to read from
  • `BINANCE`   (weight 3)
  • `BYBIT`     (weight 2)
  • `OKX`       (weight 2)
  • `COINBASE`  (weight 3, disabled)
  • `BITGET`    (weight 2)
  • `PYTH`      (weight 1) – Pyth oracle network
  • `TITAN`     (weight 1) – Titan DEX aggregator on Solana
  • `WEIGHTED`  (default) – use the *weighted median* of all
    fresh quotes with the weights shown above.
  • `AUTO`      – automatically select the best source based on
    volume, spread, and data quality metrics.
_**Returns**_
The most recent price available from the chosen source.
The task fails if the cached tick is older than **5 s**.
_**Example**_: Pull the Binance price for BTC / USDT
```json
{
  "switchboardSurgeTask": {
    "source": "BINANCE",
    "symbol": "BTC/FDUSD"
  }
}
```
_**Example**_: Use the weighted-median oracle for BTC / USDT
```json
{
  "switchboardSurgeTask": {
    "source": "WEIGHTED",   // or omit — WEIGHTED is the default
    "symbol": "BTC/USD"
  }
}
```
_**Example**_: Pull the Pyth oracle price for PYUSD / USD
```json
{
  "switchboardSurgeTask": {
    "source": "PYTH",
    "symbol": "PYUSD/USD"
  }
}
```
_**Example**_: Pull the Titan DEX aggregator price for SOL / USDC
```json
{
  "switchboardSurgeTask": {
    "source": "TITAN",
    "symbol": "SOL/USDC"
  }
}
```
_**Notes**_
• Symbols are auto-normalised (case-insensitive, punctuation removed).
• If a venue’s price is stale (> 5 s) it is ignored in the WEIGHTED
  calculation.  The task errors if **no** fresh price remains.
• The weighted-median algorithm uses cumulative weights based on each
  exchange's data quality and volume. Currently active sources:
  Binance (3), Bybit (2), OKX (2), Bitget (2), Pyth (1), Titan (1).

---

### TwapTask

Takes a twap over a set period for a certain aggregator. Aggregators have an optional history buffer account storing the last N accepted results. The TwapTask will iterate over an aggregators history buffer and calculate the time weighted average of the samples within a given time period.

_**Input**_: None

_**Returns**_: The time weighted average of an aggregator over a given time period.

_**Example**_: The 1hr Twap of the SOL/USD Aggregator, requiring at least 60 samples.

```json
{ "twapTask": { "aggregatorPubkey": "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR", "period": 3600, "minSamples": 60, "weightByPropagationTime": true  } }
```

---

## Specialized Finance

### ExponentPTLinearPricingTask

*Documentation pending.*

---

### ExponentTask

Get the exchange rate between and Exponent vault pricipal token and
underlying token.
_**Input**_: Vault address
_**Returns**_: The exchange rate between the vault principal token and
underlying token.
_**Example**_: Get the exchange rate between the vault principal token and
underlying token.
```json
   {
     "exponentTask": {
       "vault": "9YbaicMsXrtupkpD72pdWBfU6R7EJfSByw75sEpDM1uH"
     }
   }

---

### KalshiApiTask

*Documentation pending.*

---

### LendingRateTask

*Documentation pending.*

---

### MapleFinanceTask

Fetch pricing information for Maple Finance assets.

_**Input**_: None

_**Returns**_: The requested price or value based on the specified method.

_**Example**_: Fetch the syrupUSDC fair price from Maple Finance

```json
{ "mapleFinanceTask": { "method": "METHOD_SYRUP_USDC_FAIR_PRICE" } }
```

---

### OndoUsdyTask

*Documentation pending.*

---

### PerpMarketTask

*Documentation pending.*

---

### TurboEthRedemptionRateTask

Fetches tETH/WETH redemption rate

---

## Utilities

### Blake2b128Task

Compute the BLAKE2b-128 hash of the input data and convert it to a numeric Decimal value.

This task follows **cryptographic standard hash truncation** practices used in:
- **SHA-224**: SHA-256 truncated to leftmost 224 bits
- **BLAKE2s-128**: BLAKE2s-256 truncated to leftmost 128 bits
- **BLAKE2b-256**: BLAKE2b-512 truncated to leftmost 256 bits

_**Input**_: String data to hash (can be from a previous task's output)

_**Returns**_: A positive Decimal number with 18 decimal places (scale 18)
- Range: `0.000000000000000000` to `79228162514264.337593543950335` (2^96 - 1, scaled)
- Example: `17512223723.299011049621773283`

---

## Hash-to-Decimal Conversion Algorithm

### Step-by-Step Process
*1. Compute BLAKE2b-128 hash** (produces 16 bytes / 128 bits)
   ```
   Input:  "Hello, World!"
   Output: 3895c59e4aeb0903396b5be3fbec69fe
   ```
*2. Truncate to 96 bits (12 bytes)** - keep the **most significant** bits
   ```
   KEPT (first 12 bytes):      3895c59e4aeb0903396b5be3
   DISCARDED (last 4 bytes):   fbec69fe
   ```
   This follows cryptographic standards where truncation keeps the leftmost/most significant bits.
*3. Pad to 16 bytes** for u128 representation
   ```
   Add 4 zero bytes at the BEGINNING:

   000000003895c59e4aeb0903396b5be3
   └──┬──┘└──────────┬───────────┘
   padding      first 12 bytes
   (4 bytes)    (most significant)
   ```
*4. Interpret as u128 using big-endian** byte order
   ```
   Hex:     0x000000003895c59e4aeb0903396b5be3
   Decimal: 17512223723299011049621773283
   ```
   Big-endian is the standard for cryptographic hash representations.
*5. Convert to Decimal** with scale 18 (18 decimal places)
   ```
   Value:  17512223723299011049621773283
   Scaled: 17512223723.299011049621773283 (divided by 10^18)
   ```
   Scale 18 prevents precision loss when the protocol rescales values.
   Guaranteed to fit in Decimal's 96-bit mantissa (max: 2^96 - 1).

---

## Reproducibility

To reproduce this conversion in **any programming language**:

### Python Example
```python
import hashlib
from decimal import Decimal

# 1. Compute BLAKE2b-128 hash
data = b"Hello, World!"
hash_bytes = hashlib.blake2b(data, digest_size=16).digest()
# Result: b'\x38\x95\xc5\x9e\x4a\xeb\x09\x03\x39\x6b\x5b\xe3\xfb\xec\x69\xfe'

# 2. Keep first 12 bytes (most significant 96 bits)
truncated = hash_bytes[:12]

# 3. Pad with 4 zero bytes at the beginning
padded = b'\x00\x00\x00\x00' + truncated

# 4. Interpret as u128 big-endian
value = int.from_bytes(padded, byteorder='big')
# Result: 17512223723299011049621773283

# 5. Apply scale 18 (divide by 10^18)
result = Decimal(value) / Decimal(10**18)
# Result: Decimal('17512223723.299011049621773283')
```

### JavaScript Example
```javascript
const crypto = require('crypto');

// 1. Compute BLAKE2b-128 hash
const hash = crypto.createHash('blake2b512')
  .update('Hello, World!')
  .digest()
  .slice(0, 16); // Take first 16 bytes for BLAKE2b-128

// 2. Keep first 12 bytes
const truncated = hash.slice(0, 12);

// 3. Pad with 4 zero bytes at the beginning
const padded = Buffer.concat([Buffer.alloc(4), truncated]);

// 4. Interpret as big-endian u128
let value = 0n;
for (let i = 0; i < 16; i++) {
  value = (value << 8n) | BigInt(padded[i]);
}
// Result: 17512223723299011049621773283n

// 5. Apply scale 18 (divide by 10^18)
const result = Number(value) / 1e18;
// Result: 17512223723.299011 (note: JS loses precision beyond ~15 digits)
```

### Rust Example
```rust
use blake2::{Blake2b, Digest};
use blake2::digest::consts::U16;
use rust_decimal::Decimal;

type Blake2b128 = Blake2b<U16>;

// 1. Compute BLAKE2b-128 hash
let mut hasher = Blake2b128::new();
hasher.update(b"Hello, World!");
let hash = hasher.finalize();

// 2. Keep first 12 bytes and pad at beginning
let mut bytes = [0u8; 16];
bytes[4..16].copy_from_slice(&hash[0..12]);

// 3. Interpret as big-endian u128
let value = u128::from_be_bytes(bytes);
// Result: 17512223723299011049621773283

// 4. Apply scale 18 (convert with 18 decimal places)
let result = Decimal::from_i128_with_scale(value as i128, 18);
// Result: Decimal("17512223723.299011049621773283")
```

---

## Why This Approach?

✅ **Cryptographic Standard**: Follows the same truncation method as SHA-224, BLAKE2s-128, etc.
✅ **Preserves Entropy**: Keeps the most significant/diverse bits of the hash
✅ **Big-Endian**: Standard convention for cryptographic hash representations
✅ **Fits Decimal Range**: 96 bits always fits within Decimal's mantissa (max 2^96-1)
✅ **Scale 18**: Prevents precision loss when protocol rescales values
✅ **Reproducible**: Simple algorithm implementable in any programming language
✅ **Deterministic**: Same input always produces same output

---

_**Example**_: Hash a static string

```json
{
  "blake2b128Task": {
    "value": "Hello, World!"
  }
}
```

_**Example**_: Hash the output from a previous task (e.g., HTTP response)

```json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://example.com/data"
      }
    },
    {
      "blake2b128Task": {}
    }
  ]
}
```

---

### CacheTask

Execute a job and store the result in a variable to reference later.

_**Input**_: None

_**Returns**_: The input

_**Example**_: CacheTask storing ${ONE} = 1

```json
{ "cacheTask": { "cacheItems": [ { "variableName": "ONE", "job": { "tasks": [ { "valueTask": { "value": 1 } } ] } } ] } }
```

---

### ComparisonTask

*Documentation pending.*

---

### ConditionalTask

This task will run the `attempt` on the subtasks in an effort to produce a valid numerical result. If `attempt`. fails to produce an acceptable result, `on_failure` subtasks will be run instead.

_**Input**_: The current running numerical result output from a task.

_**Returns**_: A numerical result, else run `on_failure` subtasks.

_**Example**_: Returns the numerical result from the conditionalTask's subtasks, else `on_failure` returns the numerical result from its subtasks.

```json
{"conditionalTask":{"attempt":[{"tasks":[{"jupiterSwapTask":{"inTokenAddress":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","outTokenAddress":"DUALa4FC2yREwZ59PHeu1un4wis36vHRv5hWVBmzykCJ"}}]}],"onFailure":[{"lpExchangeRateTask":{"orcaPoolAddress":"7yJ4gMRJhEoCR48aPE3EAWRmCoygakik81ZS1sajaTnE"}}]}}
```

---

### SecretsTask

Securely request secrets from a Switchboard SecretsServer that are owned by a specific authority. Any secrets that are returned for the current feed will then be unwrapped into variables to be accessed later.

_**Input**_: None

_**Returns**_: The input

_**Example**_: SecretsTask

```json
{ "secretsTask": { "authority": "Accb21tUCWocJea6Uk3DgrNZawgmKegDVeHw8cGMDPi5" } }
```

---

### SysclockOffsetTask

*Documentation pending.*

---

### UnixTimeTask

*Documentation pending.*

---

### ValueTask

Returns a specified value.

_**Input**_: None

_**Returns**_: A numerical result.

_**Example**_: Returns the value 10

```json
{"valueTask": {"value": 10} }
```

_**Example**_: Returns the currentRound result of an aggregator

```json
{"valueTask": {"aggregatorPubkey": "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"} }
```

_**Example**_: Returns the value stored in a CacheTask variable

```json
{"valueTask": {"big": "${ONE}"} }
```

---

## Protocol-Specific

### AftermathTask

*Documentation pending.*

---

### BitFluxTask

Fetch the current swap price from a BitFlux pool.

_**Input**_: None

_**Returns**_: The swap price between the specified input and output tokens.

_**Example**_: Fetch the swap price using a custom RPC provider

```json
{
  "bitFluxTask": {
    "provider": "https://my-custom-rpc.example.com",
    "poolAddress": "0x0000000000000000000000000000000000000000",
    "inToken": "0x0000000000000000000000000000000000000000",
    "outToken": "0x0000000000000000000000000000000000000000"
  }
}
```

---

### CorexTask

*Documentation pending.*

---

### EtherfuseTask

*Documentation pending.*

---

### FragmetricTask

Fetch the current price for Fragmetric liquid restaking tokens.

_**Input**_: None

_**Returns**_: The current price of the specified Fragmetric token relative to SOL (1.0 = 1 SOL)

_**Example**_: Fetch the fragSOL token price

```json
{ "fragmetricTask": { "token": "TOKEN_FRAG_SOL" } }
```

---

### GlyphTask

*Documentation pending.*

---

### XStepPriceTask

*Documentation pending.*

---

## Other

### HistoryFunctionTask

*Documentation pending.*

---

### LlmTask

Interacts with a Large Language Model (LLM) to generate a text response based on a user-provided prompt.

_**Input**_: None

_**Returns**_: Text generated by the LLM based on the provided prompt and configuration.

_**Example**_: Using OpenAI's GPT-4 model to generate a joke.

```json
{
  "llmTask": {
    "providerConfig": {
      "openai": {
        "model": "gpt-4",
        "userPrompt": "Tell me a joke.",
        "temperature": 0.7,
        "secretNameApiKey": "${OPENAI_API_KEY}"
      }
    }
  }
}

---

### MangoPerpMarketTask

*Documentation pending.*

---

### VwapTask

*Documentation pending.*

---

## Next Steps

- [Build with TypeScript](build-and-deploy-feed/build-with-typescript.md) - Create feeds programmatically
- [Build with UI](build-and-deploy-feed/build-with-ui.md) - Use the visual feed builder
- [Advanced Feed Configuration](advanced-feed-configuration/README.md) - Learn about variable overrides and more
