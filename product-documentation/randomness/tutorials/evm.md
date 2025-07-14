# EVM

## Switchboard Randomness for EVM applications

#### Prerequisites

* Basic understanding of Ethereum and smart contracts.
* Familiarity with common smart contract development tools (e.g., Hardhat, Foundry).
* A development environment set up and ready to go.

#### Installation

1.  **Solidity SDK:**

    ```bash
    npm install @switchboard-xyz/on-demand-solidity

    ```
2.  **TypeScript SDK:** (For off-chain randomness resolution)

    ```bash
    npm install @switchboard-xyz/common

    ```
3.  **Forge (If applicable):** Add the following lines to your `remappings.txt` file:

    ```
    @switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity

    ```

#### Step 1: EVM Contract Setup (Solidity)

1.  **Import Switchboard Interfaces:**

    ```solidity
    import {Structs} from "@switchboard-xyz/on-demand-solidity/structs/Structs.sol";
    import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";

    ```
2.  **Implementation:**

    ```solidity
    // Address of the Switchboard contract
    address private immutable _switchboard;

    // Random Number to receive Switchboard Randomness
    uint256 public randomNumber;

    // Reference to the Switchboard contract
    ISwitchboard switchboard;

    // Queue IDs
    bytes32 constant MAINNET_QUEUE = 0x86807068432f186a147cf0b13a30067d386204ea9d6c8b04743ac2ef010b0752;
    bytes32 constant TESTNET_QUEUE = 0xc9477bfb5ff1012859f336cf98725680e7705ba2abece17188cfb28ca66ca5b0;

    // Choose chain-appropriate queue
    bytes32 public queue;

    constructor(address switchboardAddress, bool isMainnet) {
       _switchboard = switchboardAddress;
       switchboard = ISwitchboard(switchboardAddress);

       // setup the chain selection for mainnet or testnet
       if(isMainnet){
           queue = MAINNET_QUEUE;
       } else {
           queue = TESTNET_QUEUE;
       }
    }

    // Unique identifier for each randomness request
    bytes32 public randomnessId;

    ```

Note that one has to inject the address of the Switchboard contract on deployment and select the appropriate network for the queue. For reference, the latest deployments can be found here. \
[https://docs.switchboard.xyz/product-documentation/data-feeds/evm#deployments](https://docs.switchboard.xyz/product-documentation/data-feeds/evm#deployments)

1. **Request Randomness:** Call the `requestRandomness` function within your smart contract. The randomness is needed.

```solidity
function roll() external {
    ...
    // Make it unique and random
    randomnessId = keccak256(abi.encodePacked(msg.sender, block.timestamp));

    // Invoke the on-demand contract reference
    switchboard.requestRandomness(
         randomnessId,            // randomnessId (bytes32): Unique ID for the request.
         address(this),            // authority (address):  Only this contract should manage randomness. 
         queue,                    // queueId (bytes32 ): Chain selection for requesting randomness.
         1                         // minSettlementDelay (uint16): Minimum seconds to settle the request.
     );
 }

```

`randomnessId` has to be unique for tracking your request. Then inject it into your chain-appropriate `queue` using the deployed Switchboard's `address` and `requestRandomness` function.

**IMPORTANT: ensure sufficient delay time for randomness to be resolved by oracles! The minimum settlement delay must pass and the request data must propagate on-chain.**&#x20;

1.  Setup update feed handler

    ```solidity
    // Function for resolving randomness within the same contract.
    function resolve(bytes[] calldata switchboardUpdateFeeds) external {
           // invoke
           switchboard.updateFeeds(switchboardUpdateFeeds);

           // store value for later use
           Structs.RandomnessResult memory randomness = switchboard.getRandomness(randomnessId).result;
           require(randomness.settledAt != 0, "Randomness failed to Settle");

           // update the number for state changes
           randomNumber = randomness.value;
     }

    ```

    Given all the correct parameters, you are now able to call into the Switchboard oracle to resolve your randomness.

#### Step 2: Resolve Randomness Off-Chain (TypeScript)

1.  **Fetch Randomness:**

    ```tsx
    import { CrossbarClient } from "@switchboard-xyz/common";
    import { ethers } from "ethers";

    const exampleAddress = "0xYOUR_CONTRACT_ADDRESS";  //  contract Address
    const abi = [
      "function randomnessId() external view returns (bytes32)",
      "function resolve(bytes[] calldata updates)"
    ]; //  copy the function signatures

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const yourContract = new ethers.Contract(exampleAddress, abi, signer);

    // get the randomness id from the contract 
    const randomnessId = await yourContract.randomnessId();

    const crossbar = CrossbarClient.default();

    const { encoded } = await crossbar.resolveEVMRandomness({
      chainId: 1114, // Chain ID for Core Testnet 2.  Example: Core Testnet1 is (1115).
      randomnessId: randomnessId, //  ID from your Solidity contract
    });

    ```
2.  **Submit to Contract:** Use a library like ethers.js or web3.js to submit the encoded data to your smart contract. Using ethers.js, it would look similar to:

    ```tsx
    const tx = await yourContract.resolve([encoded]);
    await tx.wait();

    console.log("Randomness resolved in transaction:", tx.hash);

    console.log("The random number is:", await yourContract.randomNumber());

    ```

#### In Summary

Integrate Switchboard randomness to get solidity randomness. Once the ID is given to the oracle, you can then use it on-chain for the randomness function. It would also be more efficient if the settlement of randoms is delayed until it gets resolved.

You've now implemented a secure and verifiable way to get randomness in your EVM smart contracts!
