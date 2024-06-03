# Getting Started

Today, we will review the implementation of Switchboard Secrets within your oracle feed! We recommend setting up a simple feed first by following the [Developers: Build and Use!](https://app.gitbook.com/s/ZUlLPjef2DsoVKi8Itkj/developers-build-and-use) page first before attempting to embed a secret in your feed! Switchboard-Secrets is designed for maximum speed, security, and simplicity. Switchboard offers both a Rust and TypeScript SDK for initializing your feed object as well as embedding and retrieving secrets. You may get started with the JavaScript/TypeScript SDKs via:

`npm i @switchboard-xyz/on-demand @switchboard-xyz/common`

Using these SDK's you can design your data feed to securely embed and use secrets just like your regular Switchboard on-demand data feeds.

### Step 1: **Set Up Your Environment:** <a href="#step-1-set-up-your-environment" id="step-1-set-up-your-environment"></a>

* Install the required packages.
* Initialize your environment variables and key pairs.

```typescript
import { SwitchboardSecrets } from "@switchboard-xyz/common";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config();
const sbSecrets = new SwitchboardSecrets();
const API_KEY = process.env.OPEN_WEATHER_API_KEY;
const secretName = "OPEN_WEATHER_API_KEY";
const secretNameTask = "${" + secretName + "}"
const keypair = // ... load or generate your keypair
const txOpts = {
    commitment: "processed" as Commitment,
    skipPreflight: true,
    setTimeout: 10000,
  };
```

### Step 2: **Create the User Profile and Secret** <a href="#step-2-create-the-user-profile-and-secret" id="step-2-create-the-user-profile-and-secret"></a>

To embed a secret you will need to setup a user profile and add your secret to the user profile.You can create a user profile like this.

```typescript
const payload = await sbSecrets.createOrUpdateUserRequest(
    keypair.publicKey.toBase58(),
    "ed25519",
    "");
const signature = nacl.sign.detached(
    new Uint8Array(payload.toEncodedMessage()),
    keypair.secretKey);
const user = await sbSecrets.createOrUpdateUser(
    payload,
    Buffer.from(signature).toString("base64"));
```

The function `sbSecrets.createOrUpdateUserRequest` takes in 3 parameters:

1. 1.**`userPubkey`**(`string`): The public key address of the user.
2. 2.**`ciphersuite`**(`string`): Specifies the cryptographic suite used for signing. For Solana, use `"ed25519"` , for EVM, use `"ethers"`.
3. 3.**`contactInfo`**(`string`): This optional field can be used to store stringified contact information, such as an email address or other contact details. Can be left empty `""`.

Once created, you can query your user profile like this!

```typescript
  const userSecrets = await sbSecrets.getUserSecrets(keypair.publicKey.toBase58(),
      "ed25519");
```

Right, now to add your secret to your user profile..

```typescript
const secretRequest = sbSecrets.createSecretRequest(
    keypair.publicKey.toBase58(),
    "ed25519",
    secretName,
    secretValue);
const secretSignature = nacl.sign.detached(
    new Uint8Array(secretRequest.toEncodedMessage()),
    keypair.secretKey); 
const secret = await sbSecrets.createSecret(
    secretRequest,
    Buffer.from(secretSignature).toString("base64"));
```

The function `sbSecrets.createSecretRequest` takes in 4 parameters:

1. **`userPubkey`**(`string`): The public key address of the user.
2. **`ciphersuite`**(`string`): Specifies the cryptographic suite used for signing. For Solana, use `"ed25519"` , for EVM, use `"ethers"`.
3. **`secretName`**(`string`): Key of the secret, must be unique per user profile.
4. **`secretValue`**(`string`): Value of the secret.

## Step 3: Create Your Feed

Using the SDK, you can now design your data feed just like your Switchboard-v2 data feeds but now using an embedded secret. \
Note - due to variable expansion, make sure that the name of your embedded secret in your feed is passed in correctly.

```typescript
const secretNameTask = "${" + secretName + "}"
```

```typescript
export function buildSecretsJob(secretNameTask: string, keypair: Keypair): OracleJob {
  const jobConfig = {
    tasks: [
      {
        secretsTask: {
          authority: keypair.publicKey.toBase58(),
        }
      },
      {
        httpTask: {
          url: `https://api.openweathermap.org/data/2.5/weather?q=aspen,us&appid=${secretNameTask}&units=metric`,
        }
      },
      {
        jsonParseTask: {
          path: "$.main.temp"
        }
      },
    ],
  };
  return OracleJob.fromObject(jobConfig);
}
```

The job definition above does three things.

1. Invokes a secrets task to fetch the secret to embed in the `httpTask.`
2. Fetching the weather REST service from openweathermap.org for the temperature in Aspen.
3. Using [JSONPATH](https://github.com/json-path/JsonPath) syntax to parse out the temperature field

Now lets finish creating the feed below and initializing it!

```typescript
 const conf = {
    // the feed name (max 32 bytes)
    name: "Feed Weather Temp Aspen",
    // the queue of oracles to bind to
    queue,
    // the jobs for the feed to perform
    jobs: [buildSecretsJob(secretNameTask, keypair)],
    // allow 1% variance between submissions and jobs
    maxVariance: 1.0,
    // minimum number of responses of jobs to allow
    minResponses: 1,
    // number of signatures to fetch per update
    numSignatures: 3,
  };

  // Initialize the feed if needed
  let pullFeed: PullFeed;
  if (argv.feed === undefined) {
    // Generate the feed keypair
    const [pullFeed_, tx] = await PullFeed.initTx(program, conf);
    const sig = await sendAndConfirmTx(connection, tx, [keypair]);
    console.log(`Feed ${feedKp.publicKey} initialized: ${sig}`);
    pullFeed = pullFeed_;
  } else {
    pullFeed = new PullFeed(program, new PublicKey(argv.feed));
  }
