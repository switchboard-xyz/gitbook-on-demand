---
description: Set a solid foundation
---

# Installation: Setup Via Scripts

In this part of the setup we decided to create dedicated sections, each per different "platform" that we envisioned you could be using.

We are now referring to this part of the repository:

```bash
infra-external/
│
└── oracle/
    │
    └── bare-metal/
        └── kubernetes/
            └── ... scripts ...
```

Many of the steps are similar between different platforms, others are specific to only one of them, but in general you should be able to follow the scripts that are named in a way that makes it easy to follow them in numerical order, ie:

```bash
00-kernel-install.sh # absolutely FIRST step
# [...]
30-k3s-install.sh # then this needs to be run before ...
31-k3s-sail-setup.sh # ... this script but ...
# [...]
70-k8s-apps-cert-manager.sh # ... this happens even 
                            # later in the setup!
# [...]
90-k8s-oracle-install.sh # this is usually 
                         # the last step you'll run
```

So you just have to `cd` into the directory dedicated to your chosen platform and start following the scripts one by one, in order.

Read the output and watch carefully for specific instructions from the script themselves, though usually they will be VERY visible and highlighted like:

```
===================================================
=                !!! IMPORTANT !!!                =
=  COPY/SAVE THE OUTPUT ABOVE, BEFORE PROCEEDING  =
=  THEN TYPE 'exit' TO LEAVE THIS TMP CONTAINER.  =
===================================================
```

Should be self-explanatory enough :grimacing: so you should just be able to follow scripts in numerical order.
