---
description: Install and profit!
---

# Install the Oracle via Helm

Now that the prerequisites are all out of the way, it's just a matter of installing our code via our Helm Chart.

After you've submitted your request to be accepted as an Oracle to the correct queue, you'll have to wait to be accepted. You can proceed with installation, but your Oracle and Guardian will fail to run til they will be accepted to the correct queue.

Once that's take care of, be sure to edit again file `00-vars.cfg` and add your values from the previous step at the end, then run:

```bash
kubectl create namespace switchboard-oracle-[devnet|mainnet]
./99-k8s-oracle-install.sh
```

Common Pitfalls

If you are updating your oracle version and see `Permission Denied: /data/protected_files/` you can safely delete all files in that subdirectory and deploy again

You can verify the installation success by checking the helm deployment status and some of the resources that got deployed

```bash
export NAMESPACE=switchboard-oracle-devnet
helm list
kubectl -n $NAMESPACE get po
kubectl -n $NAMESPACE get svc
kubectl -n $NAMESPACE get ing
kubectl -n $NAMESPACE get secret
```

If all went well, you should see your pods running correctly with no errors in the logs.
