# Switchboard's Approach to Verifiable Randomness

So, how does Switchboard bring truly random and secure numbers to your app? The challenge is stopping anyone from cheating – whether that’s a validator, an oracle operator, or even a bad actor with inside knowledge.

Switchboard tackles this with a clever combination of technologies:

* **Trusted Execution Environments (TEEs):** Think of these as super-secure black boxes where code can run without anyone peeking inside or tampering with it.
* **On-Demand Oracles:** Switchboard uses its network of oracles to fetch and process information, but the key thing is they do it _inside_ those secure TEE black boxes.

### **Here’s the process:**

1. **Locking in the Slot Hash:** First, the system takes a “snapshot” of a recent block on the Solana blockchain. This snapshot is called the “slot hash”. It's essential to lock in this value because that makes one single moment in time where the slot hash can't be tampered with.
2. **Requesting Randomness:** Once that snapshot is locked, a user can say “Hey, Switchboard, I want a random number based on this slot hash snapshot!”
3. **TEE Magic:** The Switchboard oracle receives the request, but it does all the work _inside_ the secure TEE environment. This means no one outside of the TEE can see what's going on or mess with the result.
4. **Randomness Delivered:** The TEE generates a truly random number based on that securely locked snapshot and delivers it back to the user.

### **Why this is secure:**

* **Validators Can't Cheat:** Because we are “snapshotting” a short window of time when the slot hash is finalised, it's tough for a malicious validator to manipulate randomness, since the finality of the chain is constantly being checked, providing true random numbers. A single validator would require an enormous amount of control to the chain's consensus to change that number. We have a higher certainty about our randomness.
* **Oracle Operators Can't Cheat:** The TEE makes sure that even the Switchboard oracle operator can't see the random number being generated until it's already locked in.
* **No One Can Peak:** The oracle will never reveal randomness seeded with the latest slot hash to prevent adversaries from “peaking.”

**Important Points:**

* **Timing Matters:** There are time limits involved. You need to be timely about it, or we might not be able to generate that randomness from the slot hash.
* **Oracle Key Rotation:** Like any security measure, our system does periodic rotations of the TEE code to maintain the system's security. Because of this, we restrict request generation in the hour before rotation.

**In short, Switchboard handles the difficult work involved with providing verifiable randomness for you. Our system is secured, and we offer this on Solana Devnet today. Please contact the Switchboard team for additional information.**
