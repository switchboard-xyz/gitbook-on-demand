---
description: Migrating to Switchboard, using Chainlink, on EVM Networks
---

# With EVM Networks

Switchboard provides two SDKs, one for using the SDK with Typescript, another in Solidity for reading prices on-chain.&#x20;

#### Typescript SDK <a href="#typescript-sdk" id="typescript-sdk"></a>

You can replace these packages with the single Switchboard Typescript SDK, [@switchboard-xyz/on-demand](https://www.npmjs.com/package/@switchboard-xyz/on-demand) with has a similar responsibility.

Get started by installing our [Javascript/Typescript SDK](https://switchboard-docs.web.app/) via:

```bash
# https://switchboard-docs.web.app/
npm i @switchboard-xyz/on-demand
```

#### Solidity SDK

You can install the Switchboard On-Demand [Solidity SDK](https://github.com/switchboard-xyz/evm-on-demand) by running:

```bash
# Add the Switchboard Solidity interfaces
npm add @switchboard-xyz/on-demand-solidity
```

#### Forge

If you're using Forge, add following to your **remappings.txt** file:

```
@switchboard-xyz/on-demand-solidity/=node_modules/@switchboard-xyz/on-demand-solidity
```

## Approach 1: Implementing Switchboard SDK  <a href="#install-pyth-sdks" id="install-pyth-sdks"></a>

## Updating On-Chain Code

### 1. Updating Imports

#### Chainlink

```solidity
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
```

#### Switchboard

```solidity
import {ISwitchboard} from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import {Structs} from "@switchboard-xyz/on-demand-solidity/Structs.sol";
```

### 2. Creating the Interface

#### Chainlink

```solidity
AggregatorV3Interface internal dataFeed;

constructor(address chainlinkFeedaddress) {
  dataFeed = AggregatorV3Interface(chainlinkFeedaddress);
}  
```

#### Switchboard

```solidity
ISwitchboard switchboard

constructor(address switchboardContract) {
  // https://docs.switchboard.xyz/docs/switchboard/readme/on-evm-networks#deployments
  switchboard = ISwitchboard(switchboardContract);
}
```

### Step 3: Updating & Reading the Feed

#### Chainlink

<pre class="language-solidity"><code class="lang-solidity"><strong>function exampleMethod() public payable {
</strong>  (
    /* uint80 roundID */,
    int answer,
    /*uint startedAt*/,
    /*uint timeStamp*/,
    /*uint80 answeredInRound*/
  ) = dataFeed.latestRoundData();
  result = answer;
}
</code></pre>

#### Switchboard

```solidity
function exampleMethod(bytes[] calldata priceUpdate) public payable {
  uint256 fees = switchboard.getFee(updates);
  switchboard.updateFeeds{ value: fees }(updates);
  bytes32 aggregatorId = "0xfd2b067707a96e5b67a7500e56706a39193f956a02e9c0a744bf212b19c7246c";
  Structs.Update memory latestUpdate = switchboard.latestUpdate(aggregatorId);

  // Get the latest feed result (int128)
  // This is encoded as decimal * 10^18
  result = latestUpdate.result;
}
```

The important thing to note about switchboard results is that they'll be stored as a decimal with a scale factor of 18.&#x20;

## Approach 2: Chainlink Interface & Pusher



🚧🔧 **Under Construction** 🚧🔧



