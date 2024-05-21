# Switchboard   Randomness

Welcome to the Switchboard randomness documentation!

Switchboard Randomness advances the foundational principles of Switchboard-On-Demand by offering unparalleled speed and safety in randomness for blockchain applications. It aims to counteract a broad spectrum of potential threats, ensuring robust support not only for basic applications but also for infrastructure worth billions of dollars.

### Building Trust By Being Trustless

It's crucial to exercise caution when dealing with oracles or services that claim to provide randomness. While randomness itself is a simple concept, ensuring its verifiability can be highly complex.

Let us take a simple scenario:

```
1. Alice decides to participate in a blockchain-based coin flip game, wagering her lunch money.
2. Alice initiates a "flip" transaction. Upon confirmation, the outcome is determined by taking the modulo 2 of the blockhash.
```

From Alice's perspective, this solution appears satisfactory.

> _"I mean, it's always random looking bytes, they don't seem dangerous,"_ she might reassure herself.

However, this line of thinking fails to adopt the critical lens of the [Adversarial Mindset](https://papers.ssrn.com/sol3/papers.cfm?abstract\_id=3573099), which is essential in assessing the security and reliability of cryptographic systems.

Now lets reimagine the scenario:

What if Alice's wager wasn't just her lunch money, but her life's savings? In such a high-stakes scenario, Alice would undoubtedly probe deeper into the randomness mechanism.

Would Alice be content with merely the appearance of randomness, or would she demand robust assurances of its reliability and verifiability?

### Different Entropy Sources and Knowing Your Adversary

#### Dangers of using Latest Blockhash as Randomness

Utilizing the latest blockhash as randomness does impose limitations on who can influence its value at a specific time. However in the context of Solana, each [Solana Leader](https://docs.solanalabs.com/consensus/leader-rotation) has the power and opportunity to determine slot ordering. Thus, at any given moment, the current slot leader becomes your adversary. Over time, your adversary encompasses every Solana slot leader in history.

#### Elliptic Curve Signatures As Entropy

Now that we've covered a randomness situation with no upper bound on adversaries, let's look at improvements. The next course of action then becomes:

_If randomness cannot be sourced on chain, then let's grab some randomness off chain_

You know what's really good at fetching off-chain information for blockchains?

<figure><img src="../.gitbook/assets/spaces_Sgm72uKz5YhjYH7GcbB5_uploads_CAee9wEae0N0GAD5DNCo_giphy-1-1.webp" alt=""><figcaption><p>Yepppp</p></figcaption></figure>

You guessed it: ORACLES

Oracle's are a common component in blockchain applications for not only data propagation, but for entropy.

Great, we've figured it all out right?

<figure><img src="../.gitbook/assets/spaces_Sgm72uKz5YhjYH7GcbB5_uploads_CqSKZ72JHlQyumzv8pWu_giphy-2.webp" alt=""><figcaption><p>Well, not exactly...</p></figcaption></figure>

Oracle's don't always get this right..

Let's break it down how things can and HAVE gone wrong:



***

* _**Method:**_ Oracle **chooses** random value every slot
* **Explanation and Limitations**
  * This is, in some ways, better than using the blockhash since you limit the adversary from ANY leader to just the oracle, but the oracle has **complete** control in this situation. And if you are okay with this, then why build in Web3 to begin with?
* _**Adversaries**_
  * The Oracle has FULL control
