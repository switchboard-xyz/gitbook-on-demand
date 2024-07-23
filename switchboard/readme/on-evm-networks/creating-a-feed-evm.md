---
description: Configuring EVM feeds
---

# Creating a Feed (EVM)

## Feed Configuration

If you're using the builder, you'll be confronted with a few inputs configured to some defaults, and an empty name field.&#x20;

The required fields are:

* **Name**: The identifier for the feed in the Switchboard UI. &#x20;
* **Authority**: The address with authority to modify this feed. Feeds are always initialized with the creator as authority, but they can later be set to something other than the creator. This feature can be useful for DAO controlled feeds.&#x20;
* **Max Variance**: The maximum allowed variance of the job results (as a percentage) for an update to be accepted on-chain.
* **Min Responses**: The minimum number of successful job responses required for an update to be accepted on-chain.
* **Sample Size**: The number of samples that will be considered when reading a feed.&#x20;
* **Max Staleness**: The maximum staleness a sample is allowed when reading a feed on-chain.&#x20;

## Configuring Feeds in the Builder

Setting these configs in the builder is as simple as filling in the inputs and clicking "Create Account" to make the feed:

<figure><img src="../../../.gitbook/assets/image (7).png" alt=""><figcaption><p>Builder Configs</p></figcaption></figure>

### Switchboard Feed Page

Once you create the feed, you'll be taken to a page where you can see the current value for the feed (waiting to be populated on-chain).&#x20;

Since this is an on-demand feed, updates will be read in only when they're needed (alternatively with a pusher service).&#x20;

<figure><img src="../../../.gitbook/assets/image (10).png" alt=""><figcaption></figcaption></figure>

### Getting Aggregator ID&#x20;

Once you've created the feed on-chain, you can save the value from the **Address** field under **FEED DATA**. The address is equivalent to your **Aggregator ID** (aggregatorId). This is used to identify feeds on-chain.&#x20;

Feeds are internal structs in Switchboard, not their own contracts with addresses.  `aggregatorId`'s are used to identify them.&#x20;





