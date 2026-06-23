# Quote Program Accounts

Solana/SVM feed-hash integrations use canonical quote-program accounts. These
accounts are derived from the queue public key and feed ID, then written by
managed updates from `queue.fetchManagedUpdateIxs(...)`.

Use this path for new custom feeds and feed-hash integrations. The older
`PullFeed.fetchUpdateIx(...)` path targets classic PullFeed accounts and
requires compatible legacy queue/gateway support.

## Derive The Account

```ts
import { OracleQuote } from "@switchboard-xyz/on-demand";

const [quoteAccount] = OracleQuote.getCanonicalPubkey(queue.pubkey, [feedId]);
```

The same feed ID and queue always derive the same quote account. If your
program accepts a quote account, constrain it to the canonical address for the
queue and feed ID.

## Read Stored Data

Stored quote accounts are variable-length. Do not parse feed values by
hard-coding byte offsets from a simulation or one account instance.

In Rust, use the SDK account types:

- `SwitchboardQuote`: stored quote-program account
- `PackedFeedInfo`: one feed result inside the quote
- `feeds_slice()` / `feeds()`: access feed results
- `feed_id` / `feed_id()`: 32-byte feed ID
- `feed_value` / `feed_value()`: raw `i128` value, scaled by Switchboard precision
- `value()`: decimal value helper
- `min_oracle_samples` / `min_oracle_samples()`: oracle-sample quorum recorded with the feed

```rust
use switchboard_on_demand::QuoteVerifier;

let quote = QuoteVerifier::new()
    .queue(&ctx.accounts.queue)
    .slothash_sysvar(&ctx.accounts.slothashes)
    .ix_sysvar(&ctx.accounts.instructions)
    .clock_slot(ctx.accounts.clock.slot)
    .max_age(50)
    .verify_account(&ctx.accounts.quote_account)?;

for feed in quote.feeds() {
    msg!("Feed {}: {}", feed.hex_id(), feed.value());
}
```

## JavaScript Decode Scope

`OracleQuote.decode(...)` parses the Ed25519 quote instruction payload used by
managed updates. It is useful when inspecting a quote instruction before it is
written on-chain.

It is not a stable raw account decoder for stored quote-program account data.
For stored account parsing, use the Rust/on-chain `SwitchboardQuote` account
types until a dedicated JavaScript account decoder is available.

## Troubleshooting

If `queue.fetchManagedUpdateIxs(...)` returns Ed25519 + quote-program
instructions but `PullFeed.fetchUpdateIx(...)` or
`pullFeedSubmitResponseConsensus` returns `ORACLE_UNAVAILABLE`, the integration
is using the classic PullFeed path against quote-program infrastructure. Move
the integration to managed quote-program updates and canonical quote accounts.

This is separate from feed-parameter scaling errors. If simulation succeeds but
signed updates fail with oracle validation errors such as `RangeExceeded`, check
the feed parameter units, especially raw v2 `maxJobRangePct`.
