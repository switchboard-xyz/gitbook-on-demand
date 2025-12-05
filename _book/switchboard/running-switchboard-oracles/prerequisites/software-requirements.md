---
description: All the software you may need
---

# Software Requirements

In order to maximize reliability and minimize the maintenance effort from an Operator perspective, we're targeting a specific set of technologies that will ease the deployment and routine operations.

Our main software stack revolves around Docker containers and thus we identified two solutions, based either on **Docker Compose** or on _**Kubernetes**_.

If you decide to self-host on bare-metal, our manual will assume that you're running _**Ubuntu 22.04**._

From a clean OS you'll have to install the SGX libraries and software, regardless of your decision to go with Docker Compose or Kubernetes.

For the simplest and fastest solution, we advise using Docker Compose that will get you up and ready in a matter of minutes, at the expense of sacrificing some potential future scalability and HA.

If you decide to host your Oracle on bare-metal using Kubernetes, we provide an easy way to create a one node [k3s](https://k3s.io/) cluster, by just following our step-by-step instructions below, which can be later expanded into a multi-node cluster for maximizing reliability and scalability.

When working with your Kubernetes cluster, these instructions will use a set of standard common tools like `kubectl` and `helm` to manage installation of required application and the Oracle code itself.
