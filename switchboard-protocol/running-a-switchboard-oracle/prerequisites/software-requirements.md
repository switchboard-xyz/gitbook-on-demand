---
description: All the software you may need
---

# Software Requirements

In order to maximize reliability and minimize the maintenance effort from an Operator perspective, we're targeting a specific set of technologies that will ease the deployment and routine operations.

Our main software stack revolves around _**Kubernetes**_.

Our stack is set to run on bare-metal and our manual will assume that you're running _**Ubuntu 24.04**._

To host your Oracle on bare-metal using Kubernetes, we provide an easy way to create a one node [k3s](https://k3s.io/) cluster, by just following our step-by-step instructions below, which can be later expanded into a multi-node cluster for maximizing reliability and scalability.

When working with your Kubernetes cluster, these instructions will use a set of standard common tools like `kubectl` and `helm` to manage installation of required application and the Oracle code itself.
