---
description: Our infra-external repo intro and structure
---

# Repo Structure

First step is then to clone our `infra-external` github repo locally and `cd` into it:

```bash
git clone https://github.com/switchboard-xyz/infra-external
cd infra-external
```

This repository structure is divided into three main areas:

```bash
infra-external/
│
├── README.md
│
├── cfg/
│   │
│   ├── 00-common-vars.cfg
│   ├── 00-devnet-vars.cfg
│   └── 00-mainnet-vars.cfg
│
├── data/
│   │
│   ├── devnet_payer.json
│   └── mainnet_payer.json
│
└── oracle/
    │
    └── bare-metal/
        └── kubernetes/
            └── ... scripts ...

```

These areas serve as follows:

* `cfg/`: Contains configuration files for two environments, `devnet` and `mainnet` plus a shared one called `common` that contains shared variables that apply to both.\
  You may want to backup this directory at least once or every time you change its content.
* `data/`: Holds essential data files like `devnet_payer.json` and `mainnet_payer.json` needed for setting up the Oracles. May be populated by other directories after setup.\
  You may want to backup this directory at least once or every time you change its content.
* `oracle/`: Includes scripts for setting up Oracles.\
  This directory can be ignored during backups and will change as we update our process.
* `README.md`: it's the README file for the repo, in Markdown format.

Continue to the next section where we'll take care of the configuring files.
