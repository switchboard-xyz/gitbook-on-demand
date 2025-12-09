# What are Vault Receipt Tokens (VRTs)?

Vault Receipt Tokens (VRTs) are synthetic tokens representing your staked assets in a network. They are akin to receipts you get when you stake your cryptocurrency that you can use elsewhere on-chain. Instead of just locking up your tokens, VRTs give you more flexibility. They allow the network to manage risks better, and some systems even let you stake different types of tokens, giving you more choices. Switchboard uses VRTs within its restaking system, which is modelled after the Jito Node Consensus Network (NCN). To better understand it, let's clarify their role in how Switchboard is set up.

#### Switchboard and VRTs:

To maximise the security of the Switchboard protocol, its staking mechanisms are built on the Jito NCN restaking system. This means Switchboard operates its own NCN to secure key actions performed by oracles within the protocol:

* **Oracle Queues:** In Switchboard, each oracle queue (a group of oracles) is linked to its own Jito NCN.
* **Oracles as Nodes:** Individual oracles within the queue act as nodes (operators) in the NCN.

To ensure these oracle actions are secure the Switchboard’s NCN has associated token vaults. These token vaults are where stakers stake their tokens, for example, SWTCH. When you stake, you receive a Vault Receipt Token (VRT) representing your staked tokens in Switchboard, such as svSWTCH.

### The Role of svSWTCH:

The svSWTCH token has two main roles within Switchboard:

* **Governance:** It's the governance token, allowing stakers to participate in decisions about the network.
* **Economic Incentive:** It ensures oracles operate reliably. Oracle operators need to have a minimum amount of svSWTCH delegated in their operating wallet to participate in the network. The prioritisation and workload distribution among oracles within the network will be determined by a combination of their performance metrics and total stake.
