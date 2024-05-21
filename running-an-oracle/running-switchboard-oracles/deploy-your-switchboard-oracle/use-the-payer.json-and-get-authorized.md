---
description: Put funds to good use toward your Oracle!
---

# Use the payer.json and get authorized

## Open the environment and get a new Oracle key

Similar to what we did in the previous step, we need to download a container to run some code for us.

As usual, be sure to enter the directory of the `infra-external/scripts/install` directory that you cloned locally, then run:

```bash
./50-oracle-ctr-sb.sh
```

After jumping in the container run the following command:

```bash
./51-oracle-prepare-request.sh
```

The command above should output some text similar to:

```bash
export QUEUE=FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di
export GUARDIAN_QUEUE=71wi6H1ByDG9qnRd5Ef8PSKoKH8rJ7pve7NDvB7Y4tqi
export STATE=aaaaabbbbbbcccccdddddd...
export PID=aaaaabbbbbbcccccdddddd...
export ORACLE1=aaaaabbbbbbcccccdddddd...
export GUARDIAN_ORACLE1=aaaaabbbbbbcccccdddddd...
```

Be sure to copy all the output and keep it handy for the next step.

## Request your keys to be authorized via our Google Form

In order to have your keys authorized, you'll have to file a request via our Google Form.

Here's the link to reach it, **BE SURE TO FILL IN ALL FIELDS WITH VALID VALUES:**

[**https://forms.gle/2xWwFQ8XPBGu9DRL6**](https://forms.gle/2xWwFQ8XPBGu9DRL6)
