# Integrating your Feed On-Chain

This guide provides a comprehensive walkthrough of integrating Switchboard feeds into your Solidity smart contracts on EVM-compatible chains.

#### 1. Understanding Switchboard's Diamond Pattern

Switchboard contracts use the Diamond Pattern. To simplify modular contract design it presents a single unchanging contract address. Traditional explorers cannot easily locate the verified contract, so this solution has been developed to make this process easier.

* To help with this issue, we recommend the using [louper.dev](http://louper.dev). This can be used for for seamless contract analysis and function calls. This is a custom diamond explorer, specifically designed to interact with Switchboard diamond contracts.

#### 2. Installation

Before you begin, install these items:

1.  **Switchboard On-Demand Solidity SDK:**

    ```bash
    npm add @switchboard-xyz/on-demand-solidity
    ```
2.  **Forge (Optional):**

    * If you are working with Forge, include this in your remappings.txt file:

    ```
    @switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
    ```

#### 3. Minimal Integration

To minimise dependencies, you can integrate Switchboard feeds by defining only function signatures and structures.

```solidity
struct Update {
    bytes32 oracleId; // The publisher of the update
    int128 result; // The value of the recorded update
    uint256 timestamp; // The timestamp of the update
}

interface ISwitchboard {
    function latestUpdate(
        bytes32 aggregatorId
    ) external view returns (Update memory);
    function updateFeeds(bytes[] calldata updates) external payable;
    function getFee(bytes[] calldata updates) external view returns (uint256);
}

```

#### 4. Solidity Walkthrough

Let’s walk through how to use Switchboard feeds in your Solidity code:

1.  **Import Statements:**

    ```solidity
    import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
    import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";

    ```

    * `ISwitchboard`: Defining the core implementation of the Switchboard contract interface.
    * `Structs`: Contract containing the data formats used within the Switchboard structure.
2.  **Contract Definition:**

    ```solidity
    contract Example {
      ISwitchboard switchboard;

      // Every Switchboard Feed has a unique feed ID derived from the OracleJob definition and Switchboard Queue ID.
      bytes32 aggregatorId;

      /**
       * @param _switchboard The address of the Switchboard contract
       * @param _aggregatorId The aggregator ID for the feed you want to query
       */
      constructor(address _switchboard, bytes32 _aggregatorId) {
        // Initialize the target _switchboard
        // Get the existing Switchboard contract address on your preferred network from the Switchboard Docs
        switchboard = ISwitchboard(_switchboard);
        aggregatorId = _aggregatorId;
      }

    }

    ```

    Within the `Example` contract:

    * `switchboard` is the reference to the diamond contract, it can be found in [Technical Resources](https://www.notion.so/Docs-1808fb22cfab80f5b05dd7507d05b391?pvs=21)
    * `aggregatorId` that we're interested in reading. If you don't have an aggregatorId yet, create a feed by following: [Designing a Feed (EVM)](https://www.notion.so/Docs-1808fb22cfab80f5b05dd7507d05b391?pvs=21).
3.  **Function Boilerplate:**

    1. Here we're adding the function to get feed data. The idea is that we'll pass in an encoded Switchboard update (or set of updates) that will be used to update the `aggregatorId` of our choice. We can then read our recently-written update safely.

    ```solidity
      /**
       * getFeedData is a function that uses an encoded Switchboard update
       * If the update is successful, it will read the latest price from the feed
       * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
       * @param updates Encoded feed updates to update the contract with the latest result
       */
      function getFeedData(bytes[] calldata updates) public payable {
        //...
      }

    ```
4.  **Adding a Fee:**

    ```solidity
    contract Example {

      // ...

      // If the transaction fee is not paid, the update will fail.
      error InsufficientFee(uint256 expected, uint256 received);

      function getFeedData(bytes[] calldata updates) public payable {
        // Get the fee for updating the feeds.
        uint256 fee = switchboard.getFee(updates);

        // If the transaction fee is not paid, the update will fail.
        if (msg.value < fee) {
          revert InsufficientFee(fee, msg.value);
        }

        // ...
      }
    }
    ```

    Here we're doing a few things relating to update fees.

    We're adding a new error,

    ```
    InsufficientFee(uint256 expected, uint256 received)
    ```

    that will be used if the submitted transaction value isn't enough to cover the update.

    We're calling

    ```
    getFee(bytes[] calldata updates)
    ```

    to get the cost of submitting a Switchboard update programmatically from the Switchboard program.

    We're enforcing that users pay for fees before submitting any updates.
5.  **Submitting Updates:**

    ```solidity
        // Submit the updates to the Switchboard contract
        switchboard.updateFeeds{ value: fee }(updates);

        // Read the current value from a Switchboard feed.
        // This will fail if the feed doesn't haven fresh updates ready (e.g. if the feed update failed)
        Structs.Update memory latestUpdate = switchboard.latestUpdate(aggregatorId);
    ```

    This line updates feed values in the Switchboard contract, and sends the required fee. Internally, each update is parsed and encoded signatures are verified and checked against the list of valid oracles on a given chain.

    This `bytes[] calldata` parameter keeps things simple by making common Switchboard updates into one data-type. Everything is handled behind the scenes.

    The `{ value: fee }` in the call sends `fee` wei over to the Switchboard contract as payment for updates. The intent here is to pay for the updates.
6.  **Checking Validated Data:**

    ```solidity
      // If the feed result is invalid, this error will be emitted.
      error InvalidResult(int128 result);

      // If the Switchboard update succeeds, this event will be emitted with the latest price.
      event FeedData(int128 price);

      // ...

      function getFeedData(bytes[] calldata updates) public payable {

          // ...

          // Get the latest feed result
          // This is encoded as decimal * 10^18 to avoid floating point issues
          // Some feeds require negative numbers, so results are int128's, but this example uses positive numbers
          int128 result = latestUpdate.result;

          // In this example, we revert if the result is negative
          if (result < 0) {
              revert InvalidResult(result);
          }

          // Emit the latest result from the feed
          emit FeedData(latestUpdate.result);
      }

    ```

    Here we're pulling the result out of the latest update. Switchboard updates are encoded as int128's. Another important fact is that values are decimals scaled up by 10^18.

    For example, the value

    ```
    1477525556338078708
    ```

    would represent

    ```
    1.4775..8708

    ```

    Next, we check that the value is positive and revert with an

    ```
    InvalidResult
    ```

    if it isn't. Finally, if the update was successful, we emit a FeedData event.
7. **Putting It All Together**: (Full Example.Sol)

```solidity
pragma solidity ^0.8.0;

import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";

contract Example {
  ISwitchboard switchboard;

  // Every Switchboard feed has a unique aggregator id
  bytes32 aggregatorId;

  // Store the latest value
  int128 public result;

  // If the transaction fee is not paid, the update will fail.
  error InsufficientFee(uint256 expected, uint256 received);

  // If the feed result is invalid, this error will be emitted.
  error InvalidResult(int128 result);

  // If the Switchboard update succeeds, this event will be emitted with the latest price.
  event FeedData(int128 price);

  /**
   * @param _switchboard The address of the Switchboard contract
   * @param _aggregatorId The feed ID for the feed you want to query
   */
  constructor(address _switchboard, bytes32 _aggregatorId) {
    // Initialize the target _switchboard
    // Get the existing Switchboard contract address on your preferred network from the Switchboard Docs
    switchboard = ISwitchboard(_switchboard);
    aggregatorId = _aggregatorId;
  }

  /**
   * getFeedData is a function that uses an encoded Switchboard update
   * If the update is successful, it will read the latest price from the feed
   * See below for fetching encoded updates (e.g., using the Switchboard Typescript SDK)
   * @param updates Encoded feed updates to update the contract with the latest result
   */
  function getFeedData(bytes[] calldata updates) public payable {

    // Get the fee for updating the feeds. If the transaction fee is not paid, the update will fail.
    uint256 fees = switchboard.getFee(updates);
    if (msg.value < fee) {
      revert InsufficientFee(fee, msg.value);
    }

    // Submit the updates to the Switchboard contract
    switchboard.updateFeeds{ value: fees }(updates);

    // Read the current value from a Switchboard feed.
    // This will fail if the feed doesn't have fresh updates ready (e.g. if the feed update failed)
    Structs.Update memory latestUpdate = switchboard.latestUpdate(aggregatorId);

    // Get the latest feed result
    // This is encoded as decimal * 10^18 to avoid floating point issues
    // Some feeds require negative numbers, so results are int128's, but this example uses positive numbers
    result = latestUpdate.result;

    // In this example, we revert if the result is negative
    if (result < 0) {
      revert InvalidResult(result);
    }

    // Emit the latest result from the feed
    emit FeedData(latestUpdate.result);
  }
}

```

**Review**

This contract:

1. Sets the Switchboard contract address and `feed ID` in the constructor
2. Defines a function `getFeedData`
3. Checks if the transaction fee is paid, using `switchboard.getFee(bytes[] calldata updates)`.
4. Submits the updates to the Switchboard contract using `switchboard.updateFeeds(bytes[] calldata updates)`.
5. Reads the latest value from the feed using `switchboard.getLatestValue(bytes32 aggregatorId)`.
6. Emits the latest result from the feed.

Follow the next [section](https://www.notion.so/Docs-1808fb22cfab80f5b05dd7507d05b391?pvs=21) to understand how to use data feeds with Typescript
