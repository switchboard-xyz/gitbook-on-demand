# Architecture Design

Switchboard on-demand is an end-to-end hardware verifiable oracle solution

Beyond the economic guarantees other oracle protocols use to ensure non-malicious behavior, Switchboard takes this validation to a second security level by providing hardware-based SGX attestations for all oracles, verifying that any oracle allowed to be a reporter on switchboard is running no other off chain code than the approved code.

To dive into the Switchboard architecture, let's review all personas in the Switchboard request lifespan:

* Guardian
  * A Switchboard guardian acts as the root interface between the blockchains and SGX
  * These are a set of peer SGX-verified machines that kick off the SGX verification process for the entire ecosystem
  * All guardians on Switchboard go through Queue Authority approval before being allowed into the guardian-set
* Oracle Queue
  * "Queues" acts as a means to separate Switchboard into separate networks.
  * All data feeds may be assigned to a queue and, in most cases, this will be automatically linked to the default queues that Switchboard supports
  * Protocols MAY choose to use their own set of oracles or management of their own queue, which in some cases may be beneficial to reduce latency by having a dedicated worker-set
* **On-Demand** Oracle
  * The Switchboard on-demand oracle acts as it's own web service where they host a REST API to fetch and sign data. This data can then be brought back on-chain by users for a small fee and usage of this data. **On-Demand** oracles have a much wider surface then push oracles, and, as such, have been broken down into 3 components
    * Oracle Router frontend
      * Since **on-demand** oracles now host a public web service, care must be taken to mitigate DOS risks.
      * As such, a dedicated frontend is allocated with the primary goal of traffic control to ensure the price processing infrastructure has strong segmentation from unfiltered public access
    * Oracle Router (Gateway)
      * Since we must ensure that all oracles are assigned work in the most performance-efficient manner, oracles also contain routing code to decide how pull requests get distributed between the queue.
      * Factors that play into assignment are:
        * current oracle stake
        * current oracle performance
        * oracle self-advertised capacity (oracles are slashed if they over-advertise)
        * oracle successful liveness checks
    * Oracle Worker
      * This is the ultimate destination of a user request where the data is fetched , processed, and signed

Now that the concepts are in place, lets flick the on switch for Switchboard:

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-25 at 1.33.26 PM.png" alt=""><figcaption><p>Step 1: Guardians are onboarded to the network as the root of SGX attestations</p></figcaption></figure>

The first step onboards guardians to the protocol.  Remember, the guardians are the bridge between TEE attestation and the blockchain.  Once the guardians are verified, 1/3 of all guardians must attest to SGX quotes of any oracle

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-15 at 4.37.05 PM.png" alt=""><figcaption><p>Step 2: Guardians attest oracle SGX quote and add it to the oracle queue</p></figcaption></figure>

Important note: Guardians, just like oracles go through this keypair verification process.  All secp256k1 keypairs are considered valid for 7 days before requiring re-verification.

After guardians and oracles and guardians have completed onboarding we can then start letting users request price signatures to use on-chain.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-16 at 7.48.38 AM.png" alt=""><figcaption><p>Step 3: User requests feed from gateway and receives a signature-set in response. User posts these on chain</p></figcaption></figure>

