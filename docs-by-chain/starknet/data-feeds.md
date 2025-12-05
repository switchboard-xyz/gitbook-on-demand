# Starknet

### Active Deployments

The Switchboard On-Demand service is currently deployed on the following networks:

* Mainnet:
  * [0x068cc3c8e1d1ae4683ee7844454a11bc32ae0aa6188f268d73f7fff8004be68d](https://starkscan.co/contract/0x068cc3c8e1d1ae4683ee7844454a11bc32ae0aa6188f268d73f7fff8004be68d)
* Sepolia:
  * [0x02d880dd4a1fb6f61fc13b1ea767187b9b85f97460a2997abb537fb100cbc439](https://sepolia.starkscan.co/contract/0x02d880dd4a1fb6f61fc13b1ea767187b9b85f97460a2997abb537fb100cbc439)

Check out the example contract to see how to create a price feed using Switchboard On-Demand.

### Typescript-SDK Installation

To use Switchboard On-Demand, add the following dependencies to your project:

```bash
npm install @switchboard-xyz/starknet-sdk --save
```

### Creating an Aggregator and Sending Transactions

Building a feed in Switchboard can be done using the Typescript SDK, or it can be done with the [Switchboard Web App](https://ondemand.switchboard.xyz/starknet/mainnet). Visit our [docs](https://docs.switchboard.xyz/docs) for more on designing and creating feeds.

#### Building Feeds

```typescript
import {
  SwitchboardClient,
  Aggregator,
  STARKNET_TESTNET_QUEUE,
  STARKNET_MAINNET_QUEUE,
} from "@switchboard-xyz/starknet-sdk";
import { Account, RpcProvider } from 'starknet';

// initialize starknet provider
const provider = new RpcProvider({ nodeUrl: 'http://127.0.0.1:5050/rpc' });
// initialize existing starknet account
const privateKey = '0x71d7bb07b9a64f6f78ac4c816aff4da9';
const accountAddress = '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691';

const walletAccount = new Account(provider, accountAddress, privateKey);

const feedHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // replace with your feed hash

export async function createFeed() {
  // .. initialize wallet or starknet account ..
  const client = new SwitchboardClient(walletAccount);

  const params = {
    authority: walletAccount.address,
    name: "EXAMPLE/USD",
    queueId: STARKNET_TESTNET_QUEUE, // or STARKNET_MAINNET_QUEUE
    toleratedDelta: 100,
    maxStaleness: 100,
    feedHash,
    maxVariance: 5e9,
    minResponses: 1,
    minSamples: 1, // required to be 1 for Starknet
  };

  const aggregator = await Aggregator.init(client, params);

  console.log("Feed created!", await aggregator.loadData());

  return aggregator;
}

createFeed();

```

### Adding Switchboard to Cairo Code

To integrate Switchboard with your code, first add the following dependencies to Scarb.toml:

```toml
switchboard = { git = "https://github.com/switchboard-xyz/starknet.git" }
```

### Example Cairo Code for Using Switchboard Values

In the module, use the latest result function to read the latest data for a feed.

```rust
#[starknet::interface]
pub trait IBtcFeedContract<T> {
    fn update(
        ref self: T, update_data: ByteArray
    );
}

#[starknet::contract]
mod example_contract {
    use core::{ByteArray, panic_with_felt252};
    use starknet::{ContractAddress, get_block_timestamp};

    // @dev Import the Switchboard dispatcher and the Switchboard dispatcher trait.
    use switchboard::{ISwitchboardDispatcher, ISwitchboardDispatcherTrait};

    // Storage for the Switchboard contract addresss, the BTC Feed ID, and the BTC price.
    #[storage]
    struct Storage {
        switchboard_address: ContractAddress, // <--- Switchboard contract address
        btc_feed_id: felt252, // <--- Feed ID
        btc_price: i128,
    }

    // Constructor to initialize the contract storage.
    #[constructor]
    fn constructor(
        ref self: ContractState,
        switchboard_address: ContractAddress,
        btc_feed_id: felt252
    ) {
        self.switchboard_address.write(switchboard_address);
        self.btc_feed_id.write(btc_feed_id);
    }

    #[abi(embed_v0)]
    impl BtcFeedContract of super::IBtcFeedContract<ContractState> {
        fn update(
            ref self: ContractState,
            update_data: ByteArray // <--- Update data to be passed to the Switchboard contract
        ) {
            let switchboard = ISwitchboardDispatcher { contract_address: self.switchboard_address.read() };

            // Update the price feed data
            switchboard.update_feed_data(update_data);

            // Read the fresh price feed
            let btc_price = switchboard.latest_result(self.btc_feed_id.read());

            // Check the age of the update - if it is older than 60 seconds, panic
            if (btc_price.max_timestamp < get_block_timestamp() - 60) {
                panic_with_felt252('Price feed is too old');
            }

            // write the price to storage
            self.btc_price.write(btc_price.result);
        }
    }
}
```

### Executing updates in TypeScript

To get the update data for a feed, use the following code:

```typescript
import {
  ProviderInterface,
  AccountInterface,
  Contract,
  RpcProvider,
  Account,
  constants,
  CallData,
} from "starknet";
import { ABI } from "./abi"; // <-- Import the ABI for the contract
import { readFileSync } from "fs";
import { SwitchboardClient, Aggregator } from "@switchboard-xyz/starknet-sdk";

// initialize starknet provider
const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
// initialize existing starknet account
const privateKey = process.env.PRIVATE_KEY!;
const accountAddress = process.env.EXAMPLE_ADDRESS!
const feedHash = process.env.FEED_ID!;

const walletAccount = new Account(provider, accountAddress, privateKey);

function trimHexPrefix(hex: string) {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

async function main() {
  const exampleAddress = process.env.EXAMPLE_ADDRESS!;

  const feedId = trimHexPrefix(process.env.FEED_ID!);

  // get the aggregator
  const aggregator = new Aggregator(new SwitchboardClient(walletAccount), feedId);

  // Fetch the update ByteArray and oracle responses
  const { updates, responses } = await aggregator.fetchUpdate();

  // Run the update
  const contract = await ABI.getBtcFeedContract(exampleAddress, walletAccount);
  const tx = await contract.update(CallData.compile(updates));
  console.log("Transaction hash:", tx.transaction_hash);
  await walletAccount.waitForTransaction(tx.transaction_hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

```

This implementation allows you to read and utilize Switchboard data feeds within Cairo. If you have any questions or need further assistance, please contact the Switchboard team.

**DISCLAIMER: ORACLE CODE AND CORE LOGIC ARE AUDITED - THE AUDIT FOR THIS ON-CHAIN ADAPTER IS PENDING**
