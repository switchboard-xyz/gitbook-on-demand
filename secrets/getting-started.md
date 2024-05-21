# Getting Started

Today, we will review the implementation of Switchboard Secrets within your oracle feed! We recommend setting up a simple feed first by following the [Developers: Build and Use!](https://app.gitbook.com/s/ZUlLPjef2DsoVKi8Itkj/developers-build-and-use) page first before attempting to embed a secret in your feed!Using Switchboard-Secrets is designed for maximum speed, security, and simplicity.Switchboard offers both a Rust and TypeScript SDK for initializing your feed object as well as embedding and retrieving secrets.You may get started with the JavaScript/TypeScript SDKs via:

`npm i @switchboard-xyz/on-demand @switchboard-xyz/common`

Using these SDK,s you can design your data feed to securely embed and use secrets just like your regular Switchboard on-demand data feeds.

### Step 1: **Set Up Your Environment:** <a href="#step-1-set-up-your-environment" id="step-1-set-up-your-environment"></a>

* Install the required packages.
* Initialize your environment variables and key pairs.

import { SwitchboardSecrets } from "@switchboard-xyz/common";import nacl from "tweetnacl";import dotenv from "dotenv";​dotenv.config();const sbSecrets = new SwitchboardSecrets();const API\_KEY = process.env.OPEN\_WEATHER\_API\_KEY;const secretName = "OPEN\_WEATHER\_API\_KEY";const secretNameTask = "${" + secretName + "}"const keypair = // ... load or generate your keypair

### Step 2: **Create the User Profile and Secret** <a href="#step-2-create-the-user-profile-and-secret" id="step-2-create-the-user-profile-and-secret"></a>

To embed a secret you will need to setup a user profile and add your secret to the user profile.You can create a user profile like this.const payload = await sbSecrets.createOrUpdateUserRequest(keypair.publicKey.toBase58(),"ed25519","");const signature = nacl.sign.detached(new Uint8Array(payload.toEncodedMessage()),keypair.secretKey);const user = await sbSecrets.createOrUpdateUser(payload,Buffer.from(signature).toString("base64"));The function `sbSecrets.createOrUpdateUserRequest` takes in 3 parameters:

1. 1.**`userPubkey`**(`string`): The public key address of the user.
2. 2.**`ciphersuite`**(`string`): Specifies the cryptographic suite used for signing. For Solana, use `"ed25519"` , for EVM, use `"ethers"`.
3. 3.**`contactInfo`**(`string`): This optional field can be used to store stringified contact information, such as an email address or other contact details. Can be left empty `""`.

Once created, you can query your user profile like this!const userSecrets = await sbSecrets.getUserSecrets(keypair.publicKey.toBase58(),"ed25519");Right, now to add your secret to your user profile..
