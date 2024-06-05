# V2 Data Feeds

An aggregator (or data feed) is what on-chain developers use when building smart contracts. A data feed is a collection of jobs that get aggregated to produce a single, deterministic result. Typically the first task in a job will fetch external data with subsequent tasks responsible for parsing the response and transforming the value into a single data type, like an integer or decimal.

When an oracle is assigned to process a data feed update, the oracle executes the defined jobs, computes the weighted median of the job responses, and publishes the result on-chain. If sufficient oracles respond, the on-chain program computes the final result as the median of the assigned oracle responses.

### Job Definitions[​](http://localhost:3000/feeds/about#job-definitions) <a href="#job-definitions" id="job-definitions"></a>

An Aggregator Account stores a collection of Job Account public keys along with the hashes of the job definitions. This is to prevent malicious RPC nodes from providing incorrect task definitions to oracles before fulfillment.

A Job Account is a collection of [Switchboard Tasks](https://protos.docs.switchboard.xyz/protos/Task) that get executed by an oracle sequentially. Each Job Account typically corresponds to a single data source. A data feed requires at least one job account and at most 16 job accounts. Switchboard Job Accounts can be used to source data from:

* HTTP endpoints, public or private
* Websockets
* On-Chain data from Solana, Ethereum, etc
  * Anchor programs
  * JupiterSwap
  * Uniswap
  * SushiSwap
  * Saber
  * ... and more

#### Job Weights[​](http://localhost:3000/feeds/about#job-weights) <a href="#job-weights" id="job-weights"></a>

A data feed can assign job weights to a job account which will be used when the oracle calculates the median across the job responses. This is useful to weight data sources by some metric such as liquidity or a reliability score.

It is **strongly** recommended to utilize job weights as _not all data sources are created equally_.

#### Lease Contract[​](http://localhost:3000/feeds/about#lease-contract) <a href="#lease-contract" id="lease-contract"></a>

The LeaseContract is a pre-funded escrow account to reward oracles for fulfilling update request. The LeaseContract has a pre-specified `lease.withdrawAuthority` which is the only wallet allowed to withdraw funds from the lease escrow. Any user is able to contribute to a LeaseContract and keep the feed updating.

When a new openRound is successfully requested for a data feed, the user who requested it is transferred `queue.reward` tokens from the feeds LeaseContract. This is to incentivize users and crank turners to keep feeds updating based on a feeds config.

When a data feed result is accepted on-chain by a batch of oracles, the oracle rewards, as specified by `queue.reward`, are automatically deducted from the `lease.escrow` and transferred to an `oracle.tokenAccount`.

### Requesting Updates[​](http://localhost:3000/feeds/about#requesting-updates) <a href="#requesting-updates" id="requesting-updates"></a>

A feed is updated when someone calls `aggregatorOpenRound` on-chain. If openRound is called before `aggregator.minUpdateDelaySeconds` have elapsed, the openRound call will fail and the user will forfeit their transaction fees. If successful, the user is rewarded for keeping the feed updating.

#### Periodic Updates[​](http://localhost:3000/feeds/about#periodic-updates) <a href="#periodic-updates" id="periodic-updates"></a>

Any data feed permitted to request updates on a queue is also permitted to join a queue's existing Crank, `aggregator.crankPubkey`. A Crank is the scheduling mechanism behind feeds that allow them to be periodically updated. The Crank is a buffer account that stores a collection of aggregator public keys, ordered by their next available update, with some level of jitter added to prevent a predictable oracle allocation cycle

When a feeds Lease Contract is low on funds, it is automatically removed from the crank and must be manually re-pushed upon refunding the LeaseContract.

A feed can set `aggregator.disableCrank` to prevent being pushed onto a Crank and draining it's lease.

#### Variance Threshold[​](http://localhost:3000/feeds/about#variance-threshold) <a href="#variance-threshold" id="variance-threshold"></a>

A feed can set an `aggregator.varianceThreshold` to instruct an oracle to skip reporting a value on-chain if the percentage change between the current result and the `aggregator.previousConfirmedRoundResult` is not exceeded. This is a cost saving tool to conserve lease cost during low volatility.

A feeds `aggregator.forceReportPeriod` is the compliment and instructs an oracle to always report a result if `aggregator.forceReportPeriod` seconds have elapsed since the last successful confirmed round. This can be thought of as the maximum allowable staleness for a feed.

The two settings above can greatly increase the lifespan of a feed's lease but also makes it difficult to estimate the remaining time on a lease.

Check out [@switchboard-xyz/lease-observer](https://github.com/switchboard-xyz/switchboard-v2/tree/main/packages/lease-observer) to get PagerDuty alerts when a lease crosses a low balance threshold.

### History Buffer[​](http://localhost:3000/feeds/about#history-buffer) <a href="#history-buffer" id="history-buffer"></a>

A history buffer account stores a set number of accepted results for an aggregator, and given Solana’s maximum account size of 10MB, the maximum number of samples a single history buffer can support is \~350,000 samples. An aggregator can only have a single history buffer associated with it.

A history buffer has a static account size when it is initialized, equal to: `12 Bytes + (28 Bytes × Num Samples)`. Each time an aggregator value is updated on-chain, the associated history buffer is shifted to the right, and the last value is dropped.

This feature allows Switchboard tasks to parse a history buffer and perform a set of calculations, such as the TwapTask. This allows feeds to reference other feeds and perform complex calculations based on historical samples.

\
