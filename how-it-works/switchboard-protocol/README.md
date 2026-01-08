# Switchboard Protocol

The Switchboard Protocol is a decentralised oracle network that enables blockchain applications to access real-world data securely and reliably. At its core, the protocol coordinates a network of independent oracle operators who fetch, verify, and deliver data on-chain.

## How It Works

1. **Data Requests**: Applications request data through Switchboard's on-chain contracts
2. **Oracle Execution**: Oracle nodes running in Trusted Execution Environments (TEEs) fetch and process the requested data
3. **Verification**: The protocol verifies oracle signatures and ensures data integrity before making it available on-chain
4. **Delivery**: Verified data is delivered to your smart contracts for use

## Key Components

- **Oracle Operators**: Independent node operators who run Switchboard oracles and earn rewards for providing accurate data
- **Staking & Slashing**: Economic security through restaking mechanisms that incentivise honest behaviour and penalise malicious actors
- **TEE Protection**: Hardware-level security ensures oracle code cannot be tampered with or inspected, even by the operators themselves

## Protocol Security

The protocol's security model combines cryptographic verification with economic incentives:

- Oracles must run verified code within TEEs, preventing manipulation
- Operators stake assets that can be slashed for misbehaviour
- Multiple oracles can be required to reach consensus on data values
- On-chain verification ensures only properly signed data is accepted

## Get Involved

- [Run your own oracle](running-a-switchboard-oracle/README.md) and earn rewards
- [Provide stake](providing-stake-to-switchboard.md) to secure the network
- [Learn about restaking](re-staking/README.md) and the Switchboard NCN
