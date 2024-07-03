---
description: The power of Kubernetes on bare metal
---

# Bare Metal with Kubernetes (K3s)

If your team has knowledge about Kubernetes, you should be already aware of the many advantages and power that it provides (scalability, flexibility, great tooling, etc..) so we won't go too deep into this aspects here.

Running Kubernetes on your own hardware provides its own challenges but we found that with just a few hints and settings it's easy to run our Oracle code with no huge effort, provided to have a basic Kubernetes management knowledge.

During our tests, we found that the easiest and most flexible solution to run Kubernetes on bare metal is K3S ([https://k3s.io](https://k3s.io)) and that is what we're using in our instructions but everything should work as well in any other Kubernetes distribution, provided you're able to helm and kubectl to control it and the underlying hardware supports SGX.

WARNING: At the moment our instructions are written for a k3s cluster of only one node, but we plan to soon extend it to be able to fully support a multi node cluster as we have Oracles running correctly in this configuration which takes full advantage of Kubernetes HA and scalability offering.
