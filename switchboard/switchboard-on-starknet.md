# Switchboard on Starknet

### Push on Starknet

Starknet currently supports the Switchboard pusher contract.

**A library for interacting with switchboard smart contracts** written in Cairo for [Starknet](https://starkware.co/product/starknet/), a decentralized ZK Rollup.

> **Warning** This repo contains highly experimental code. It has no code coverage checks. It hasn't been audited. **Use at your own risk.**

### Usage

#### Prepare the environment

Simply [install Cairo and scarb](https://docs.swmansion.com/scarb/download).

#### Set up your project

Create a new project and `cd` into it.

```
scarb new my_project && cd my_project
```

The contents of `my_project` should look like this:

```
$ ls

Scarb.toml src
```

#### Using Switchboard Push Receiver



The Switchboard Push Receiver is deployed at: `0x02b5ebc4a7149600ca4890102bdb6b7d6daac2fbb9d9ccd01f7198ca29107ec4`

Open `src/lib.cairo` and write your contract.

The easiest way to use Switchboard on Starknet is to use the following simple interface:

```
// This will generate ISwitchboardPushDispatcher and ISwitchboardPushDispatcherTrait
#[starknet::interface]
trait ISwitchboardPush<State> {
    fn get_latest_result(self: @State, feed_id: felt252) -> (u128, u64);
}
```

```
#[starknet::contract]
mod MyProject {
    #[constructor]
    fn constructor(
        ref self: ContractState,
        switchboard_address: ContractAddress,
    ) {
        ...
    }

    fn read_switchboard_value(
        ref self: ContractState,
        feed_id: felt252,
    ) -> (u128, u64) {
        let dispatcher = ISwitchboardPushDispatcher { contract_address: self.switchboard_address.read() };
        let (value, timestamp) = dispatcher.get_latest_result(feed_id);
        (value, timestamp)
    }
}
```

For more information on using this please see the javascript and Cairo SDKs below

* [https://github.com/switchboard-xyz/starknet-sdk](https://github.com/switchboard-xyz/starknet-sdk)
* Examples:
  * [https://github.com/switchboard-xyz/starknet-sdk/tree/main/examples/OracleExample](https://github.com/switchboard-xyz/starknet-sdk/tree/main/examples/OracleExample)

