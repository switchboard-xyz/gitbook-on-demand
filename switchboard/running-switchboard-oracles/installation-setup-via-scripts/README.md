---
description: Set a solid foundation
---

# Installation: setup via scripts

In this part of the setup we decided to create dedicated sections, each per different "platform" that we envisioned you could be using.

We are now referring to this part of the repository:

```bash
infra-external/
│
└── install/
    │
    ├── bare-metal/
    │   ├── docker/
    │   │   └── ... scripts ...
    │   └── kubernetes/
    │       └── ... scripts ...
    │
    └── cloud/
        └── azure/
            └── ... scripts ...
```

Many of the steps are similar between different platforms, others are specific to only one of them, but in general you should be able to follow the scripts that are named in a way that makes it easy to follow them in numerical order, ie:

```bash
10-sgx-install.sh # this needs to be run before ...
11-sgx-mcu-setup.sh # ... this script
# [...]
40-oracle-ctr-sol.sh # this happens even later in the setup
```

So you just have to `cd` into the directory dedicated to your chosen platform and start following the scripts one by one, in order.

When there's two steps with the same initial number (ie: `60_cfg_enable_devnet.sh` and `60_cfg_enable_mainnet.sh`) it usually means that you may only have to execute one of them, based on your configuration.

Read the output and watch carefully for specific instructions from the script themselves, though usually they will be VERY visible and highlighted like:

```bash
echo " "
echo "==================================================="
echo "=                !!! IMPORTANT !!!                ="
echo "=  COPY/SAVE THE OUTPUT ABOVE, BEFORE PROCEEDING  ="
echo "=  THEN TYPE 'exit' TO LEAVE THIS TMP CONTAINER.  ="
echo "==================================================="
echo " "
```

Should be self-explanatory enough :grimacing: so you should miss any of those instructions.
