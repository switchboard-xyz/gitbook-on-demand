---
description: How to use HttpTask and JsonParseTask
---

# REST APIs with HttpTask

## HttpTask + JsonParseTask

Next to Oracle and Decentralized Exchange tasks, the most popular way to fetch data is the HttpTask combined with a JsonParseTask. The `HttpTask` has support for GET and POST methods, along with custom headers and a request body (both optional).

#### Example

```typescript
{
    httpTask: {
        url: "https://www.binance.com/api/v3/ticker/price"
    }
}
```

This [Binance ](https://www.binance.com/en/trade/BTC_USDT)api call will result in a json response of the following structurefor all tokens:

```typescript
{"symbol":"BTCUSDT","price":"64628.31000000"} ...
```

In order to pull out the `price` field from the response, we must follow the HttpTask along with a `JsonParseTask`. These tasks utilize [JsonPaths](https://goessner.net/articles/JsonPath/) in order to specify which data to put into the current context. In this case, since we just ran an HttpTask and received this JSON, we have that JSON set as the current\_value.

Now, the user can use a JsonParseTask to specify the path of the decimal they want to extract, in this case the field `BTC-USDT price`.

```typescript
{
    jsonParseTask: {
        path: "$[?(@.symbol == 'BTCUSDT')].price"
    }
}
```

### Binance BTC/USDT

```typescript
{
    httpTask: {
        url: "https://www.binance.com/api/v3/ticker/price"
    }
},
{
    jsonParseTask: {
        path: "$[?(@.symbol == 'BTCUSDT')].price"
    }
}
```

This is the assembled tasks to form a Binance BTC/USDT task.

### OKX BTC/USDT

<pre class="language-typescript"><code class="lang-typescript">{
<strong>    httpTask: {
</strong>        url: "https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USD",
<strong>    },
</strong>},
{
    jsonParseTask: {
        path: '$.data[?(@.instId == "BTC-USDT")].idxPx',
    },
},
</code></pre>

Pulling the latest price of BTC in USDT terms from OKX. Just another common HttpTask example, this time getting a value from an array. The return type for the OKX value in this example is:

```typescript
// okx.com endpoint price return
{
  "code": "0",
  "msg": "",
  "data": [
    {
      "instId": "BTC-USDT",
      "idxPx": "64628",
      "high24h": "66484.2",
      "sodUtc0": "64877.1",
      "open24h": "65308.9",
      "low24h": "64319.8",
      "sodUtc8": "64827.5",
      "ts": "1718946430031"
    }
  ]
}
```

### Kraken Example

```typescript
// Also BTC/USD, but from Kraken
{
  httpTask: {
    url: "https://api.kraken.com/0/public/Ticker",
  },
},
{
  medianTask: {
    tasks: [
      {
        jsonParseTask: {
          path: "$.result.XXBTZUSD.a[0]",
        },
      },
      {
        jsonParseTask: {
          path: "$.result.XXBTZUSD.b[0]",
        },
      },
      {
        jsonParseTask: {
          path: "$.result.XXBTZUSD.c[0]",
        },
      },
    ],
  },
}
```

Here you can see that the user who made this job is using a `MedianTask` . This allows users to run multiple jobs in parallel and get the median result. Users can also specify a `maxRangePercent` in the median task in order to fail the request if that value is exceeded.

For example:

```typescript
medianTask: {
    maxRangePercent: "1.5", // if job results differ by 1.5%, the job run will fail
    tasks: [
        {
            jsonParseTask: {
                path: "$.result.XXBTZUSD.a[0]",
            },
        },
        {
            jsonParseTask: {
               path: "$.result.XXBTZUSD.b[0]",
            },
        },
        {
            jsonParseTask: {
                path: "$.result.XXBTZUSD.c[0]",
            }
        },
    ],
},
```

### Huobi Example

```typescript
// Huobi BTC/USDT
{
  httpTask: {
    url: "https://api.huobi.pro/market/tickers",
  },
},
{
  medianTask: {
    tasks: [
      {
        jsonParseTask: {
          path: "$[?(@.symbol == 'btcusdt')].bid",
        },
      },
      {
        jsonParseTask: {
          path: "$[?(@.symbol == 'btcusdt')].ask",
        },
      },
    ],
  },
},
```

## POST data with HttpTask

The following is an example with a POST request including headers and a body in an HttpTask:

```typescript
{
  httpTask: {
    url: "https://example.com",
    method: 2, // POST
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
      {
        key: "Accept-Language",
        value: "en-US,en;q=0.9",
      },
      {
        key: "Accept",
        value: "*/*",
      },
    ],
    body: '{"data":["chorizo","fried"],"cluster":"taco-loco"}',
  },
},
```

This is a POST request to example.com. Note that body has to be an encoded JSON string if it is set at all.
