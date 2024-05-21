---
description: >-
  Secure computing through SGX is a core tenant of our workflow, this is our
  setup guide
---

# SGX libs and SGX Kubernetes Operator

As mentioned in the [hardware-requirements-+-sgx.md](../prerequisites/hardware-requirements-+-sgx.md "mention") section, in our architecture we use [Intel SGX](https://en.wikipedia.org/wiki/Software\_Guard\_Extensions) as a [TEE (Trusted Execution Environment)](https://en.wikipedia.org/wiki/Trusted\_execution\_environment) to keep your code execution safe and secure.

Running a Kubernetes cluster with SGX enabled requires both hardware support and software support, both at the OS level and in the cluster itself.

To confirm successful installation of the SGX operator, you can run the following command and should see a similar result

```bash
kubectl get node -o yaml | grep "epc"
      # nfd.node.kubernetes.io/extended-resources: sgx.intel.com/epc
      # sgx.intel.com/epc: "396361728"
```
