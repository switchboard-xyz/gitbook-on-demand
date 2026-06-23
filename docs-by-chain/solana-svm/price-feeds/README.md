# Price Feeds

Access to reliable, real-world data is essential for decentralised applications (dApps), particularly in Decentralised Finance (DeFi). Real-time asset prices, forming the backbone of any DeFi protocol, are among the most critical data points.

This is where Data Feeds come in. Think of them as secure bridges connecting the off-chain world of financial markets to your on-chain smart contracts. They provide a continuous stream of verified, aggregated price data for a wide range of assets, enabling your dApp to react to market fluctuations and operate correctly.

## In This Section

- [Basic Price Feed Tutorial](basic-price-feed.md): Integrate managed, oracle-verified price feeds into a Solana program.
- [Advanced Price Feed Tutorial](advanced-price-feed.md): Reduce compute costs with an authorized cranker pattern for oracle-backed quotes.
- [Quote Program Accounts](quote-program-accounts.md): Derive and read canonical quote-program accounts without relying on fixed offsets.
- [Authority-Updated Feeds](authority-updated-feeds.md): Publish quote accounts directly from a trusted wallet or PDA when your application is the source of truth.

For new Solana/SVM feed-hash integrations, use the quote program:
`queue.fetchManagedUpdateIxs(...)` writes canonical `OracleQuote` accounts
derived from the queue and feed ID. The classic `PullFeed.fetchUpdateIx(...)`
path is legacy compatibility only and requires queue/gateway support for classic
PullFeed accounts.
