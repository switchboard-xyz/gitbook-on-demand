# Software requirements

In order to maximize reliability and minimize the maintenance effort from an Operator perspective, we're targeting a specific set of technologies that will ease the deployment and routine operations.

Our main software stack revolves around a running _**Kubernetes cluster**_ with the _**SGX operator**_ installed.

If you decide to self-host on bare-metal, our manual will assume that you're running _**Ubuntu 22.04**_ with a Kubernetes cluster installed by using [k3s](https://k3s.io/)/[k3sup](https://k3sup.dev/) and following our instructions below.

Along with a working Kubernetes cluster, these instructions will use a set of standard common tools used along Kubernetes like `kubectl` and `helm` to manage installation of required application and the Oracle code itself.
