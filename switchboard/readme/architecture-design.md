# Architecture Design

**Switchboard On-Demand** is an end-to-end hardware verifiable oracle solution.

## Trusted Execution Environments for Layered Security

Switchboard takes advantage of **trusted execution environments** (TEE's) for an added layer of security on top of standard honest-majority assumptions. The TEE that Switchboard has started out using for On-Demand are **Intel® Software Guard Extensions** (Intel® SGX, or just SGX).

Switchboard verifies that any oracle node allowed to be a publisher on Switchboard is only running the approved code.

## Oracle Queues

You'll see the term "**Oracle Queue**", or just "**Queue**",  used throughout the documentation. Queues are like networks in Switchboard. Some more info about queues:

* An Oracle Queue is a Switchboard subnetwork
* Oracle Queues maintain a list of Oracles, on-chain Oracle accounts which correspond to machines resolving jobs and publishing data
* Queues are defined on Solana and synchronized with other chains
* All Data Feeds must be assigned to a queue
* Default queues ([mainnet-beta](https://solana.fm/address/A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w), [devnet](https://solana.fm/address/FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di)) are maintained and synchronized across all Switchboard deployments
* Every Oracle on the Queue must only be running an approved image

You can think of Queues like buckets of Oracles that data feeds are assigned to.&#x20;

## Types of Nodes and their roles

Before diving into the Switchboard architecture, let's review all personas in the Switchboard request lifespan:

* **Guardian**
  * **Guardians** act like bouncers for queues. If an oracle isn't running an approved image, it won't be allowed on the queue
  * A Switchboard guardian acts as the root interface between the blockchains and SGX
  * These are a set of peer-verified machines that kick off the SGX verification process for the entire ecosystem
  * All guardians on Switchboard go through an approval process approval before being allowed into the guardian-set
* **Oracle**
  * The Switchboard on-demand oracle acts as it's own web service where they host a REST API to fetch and sign data. This data can then be brought back on-chain by users for a small fee and usage of this data. **On-Demand** oracles have a much wider surface then push oracles, and, as such, have been broken down into 3 components
    * Oracle Router frontend
      * Since **On-Demand** oracles now host a public web service, care must be taken to mitigate DOS risks
      * As such, a dedicated frontend is allocated with the primary goal of traffic control to ensure the price processing infrastructure has strong segmentation from unfiltered public access
    * Oracle Router (Gateway)
      * Since we must ensure that all oracles are assigned work in the most performance-efficient manner, oracles also contain routing code to decide how pull requests get distributed between the queue.
      * Factors that play into assignment are:
        * current oracle stake
        * current oracle performance
        * oracle self-advertised capacity (oracles are slashed if they over-advertise)
        * oracle successful liveness checks
    * Oracle Worker
      * This is the ultimate destination of a user request where the data is fetched, processed, and signed
      * The Oracle Worker operates a Task Runner to fetch feed results

## Guardian Onboarding

Guardians just check that oracles and other guardians are running the correct images by verifying their TEE attestations. Once guardians have been approved, they can then go through this guardian attestation process and serve as a validator for the Switchboard network.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-25 at 1.33.26 PM.png" alt=""><figcaption><p>Step 1: Guardians are onboarded to the network as the root of SGX attestations</p></figcaption></figure>

The first step onboards guardians to the protocol.  Remember, the guardians are the bridge between TEE attestation and the blockchain.  Once the guardians are verified, 1/3 of all guardians must attest to SGX quotes of any oracle.

## Oracle Onboarding

The oracle nodes must also first go through a pre-approval process in order to make it to the attestation stage. Once it's been approved by necessary authorities, it can request Guardian approval and make it onto the Oracle Queue if it's running the right image.&#x20;

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-15 at 4.37.05 PM.png" alt=""><figcaption><p>Step 2: Guardians attest oracle SGX quote and add it to the oracle queue</p></figcaption></figure>

Important note: Guardians, just like oracles go through this keypair verification process.  All secp256k1 keypairs are considered valid for 7 days before requiring re-verification.

After guardians and oracles and guardians have completed onboarding we can then start letting users request price signatures to use on-chain.

## Lifespan of a Data Feed Request

Users can define their own custom data feeds and request updates for them using oracle nodes. The data returned to the client will include the data feed ouputs and necessary signatures to validate updates on-chain.&#x20;

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-16 at 7.48.38 AM.png" alt=""><figcaption><p>Step 3: User requests feed from gateway and receives a signature-set in response. User posts these on chain</p></figcaption></figure>



