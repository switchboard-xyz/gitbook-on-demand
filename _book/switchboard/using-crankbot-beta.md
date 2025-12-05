---
description: A Telegram bot for keeping Switchboard On-Demand feeds fresh
---

# Using Crankbot (beta)

**DISCLAIMER: THIS IS BETA SOFTWARE, USE AT YOUR OWN RISK**

{% embed url="https://t.me/realCrankBot" %}

**CrankBot** is a Telegram bot inspired by BonkBot, designed to crank Switchboard On-Demand feeds on Solana. It aims to provide users with a customizable, transparent, and easy-to-use interface for managing Switchboard On-Demand cranks.

### Getting Started

To get started with the Switchboard Crankbot (alpha), run `/start` . This will create a keypair for your account, and log the new public key associated with that account. You can then add feeds by simply typing in the feed public key. Try it now with a feed from [Switchboard's On-Demand Explorer](https://ondemand.switchboard.xyz/solana/mainnet)!&#x20;

As soon as you have a feed added and the account funded, you can run `/crank` to start receiving updates.&#x20;

### Debugging

If you want some insight on what's happening within your crank instance, try `/debug` to start receiving debug messages about your feeds as crank attempts are made (use `/stopdebug` to silence the messages). Try `/listen` to only listen to successful feed update requests (and `/stoplisten` to silence it).

### Priority Fees

Sometimes transactions won't land if the priority fee is low enough. Sometimes during times of congestion, you may want to ignore the dynamic priority fee in favor of a static one. To set this you can use the `/cuprice <microlamports>` command. Run `/cuprice 0` to return to dynamic fees.&#x20;

#### Commands

* `/home`: View balance and open the main menu.
* `/status`: Check the crank status.
* `/crank`: Start the crank.
* `/stopcrank`: Stop the crank.
* `/debug`: Start debug logs.
* `/stopdebug`: Stop debug logs.
* `/listen`: Listen to crank updates.
* `/stoplisten`: Stop listening to crank updates.
* `/cuprice`: Set the compute unit price (priority fee).
* `/revealsecret`: Get the private key of the account (base58).
* `/rotatesecret`: Get the existing private key (base58) and rotate the account key.
* `/help`: Tips and frequently asked questions.

For further assistance, visit the [CrankBot Telegram Channel](https://t.me/realCrankBot).\
