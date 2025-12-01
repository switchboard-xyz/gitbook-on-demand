# Why Randomness is important?

Verifiable randomness is crucial for building trustless blockchain applications like games, lotteries, and fair selection processes. However, generating truly random and verifiable values on-chain is a complex challenge. While the idea of randomness seems simple, its verifiability can add layers of complexity to the application.

**The Problem:** Many existing solutions for on-chain randomness are vulnerable to manipulation, either by oracles providing the data or by blockchain validators/leaders.

**Why can't I just use `blockhash`?**

Using the latest blockhash as a source of randomness is a common, but flawed, approach. Each Solana leader has the power and opportunity to tamper with the randomness. It is trivial for bad-faith parties to collude, making `blockhashes` inadequate.

**What are other solutions?**

Ultimately, developers need reliable randomness sources with strong guarantees against manipulation. Let's analyse some common approaches:

| Method                                        | Explanation                                                                                                                                                     | Adversary(ies)                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Oracle Provides Random Value**              | The Oracle picks a random value for every block.                                                                                                                | The Oracle. This defeats the purpose of a decentralised system since it provides total control over the randomness.                                                             |
| **Randomness from Elliptic Curve Signatures** | A user requests randomness with a unique seed. The oracle responds with `Sha256(Ed25519Sign(oracleSigner, seed))`.                                              | The Oracle. The `Ed25519Sign`allows a malicious Oracle to produce infinite valid signatures if the user leverages the same nonce, controlling the resulting randomness.         |
| **User Secrets (Commit-Reveal Scheme)**       | User generates a unique `secret_key`. User commits their wager and `Sha256(secret_key)`. User reveals randomness as `Sha256(secret_key + [commit_slot+1].hash)` | The User. The scheme creates opportunities for users to collude with block leaders to manipulate the slot hash, undermining the protocol's integrity by leaking the user's key. |

Trustless applications are complex, and there is no such thing as a free lunch. Various parties on on-chain applications can exhibit different kinds of adversarial behaviour that ultimately influence randomness. By knowing these common schemes, you can better avoid them.
