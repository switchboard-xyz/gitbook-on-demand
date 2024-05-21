---
description: Installing all dependency apps in Kubernetes in one step.
---

# Dependency apps setup in Kubernetes

At this point, first step is to edit the `00-vars.cfg` file with your favorite editor (`nano`, `vim`, `emacs`, ecc...) and add the data about your cluster.

Next step consists of installing a few dependencies needed to run our application. You can start the installation by running the following command and then keep reading below as it's running:

```
./30-k3s-apps.sh
sleep 10s
./31-infisical-operator.sh
```

It's a good time to remind you that at any moment you can open our scripts to read what they're doing, as all these are just easy, straightforward shellscripts with a few steps that we bundled together for being as convenient as possible.

That said, the script that is running now will install the following components:

* LetsEncrypt JetStack Cert Manager
* NGINX INgress
* Node Feature Discovery and SGX operator
* Infisical Secret Operator
* Victoria Metric Agent

Each of these component serves a specific purpose but feel free to comment them or swap them out if you feel you have a good grasp of their role and feel like you want to take a different approach.

The script above is meant to be idempotent, so you can run it multiple times with no real danger at this point.
