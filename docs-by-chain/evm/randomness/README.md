# Switchboard Verifiable Randomness (Overview)

Switchboard aims to deliver **fast**, **permissionless**, **customizable** randomness that can be used for on-chain games, NFT mints, lotteries, and other applications that need fair random outcomes.

---

## Why randomness is hard on blockchains

### We want random events on-chain
On-chain apps often need randomness for things like:

- **Gaming:** loot drops, crit chances, shuffling
- **NFT mints:** randomized traits / blind reveals
- **Lotteries:** fair winner selection

### …but blockchains are deterministic
A blockchain is a computer replicated across many nodes worldwide. For the network to stay in consensus:

- Every node must produce the **exact same output**
- Given the **exact same inputs**

If nodes disagree, the chain can’t agree on the next state.

### A simple “Lottery()” problem
If a smart contract tries to do something like “pick a random winner” *inside* the chain’s execution, different nodes could produce different “random” results:

- Node A runs `Lottery()` → Alice wins
- Node B runs `Lottery()` → Bob wins  
➡️ **State mismatch** → consensus breaks

That’s why “true randomness” can’t just be conjured inside deterministic on-chain execution.

---

## The typical workaround: oracles

### Oracles “bring off-chain data on-chain”
A common pattern is:

1. Generate randomness **off-chain**
2. Publish it **on-chain**
3. Every node reads the same posted value

This is exactly the sort of thing oracles are used for: **bringing external data on-chain**.

### Oracle risk (trust problem)
If you trust a single oracle (or an oracle operator) to generate a random value:

- They could **bias** the random outcome
- They could **withhold** a result that’s unfavorable to them
- They could experience **downtime** at critical moments

So “oracle-provided randomness” solves determinism, but introduces a new question:
**Who watches the oracle?**

---

## Switchboard’s approach

### The core idea
Switchboard’s randomness system is designed so that:

- The oracle can generate randomness **off-chain**
- The chain can **verify** that the randomness is legitimate
- The oracle operator **can’t tamper with** the process to bias outcomes

A key building block is **Trusted Execution Environments (TEEs)**.

---

## What are Trusted Execution Environments (TEEs)?

A **TEE** is a secure area inside a CPU that protects code and data running within it.

From the deck:

- The code/data inside the TEE **can’t be altered**
- The code/data inside the TEE **can’t be inspected**
- Only **inputs and outputs** are visible from the outside

### Trust model (as presented)
Switchboard’s trust model relies on:

- **No one (including the oracle operator)** can alter the code running in the TEE  
- **No one (including the oracle operator)** can see what’s happening inside the chip (only inputs/outputs)
- Oracles that misbehave (downtime / withholding) can be **slashed** by the Switchboard network

---

## System components

Switchboard randomness is shown as a flow across four components:

- **App** (your game / mint / lottery frontend or backend)
- **Switchboard Contract** (on-chain contract interface)
- **Crossbar** (service that helps fetch the randomness reveal payload)
- **Oracle** (the entity generating the randomness, running with TEE protections)

---

## End-to-end flow: “How to Use Switchboard Randomness”

Below is the same flow depicted across the step-by-step slides, in documentation form.

### 1) The app requests randomness
Your app decides “I want something random to happen” and initiates a request via the **Switchboard contract**.

**Result:** a **Randomness Request** is created and a **RandomnessID** is produced.

### 2) An oracle is assigned
Switchboard assigns an **oracle** to handle the request.

The RandomnessID (plus associated metadata) ties together:
- the original request
- the assigned oracle
- the eventual reveal payload

### 3) The app fetches the reveal payload from Crossbar
Your app then asks Crossbar (off-chain):

> “Get the randomness for me”

It sends:
- **RandomnessID + other data**

Crossbar returns:
- **encodedRandomness** (the payload your app will submit on-chain)

### 4) The app settles the randomness on-chain
Your app calls the Switchboard contract with:

- `settleRandomness(encodedRandomness)` *(name shown in the deck)*

### 5) The contract verifies it
The on-chain contract verifies the randomness payload.

Once verification succeeds:

- ✅ **Randomness verified**
- Your application can now safely use the resulting random value for game logic, mint traits, lottery winners, etc.

---

## Sequence diagram (conceptual)

```mermaid
sequenceDiagram
  participant App
  participant SB as Switchboard Contract
  participant X as Crossbar
  participant O as Oracle (TEE)

  App->>SB: "I want something random to happen"
  SB-->>App: RandomnessID (request created)
  SB->>O: Oracle assignment (network assigns)
  App->>X: "Get the randomness for me"<br/>RandomnessID + metadata
  X->>O: Fetch / coordinate reveal
  O-->>X: encodedRandomness
  X-->>App: encodedRandomness
  App->>SB: settleRandomness(encodedRandomness)
  SB-->>App: Randomness verified (usable on-chain)
