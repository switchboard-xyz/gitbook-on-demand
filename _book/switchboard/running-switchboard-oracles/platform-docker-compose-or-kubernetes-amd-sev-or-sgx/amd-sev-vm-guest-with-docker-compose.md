---
description: Simple and quick installation with Docker Compose
---

# AMD SEV: VM guest with Docker Compose

### Intro

This solution is the most straight-forward one and will allow you to be ready in just a few minutes.

In our tests it only took about 15 minutes to go from zero to running an Oracle if all pieces align and fall in place.

The issue with this setup is, of course, scalability and high availability, meaning that you're only able to run your Oracle on a single host by itself with no protection against hardware or network failure.

Be aware that you need to be on a VM that has AMD SEV already enable and configured.

To check so, run:

```
dmesg | grep -i SEV
```

and you should see something like:

```
AMD Secure Encrypted Virtualization (SEV) active
```

You can also check if you have the correct device on your system:

```
ls -lhtra /dev/sev-guest
```

should return something like:

```
ls -lhtra /dev/sev-guest 
crw------- 1 root root 10, 122 Oct 25 22:55 /dev/sev-guest
```
