# Authority-Updated Feeds

Authority-updated feeds let you publish Switchboard quote accounts on Solana using a trusted authority instead of Switchboard's oracle-signing flow.

In this model, the authority signs the update directly and `quote_program` stores the result in the same quote-account format used by Surge. The authority can be:

- a wallet
- a PDA signed by another Solana program with `invoke_signed`

Throughout this page, "authority-updated feed" means an authority-owned quote account in `quote_program`.

## When To Use This Feature

Use authority-updated feeds when your application is the source of truth for a value and you want to publish that value through Switchboard quote-account tooling.

Common examples:

- protocol-defined mark or fair values
- internal pricing models
- program-owned data streams published from a PDA
- integrations that want a stable quote-account interface without oracle signatures

Use the standard oracle-backed update path instead if you need Switchboard oracle verification and the corresponding trust model.

## What Gets Created

A single authority-updated quote account can contain one or more feed IDs and their latest values.

On the first successful update, `quote_program`:

- derives the quote PDA
- creates the quote account
- writes the payload

There is no separate initialize instruction. Creation happens on first write.

## Quote Account Identity

The quote account PDA is derived from:

```text
quote_account = PDA(
  [
    b"AUTH",
    authority_pubkey,
    feed_id_1,
    feed_id_2,
    ...
  ],
  quote_program_id
)
```

Two consequences matter in practice:

- the authority is part of the quote stream identity
- feed order is part of the quote stream identity

These feed bundles produce different quote accounts:

```text
[BTC, ETH]
[ETH, BTC]
```

Recommended practice:

- choose one canonical ordering and use it everywhere
- for human-labeled feeds, sort alphabetically by symbol or another stable label before building the payload
- keep the same ordered feed list when deriving the PDA, building the payload, and storing configuration in your app

If the order changes, the quote account address changes.

## High-Level Flow

### Wallet authority

1. Build an authority quote payload with the feed IDs, values, and slot.
2. Derive the quote PDA from the authority and the ordered feed list.
3. Send `FeedAuthorityUpdate`.
4. `quote_program` validates the signer, derivation, and slot progression.
5. The quote account is created on first use or updated if it already exists.

### PDA authority

1. Your program derives or receives its authority PDA.
2. Your program builds or receives the authority quote payload.
3. Your program CPI-calls `quote_program::FeedAuthorityUpdate`.
4. Your program signs the CPI with `invoke_signed`.
5. `quote_program` applies the same validation and writes the update.

## Accounts

`FeedAuthorityUpdate` expects:

1. `quote_account` - writable
2. `authority` - signer
3. `clock_sysvar`
4. `payer` - signer and rent payer on first use
5. `system_program`

Notes:

- `authority` can be a wallet or PDA
- `quote_account` is always a PDA owned by `quote_program`
- `payer` funds initialization, but the authority defines the stream identity

## Payload Format

Authority updates use a dedicated payload format:

```text
[4 bytes]  scheme tag           = "AUTH"
[1 byte]   feed_count
[N bytes]  PackedFeedInfo[feed_count]
[8 bytes]  slot (u64 LE)
[1 byte]   version
[4 bytes]  tail discriminator   = "SBOD"
```

Each `PackedFeedInfo` is:

```text
[32 bytes] feed_id
[16 bytes] feed_value (i128 LE)
[1 byte]   min_oracle_samples
```

Notes:

- `feed_id` is a 32-byte feed identifier
- `feed_value` is stored as signed `i128`
- `min_oracle_samples` is retained for compatibility with shared quote tooling; SDK helpers default it to `1`
- the payload must include at least one feed

## Validation Rules

`quote_program::FeedAuthorityUpdate` rejects the update unless all of the following are true:

- `authority` signed the transaction
- the payload parses as a valid authority quote payload
- the payload contains between `1` and `13` feed IDs
- the payload contains no duplicate feed IDs
- the provided `quote_account` matches the PDA derived from `AUTH + authority + ordered feed IDs`
- if the quote account already exists, the stored authority matches the signer
- the payload slot is strictly less than the current cluster slot at execution time
- the payload slot is greater than or equal to the last stored slot