```

For a more detailed description of configuring your feed visit this page - [developers-build-and-use.md](../readme/developers-build-and-use.md "mention")

## Step 4: Whitelist your Feed to your Secret

As an added safety measure, you are required to whitelist your feed to your secret. This is accomplished by obtaining the hash of your feed and whitelisting it ot the secret!\
Here we go..

```typescript
const feedHash = FeedHash.compute(queue.toBuffer(), conf.jobs);
const addWhitelist = await sbSecrets.createAddMrEnclaveRequest(
    keypair.publicKey.toBase58(),
    "ed25519",
    feedHash.toString('hex'),
    [secretName]
  );
  const whitelistSignature = nacl.sign.detached(
    new Uint8Array(addWhitelist.toEncodedMessage()),
    keypair.secretKey
  );
  const sendWhitelist = await sbSecrets.addMrEnclave(
    addWhitelist,
    Buffer.from(whitelistSignature).toString("base64")
  );
```

The function `sbSecrets.createAddMrEnclaveRequest` takes in 4 parameters:

1. **`userPubkey`**(`string`): The public key address of the user.
2. **`ciphersuite`**(`string`): Specifies the cryptographic suite used for signing. For Solana, use `"ed25519"` , for EVM, use `"ethers"`.
3. **`mrEnclave`**(`string`): The hash of the feed you created, we call it the mrEnclave value :sunglasses:.
4. **`secretNames`**(`string[]`): The names of the secrets to whitelist the MrEnclave value for.

## Step 5: Fire away!

After the feed has been initialized, we can now request temperature signatures from oracles!

```typescript
let priceUpdateIx = await pullFeed.fetchUpdateIx(conf);
const [priceUpdateIx, oracleResponses, numSuccess] = priceUpdateIx!;

const luts = oracleResponses.map((x) => x.oracle.loadLookupTable());
luts.push(pullFeed.loadLookupTable());

const tx = await InstructionUtils.asV0TxWithComputeIxs(
      program,
      [priceUpdateIx, await myProgramIx(myProgram, pullFeed.pubkey)],
      2,
      100_000,
      await Promise.all(luts)
    );
tx.sign([keypair]);
const sim = await connection.simulateTransaction(tx, txOpts);
const sig = await connection.sendTransaction(tx, txOpts);
```

And just like that, you've got Switchboard secured data on chain with embedded secrets!
