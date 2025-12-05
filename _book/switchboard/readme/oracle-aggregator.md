# Oracle Aggregator

If you're using a first-party data oracle like Pyth, Chainlink, or even Switchboard V2, you can easily create a new feed using On-Demand which aggregates data from even more sources. Once you make the switch, it's easy to collect prices from every first party data provider and settle them to a median output.&#x20;

You just need to build the task-types using our interfaces. Switchboard makes it possible to collect data from many different oracles at the same time and assemble a single result. By default, Switchboard feeds are resolved and a value is assembled by collecting the median of each [Oracle Job](designing-feeds/oracle-aggregator.md) output. &#x20;

You can build a feed using your favorite existing oracle with the [aggregator builder interface](https://beta.ondemand.switchboard.xyz/aggregator).&#x20;

## Building a Feed

### Step 1: Finding the Pair

The first step to using Switchboard is getting the data feed you want to use. In our [aggregator builder interface](https://beta.ondemand.switchboard.xyz/aggregator), you can find all feeds supported on Pyth (Pythnet), Chainlink (Arbitrum), and from big exchanges using Switchboard. &#x20;

When you find a feed you like, click on it.&#x20;

<figure><img src="../../.gitbook/assets/image (19).png" alt=""><figcaption><p>Find a pair using the Oracle Aggregator Interface</p></figcaption></figure>

### Step 2: Inspecting the Feed

Once you pick a pair you want to instantiate on your desired network, you'll encounter the following page:&#x20;

<figure><img src="../../.gitbook/assets/image (20).png" alt=""><figcaption><p>Feed Builder with ARB/USD job definition open</p></figcaption></figure>

On the Switchboard Builder, you can inspect the jobs associated with the feed you picked. You can edit or delete certain jobs if you'd like by using the icons on the right of each. For example, if you don't trust Chainlink Data for some reason, you can simply delete the job.&#x20;

### Step 3: Configuring the Feed

When you're happy with your feed configuration, ensure that you're connected to the correct network (configurable in the menu revealed by clicking the icon in the upper-right corner).

<figure><img src="../../.gitbook/assets/image (22).png" alt=""><figcaption><p>Configuring the Network</p></figcaption></figure>

### Feed Configuration

If you're using the builder, you'll be confronted with a few inputs configured to some defaults, and an empty name field.&#x20;

The required fields are:

* **Name**: The identifier for the feed in the Switchboard UI. &#x20;
* **Authority**: The address with authority to modify this feed. Feeds are always initialized with the creator as authority, but they can later be set to something other than the creator. This feature can be useful for DAO controlled feeds.&#x20;
* **Max Variance**: The maximum allowed variance of the job results (as a percentage) for an update to be accepted on-chain.
* **Min Responses**: The minimum number of successful **Oracle Job responses** required for an update to be accepted on-chain. If only 3 jobs succeed and you require 4, the feed will fail to resolve to a value.&#x20;
* **Sample Size**: The number of samples that will be considered when reading a feed.&#x20;
* **Max Staleness**: The maximum staleness a sample is allowed when reading a feed on-chain.&#x20;

<figure><img src="../../.gitbook/assets/image (21).png" alt=""><figcaption><p>Feed Configuration </p></figcaption></figure>

### Step 4: Creating the Feed

When you're ready to create your feed, hit the connect your wallet button. After connecting with your preferred wallet you'll be taken to your feed's status page. Here you can see the feed definition simulated periodically, and get an idea of what oracle results will look like. \


<figure><img src="../../.gitbook/assets/image (25).png" alt=""><figcaption><p>ARB/USD Feed Status Page with Simulated Prices</p></figcaption></figure>

Make sure you take note of the **Address**, we'll need it to integrate on-chain.&#x20;

\
In the next sections, we'll cover how to migrate with Pyth and Chainlink.&#x20;
