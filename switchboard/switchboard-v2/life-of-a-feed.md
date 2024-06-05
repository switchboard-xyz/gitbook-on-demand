# Life of a Feed

Let's walk through what the feed update lifecycle looks like.

#### Update Request[​](http://localhost:3000/feeds/about#update-request) <a href="#update-request" id="update-request"></a>

* Any user calls _**aggregatorOpenRound**_, either manually or via a crank turn
* sbv2 program checks if `aggregator.minUpdateDelaySeconds` have passed since the last openRound call
* sbv2 program checks if a LeaseContract has enough funds to reward the oracles for the next round
* sbv2 program assigns the next `aggregator.oracleRequestBatchSize` oracles to the update request and emits an _**AggregatorOpenRoundEvent**_

#### Oracle Execution[​](http://localhost:3000/feeds/about#oracle-execution) <a href="#oracle-execution" id="oracle-execution"></a>

* Oracle watches the chain for an _**AggregatorOpenRoundEvent**_ with the oracle's public key assigned to the update
* Oracle fetches the feed and job account definitions from its RPC Provider
* Oracle verifies the job account definitions match the feeds `aggregator.jobHashes`
* Oracle executes the job definitions in parallel
* When an oracle receives `aggregator.minJobResults`, it calculates the weighted median based on the feeds `aggregator.jobWeights`. Note, this is not enforced on-chain and is purely up to the oracle to respect
* If a feed has configured a `aggregator.varianceThreshold` and `aggregator.forceReportPeriod` has not elapsed, the oracle calculates the percentage change between its calculated result and the previous confirmed round. If it does not exceed the feeds `aggregator.varianceThreshold`, the oracle drops the update request and waits for new update request
* If a feeds configuration dictate a new on-chain result, the oracle submits an _**aggregatorSaveResult**_ transaction

#### Oracle Consensus[​](http://localhost:3000/feeds/about#oracle-consensus) <a href="#oracle-consensus" id="oracle-consensus"></a>

* sbv2 program waits for `aggregator.minOracleResults` to be submitted by the assigned oracles
* When sufficient oracle responses, the sbv2 program computes the accepted value from the median of the oracle responses
* If a feed has a history buffer account, the accepted result is pushed onto the buffer
* Oracles that responded within `queue.varianceToleranceMultiplier` are rewarded `queue.reward` from the feed's LeaseContract
* If `queue.slashingEnabled`, oracles that responded outside the `queue.varianceToleranceMultiplier` are slashed `queue.reward` tokens from it's `oracle.tokenAccount` and transferred to the feed's `lease.escrow`
* If additional oracle responses are submitted after a value has been accepted, the median is recalculated based on the new response set, oracle rewards are redistributed, and the history buffer value is updated

### Data Feed Composability[​](http://localhost:3000/feeds/about#data-feed-composability) <a href="#data-feed-composability" id="data-feed-composability"></a>

Data feeds may reference other data feeds and build upon each other. It is _**strongly**_ recommended that you own any feed that you reference in case of downstream impacts out of your control. While anyone can extend another feeds lease, a lease owner can always withdraw any lease funds and prevent future updates.

As an example, you could construct the following feed definition:

* Create a Switchboard feed that sources SOL/USD prices from a variety of exchanges, each weighted by their 7d volume, along with a history buffer
* Create a Switchboard feed that uses an OracleTask to fetch the Pyth SOL/USD price every 10 seconds, along with a history buffer
* Create a Switchboard feed that uses an OracleTask to fetch the Chainlink SOL/USD price every 10 seconds, along with a history buffer
* Finally, create a Switchboard feed that calculates the 1min TWAP of each source above and returns the median of the results

This is just a small window into how Switchboard feeds can build on each other and let the downstream consumer configure their feeds to meet their own use cases.
