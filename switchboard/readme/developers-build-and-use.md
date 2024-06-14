# Developers: Quickstart!

Using a Switchboard-On-Demand Feed is design for maximum, speed, secuirty, and simplicity

With our new On-Demand service, we at Switchboard have made it super easy to integrate and run a feed!

First things first!\
Browse our awesome [Explorer ](https://ondemand.switchboard.xyz/)for a feed you like and save the feeds public key!

The, get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

Now using this SDK and the public key of the feed:

1. Initialise the feed account,&#x20;
2. Fetch an update instruction for the latest feed update!
3. Submit it to the chain along with your programs instruction!

<pre class="language-typescript"><code class="lang-typescript">const feed = new PublicKey("HvMrsyD5p1Jg7PTCkLq3bkb5Hs1r3ToYex3ixZ1Mq47A");
const feedAccount = new sb.PullFeed(program, feed);
const demoPath = "target/deploy/sb_on_demand_solana-keypair.json";
const demo = await myAnchorProgram(program.provider, demoPath);
const myIx = await demo.methods.test().accounts({ feed }).instruction();

const conf = { numSignatures: 3 };
const [pullIx, responses, success] = await feedAccount.fetchUpdateIx(conf);

const lutOwners = [...responses.map((x) => x.oracle), feedAccount];
<strong>const tx = await sb.asV0Tx({
</strong>      connection,
      ixs: [pullIx, myIx],
      signers: [keypair],
      computeUnitPrice: 200_000,
      computeUnitLimitMultiple: 1.3,
      lookupTables: await sb.loadLookupTables(lutOwners),
    });

const sim = await connection.simulateTransaction(tx, { "processed" });
const sig = await connection.sendTransaction(tx);
```
</code></pre>

Now how easy is that!



<figure><img src="https://media.giphy.com/media/iJtiI3FeULEcfjgt0T/giphy.gif?cid=790b7611nayj182qdzxutte6wap4h3oio9n8t4ukm607w7nb&#x26;ep=v1_gifs_search&#x26;rid=giphy.gif&#x26;ct=g" alt=""><figcaption><p>oh yeaaaaaah!</p></figcaption></figure>

Check out this repo for a full example!\
[https://github.com/switchboard-xyz/sb-on-demand-examples/blob/main/sb-on-demand-feeds/scripts/runFeed.ts](https://github.com/switchboard-xyz/sb-on-demand-examples/blob/main/sb-on-demand-feeds/scripts/runFeed.ts)\
\
Need more in-depth info? Next Page!