The current feed-ID limit is:

- maximum feed count: `13`
- maximum feed-ID bytes used in PDA seeds: `416`

Practical slot guidance:

- fetch a recent slot before building the payload
- treat the slot as monotonic per quote account
- do not reuse an older slot after a newer update has already landed

## What Gets Stored On-Chain

Authority-backed quotes use the existing Switchboard quote-account layout.

For authority quotes:

- the first 32-byte namespace field stores the authority pubkey
- the quote data section stores the encoded authority payload
- shared decoders reconstruct the quote as `sourceScheme = "authority"`

For oracle-backed quotes, that same namespace field stores a queue pubkey instead. The layout stays compatible, but consumers must inspect the source scheme before applying trust assumptions.

## Reading And Trust

Authority-updated feeds are not oracle-verified quotes. Consumers should trust them only to the extent that they trust the configured authority.

When reading an authority quote:

- decode it through the normal quote readers or SDK helpers
- check that `sourceScheme` is `authority`
- treat the authority pubkey as the publisher identity
- do not assume oracle signatures or `QuoteVerifier`-style oracle trust guarantees

This model is a good fit when your application, service, or program is intentionally the publisher of record.

## TypeScript SDK Helpers

The TypeScript SDK exposes helpers in `javascript/on-demand/src/classes/oracleQuote.ts`:

- `OracleQuote.buildAuthorityQuotePayload(...)`
- `OracleQuote.deriveAuthorityQuotePubkey(...)`
- `OracleQuote.buildFeedAuthorityUpdateInstruction(...)`

Example:

```ts
import { OracleQuote } from "@switchboard-xyz/on-demand";

const authority = myAuthorityPubkey;
const payer = myWallet.publicKey;

const feeds = [
  { symbol: "BTC", feedHash: btcFeedId, value: 123_000000000000000000n },
  { symbol: "ETH", feedHash: ethFeedId, value: 456_000000000000000000n },
].sort((a, b) => a.symbol.localeCompare(b.symbol));

const payload = OracleQuote.buildAuthorityQuotePayload(
  feeds.map(({ feedHash, value }) => ({
    feedHash,
    value,
  })),
  recentSlot
);

const orderedFeedIds = feeds.map(({ feedHash }) => feedHash);

const [quoteAccount] = OracleQuote.deriveAuthorityQuotePubkey(
  authority,
  orderedFeedIds
);

const ix = OracleQuote.buildFeedAuthorityUpdateInstruction({
  authority,
  payer,
  payload,
  quoteAccount,
});
```

If you set `minOracleSamples` explicitly, use the same ordered feed list for both payload construction and PDA derivation.

## Rust SDK Helpers

The Rust SDK exposes the same concepts in `switchboard-on-demand`:

- `build_authority_quote_payload(...)`
- `derive_authority_quote_pubkey(...)`
- `build_feed_authority_update_instruction(...)`

These helpers are useful for:

- off-chain Rust clients
- integration tests
- Solana programs preparing CPI inputs

## Best Practices

- Pick a canonical feed ordering before you publish the first update.
- Alphabetical ordering by symbol is a good default when feeds have stable human-readable names.
- If you only work with raw feed IDs, sort them by a stable application-level rule and never change it.
- Persist the authority, ordered feed list, and derived quote account together in your configuration.
- Keep feed bundles small and avoid duplicate feed IDs.
- Separate authority-backed handling from oracle-backed handling in downstream code.
- Only publish or consume authority quotes in places where the authority is an acceptable trust anchor.

## Summary

Authority-updated feeds let a wallet or PDA publish Switchboard quote accounts directly into Solana `quote_program`.

Key properties:

- the authority owns the quote stream identity
- feed order matters
- first write initializes the account
- the current limit is `13` feed IDs per quote
- shared readers decode these quotes as `sourceScheme = "authority"`

Use this flow when you want Switchboard-compatible quote accounts but the data should be trusted because of your authority signer, not because of Switchboard oracle signatures.
