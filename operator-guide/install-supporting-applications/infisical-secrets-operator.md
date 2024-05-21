---
description: Keep your secrets... secret and protected with Infisical Operator
---

# Infisical Secrets Operator

Your new installation will boast a number of secrets been used by your running Oracle and keep them safe and far from unauthorized eyes is a topmost priority to ensure your Oracle will run in a safe way.

[Infisical](https://infisical.com/) is a software company that published an [open source solution](https://github.com/Infisical/infisical) that you can self-host or use through their PaaS.

In this guide we'll cover how to install their Kubernetes plugin Operator and use their PaaS to keep your secrets safe.

While going through the next steps, keep in mind that the upcoming new values will be needed in the next steps, when you'll have to fill in the file `00-vars.cfg`.

Here's a guide from the Infisical documentation on Secrets creation [https://infisical.com/docs/documentation/platform/organization](https://infisical.com/docs/documentation/platform/organization), but in essence you need to create a new environment (say `dev`), this is your `INFISICAL_SLUG`.\
Then create you need to create a folder (say `/test-cluster/`), this is your `INFISICAL_SECRETS_PATH`. If you don't create one, this value will simply be `/` in your case.

Now create a Secret called `SOLANA_KEY` and leave it empty for now.

It's important to note that this Secret will contain your Solana Account and it's fundamental to keep it actually secret, as the name implies.

Next you want to create an Access Token. To create one you can follow their documentation at the following link [https://infisical.com/docs/documentation/platform/token](https://infisical.com/docs/documentation/platform/token) and if you created a folder above, be sure to only give it access to secrets under that folder as READ-ONLY.

This Access Token (that starts with `st....` ) is your `INFISICAL_ACCESS_TOKEN`.
