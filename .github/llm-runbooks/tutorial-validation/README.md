# Tutorial Validation Runbook

This runbook is for terminal-capable LLM agents validating Switchboard tutorial docs after documentation or example changes.

These files live under `.github/` on purpose:

- they are visible in the repo
- they are not part of the published GitBook nav
- they must not be added to `SUMMARY.md`

## Purpose

Validate every tutorial-like page listed in [`tutorial-manifest.yaml`](./tutorial-manifest.yaml) without editing tracked files in this repo or in adjacent example repos during the validation pass.

If a tutorial is wrong, report the drift. Do not fix the docs or examples during the same validation run unless you were explicitly asked to switch from validation into remediation.

## Inputs

Assume the validator may have access to:

- this docs repo
- the adjacent `../sb-on-demand-examples` repo, when present
- a local shell and local toolchains such as `node`, `bun`, `npm`, `pnpm`, `forge`, `anchor`, `cargo`, `solana`, `sui`, `aptos`, `docker`
- optional wallets, keypairs, API keys, subscriptions, and funded accounts

Treat the manifest as the source of truth for scope and execution mode.

## Validation Contract

Before doing anything else:

1. Read [`tutorial-manifest.yaml`](./tutorial-manifest.yaml).
2. Process every manifest entry exactly once.
3. Assign one terminal status per entry:
   - `pass`
   - `fail`
   - `blocked_external_prereq`
   - `not_applicable`
4. Never silently skip an entry.
5. Never edit docs or examples during the validation run.

Use `blocked_external_prereq`, not `fail`, when the page appears coherent but validation is blocked by missing prerequisites such as secrets, wallets, funded accounts, subscriptions, missing adjacent repos, missing toolchains, or infrastructure you were not approved to modify.

Use `not_applicable` only when the manifest entry explicitly cannot apply to the current checkout or environment and the reason is specific.

## Standard Execution Order

Run entries in this order unless a narrower task tells you otherwise:

1. Confirm required repos and paths exist.
2. Check both worktrees for local changes and preserve them.
3. Validate `static_consistency` entries first.
4. Run `full_exec` entries next.
5. Run `exec_if_prereqs_present` entries after that.
6. Review `manual_external` and `infra_heavy` entries last.
7. Emit one final report covering every manifest entry.

## Safety Rules

- Preserve dirty worktrees. Do not clean them with destructive git commands.
- Do not use `git reset --hard`, `git checkout --`, or similar cleanup.
- If a documented command would modify tracked files, run it from a disposable copy instead of the live workspace.
- If a command dirties the worktree unexpectedly, stop and report it as drift or a blocker instead of silently reverting it.

### Disposable Copy Rule

Some tutorials invoke commands that overwrite tracked files, create vendor directories, or otherwise make the working tree noisy. When that happens, validate from a temporary copy.

Typical examples:

- Sui scripts that copy `Move.testnet.toml` or `Move.mainnet.toml` onto `Move.toml`
- Foundry examples that need `forge install`
- install flows that generate lockfiles or build outputs inside the source tree

Recommended pattern:

```bash
tmpdir="$(mktemp -d)"
rsync -a --exclude '.git' ../sb-on-demand-examples/sui/feeds/basic/ "$tmpdir/"
(cd "$tmpdir" && npm install && npm run build:testnet)
rm -rf "$tmpdir"
```

## Validation Modes

### `full_exec`

Run the listed commands locally and verify the listed success checks.

Use this mode when the tutorial can be validated with local tooling and public network access alone. If the only blocker is a missing local toolchain, record `blocked_external_prereq`.

### `exec_if_prereqs_present`

Run the listed commands only if the required env vars, wallets, keypairs, API credentials, subscriptions, and funded accounts are present.

If any prerequisite is missing, do not guess or fake it. Record `blocked_external_prereq` and name the missing prerequisite explicitly.

### `static_consistency`

Do not claim runtime success. Validate that:

- every referenced path exists
- documented scripts or binaries exist
- code snippets match current package names or APIs where practical
- internal links point to real pages
- the documented flow matches the current repo layout

### `manual_external`

Validate wording, prerequisites, links, and command coherence, but do not pretend to execute browser-only or third-party account flows.

Examples:

- web UI builder flows
- explorer-driven subscription purchase flows
- hosted account setup flows requiring manual approval

### `infra_heavy`

Validate procedural coherence, source repo paths, and command shape only.

Do not perform destructive or long-lived infrastructure changes unless the user explicitly asked for that separate action.

Examples:

- Docker services intended to stay running
- host setup scripts
- Kubernetes installation
- cloud or bare-metal provisioning
- BIOS, kernel, or root-level changes

## Standard Blockers

Record `blocked_external_prereq` when validation depends on any of the following and they are missing:

- missing `../sb-on-demand-examples`
- missing funded wallets or keypairs
- missing private keys or keystore access
- missing active Surge subscription
- missing API credentials
- missing paid access to third-party services
- missing local toolchains such as `docker`, `forge`, `anchor`, `solana`, `sui`, `aptos`
- missing cloud hardware, Kubernetes, root privileges, or BIOS access

## Suggested Session Start

Run these checks before iterating the manifest:

```bash
pwd
git status --short
test -d ../sb-on-demand-examples && git -C ../sb-on-demand-examples status --short
```

If `../sb-on-demand-examples` is missing, continue validating local-only entries and mark example-backed entries `blocked_external_prereq`.

## Final Report Format

Emit a single Markdown table with one row per manifest entry and these exact columns:

| id | status | evidence | blocking_prereq | doc_drift_found | recommended_fix |
|---|---|---|---|---|---|

Field rules:

- `id`: manifest entry id
- `status`: one of the four terminal states
- `evidence`: the command outcome, observed file/path check, or exact reason for the verdict
- `blocking_prereq`: empty on pass/fail unless a blocker explains the result
- `doc_drift_found`: `yes` or `no`
- `recommended_fix`: short, concrete next step

Example:

```md
| solana-basic-price-feed | blocked_external_prereq | `npm run build` succeeded in temp copy; runtime step not attempted | missing funded Solana keypair at `~/.config/solana/id.json` | no | re-run `npm run update -- --feedId ...` after funding the devnet wallet |
```

## Manifest Maintenance

Keep the manifest curated and explicit.

Add a new entry when:

- a new tutorial-like page is added to `SUMMARY.md`
- a reference page becomes procedural enough to validate
- an example repo path or validation mode changes materially

Do not add pure landing pages with no validation surface beyond navigation.

When in doubt, prefer a conservative entry with `static_consistency` over leaving a tutorial-like page untracked.
