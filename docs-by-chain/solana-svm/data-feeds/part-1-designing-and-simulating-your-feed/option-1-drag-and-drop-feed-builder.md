# Option 1: Drag-and-Drop Feed Builder

For new developers with less experience with Javascript, we encourage you to use the Feed builder.

When creating new feeds with the feed builder, you’ll encounter several configuration options. The following are considered **basic configurations**:

* **Name**: The identifier for the feed in the Switchboard UI.
* **Authority**: The address with authority to modify this feed. Feeds are always initialized with the creator as authority, but they can later be set to something other than the creator. This feature can be useful for DAO controlled feeds.

The following parameters represent **advanced configurations**:

* **Max Variance**: The maximum allowed variance of the job results (as a percentage) for an update to be accepted on-chain.
* **Min Responses**: The minimum number of successful job responses required for an update to be accepted on-chain.
* **Sample Size**: The number of samples that will be considered when reading a feed.
* **Max Staleness**: The maximum staleness a sample is allowed when reading a feed on-chain.

Follow along with this tutorial and video that demonstrates how a SOL/USDC price feed is created using popular sources, [Jupiter](https://jup.ag/), [Raydium](https://raydium.io/liquidity-pools/) and [Meteora](https://app.meteora.ag/).\
\\

{% embed url="https://youtu.be/V9WGUSrjDOE" %}
