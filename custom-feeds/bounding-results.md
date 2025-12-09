# Bounding Results

It can be useful to bound feeds by upper and lower values. These can be computed dynamically with the [CacheTask ](variables-with-cachetask.md)and can allow for a simple sanity check / safety check on some feeds.

## Bound Task

You can use static numbers for bounding the result of a feed. Here's an example for USDT/USD from Coinbase. In this instance the protocol wants this feed to not resolve outside of those bounds.

```typescript
{
    httpTask: {
        url: "https://api.coinbase.com/v2/prices/USDT-USD/spot",
    },
},
{
    jsonParseTask: {
        path: "$.data.amount",
    },
},
{
    boundTask: {
        lowerBoundValue: "0.98",
        upperBoundValue: "1.02",
    },
},
```

Sometimes users may want to bound some value dynamically. Combining this with the `FAIR_VALUE` [Example from the previous section](variables-with-cachetask.md#cachetask), we get:

<pre class="language-typescript"><code class="lang-typescript"><strong>// ... CacheTasks defining FAIR_VALUE LOW, FAIR_VALUE_HIGH... 
</strong><strong>{
</strong>    httpTask: {
        url: "https://api.volatile-source.com/",
    },
},
{
    jsonParseTask: {
        path: "$.price",
    },
},
{
    boundTask: {
        lowerBoundValue: "${FAIR_VALUE_LOW}",
        upperBoundValue: "${FAIR_VALUE_HIGH}",
    },
},
</code></pre>
