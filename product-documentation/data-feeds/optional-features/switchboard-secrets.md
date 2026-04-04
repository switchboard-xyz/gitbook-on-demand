---
title: Switchboard Secrets
description: Securely manage API keys and other sensitive values for Switchboard feeds using the hosted Secrets app or a self-hosted secrets server.
---

# Switchboard Secrets

Switchboard Secrets lets you store sensitive values such as API keys, auth headers, and private configuration outside your feed definition, then retrieve them at runtime inside a secure execution environment.

## Why use Switchboard Secrets?

- **Keep secrets out of shared job definitions:** Your feed logic can stay public while credentials remain private.
- **Use authenticated APIs safely:** Inject API keys or tokens only at runtime.
- **Support hosted or self-hosted workflows:** You can use the hosted Switchboard Secrets app or run your own secrets server.

## How it fits into a feed

Secrets are typically loaded with [`SecretsTask`](../../../custom-feeds/task-types.md#secretstask), then referenced via variable expansion in downstream tasks.

Common pattern:

1. Create a user profile for your wallet on the secrets server.
2. Add one or more named secrets to that profile.
3. Add a `SecretsTask` near the top of your job.
4. Use `${SECRET_NAME}` in later tasks where authentication values are needed.
5. Whitelist the measurement / MrEnclave values that should be allowed to access that secret.

For a practical walkthrough, see [Build with TypeScript](../../../custom-feeds/build-and-deploy-feed/build-with-typescript.md#secretstask) and the full [Task Types Reference](../../../custom-feeds/task-types.md#secretstask).

## Hosted vs self-hosted

You have two ways to use Switchboard Secrets:

### Hosted Secrets app

Use the hosted app to create and manage secrets associated with your wallet:

- [Secrets App](https://secrets.switchboard.xyz/connect)

This is the fastest path if you want a managed interface for creating secrets.

### Self-hosted secrets server

If you want full control over storage and operations, you can self-host the secrets server:

- [Secrets server source in `sbv3`](https://github.com/switchboard-xyz/sbv3/tree/main/apps/secrets-server)

The `sbv3` secrets server README also documents the hosted app and self-hosted flow.

## Example and SDK references

- [Secrets example repository](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sb-on-demand-secret/sb-on-demand-secrets)
- [Switchboard on-demand Rust crate](https://crates.io/crates/switchboard-on-demand)
- [@switchboard-xyz/on-demand on npm](https://www.npmjs.com/package/@switchboard-xyz/on-demand)

## Related docs

- [Build with TypeScript](../../../custom-feeds/build-and-deploy-feed/build-with-typescript.md)
- [Task Types Reference](../../../custom-feeds/task-types.md)
- [Data Feed Variable Overrides](../../../custom-feeds/advanced-feed-configuration/data-feed-variable-overrides.md)
