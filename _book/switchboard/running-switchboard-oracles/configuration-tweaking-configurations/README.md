---
description: One process to rule them all
---

# Configuration: Tweaking Configurations

In the previous step we cloned locally the `infra-external` repo, but we're now focusing specifically on this section of the repo:

```bash
infra-external/
│
└── cfg/
    │
    ├── 00-common-vars.cfg
    ├── 00-devnet-vars.cfg
    └── 00-mainnet-vars.cfg

```

You will only have to edit the `00-common-vars.cfg` file and the one targeting the Solana cluster you want your Oracle to work on.

`devnet` is a good place to start and get acquainted with how our Oracle code works but then you can easily reproduce the same setup on `mainnet` at a later moment.

Let's focus on one file at a time.
