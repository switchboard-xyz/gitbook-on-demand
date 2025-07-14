---
description: Networking, IPv4, IPv6, possibly DNS and more fun stuff!
---

# Network Requirements

### Intro

Our network setup has minimal requirements:

* 1 public static IPv4 pointing at your server
* port 80 and 443 open and available on the IPv4
* all the usual network requirements needed for Kubernetes
* a DNS record pointing at your IPv4 address (more on this later)

That's it. \
\
IPv6 is supported, just not included in this guide. We plan to include it in this manual in future.

### Custom DNS or use our automagic one: xip.switchboard-oracles.xyz

In our setup, we use DNS to provide a TLS certificate to encrypt communication.

While you can use your custom DNS record, that points to you IPv4 address, in order to avoid unnecessary overload, we introduced the use of SSLIP-based services to achieve the same result.

The way it works is simple: you just craft a DNS name based on your IPv4 and add `xip.switchboard-oracles.xyz` ... as an example if you need to resolve `127.0.0.1` just use:

```
127.0.0.1.xip.switchboard-oracles.xyz
```

this DNS record will always resolve to the IPv4 `127.0.0.1` while also providing a valid DNS result.

This setup works perfectly for our setup and doesn't require you to buy and maintain a set of DNS records just for the Oracle setup.

### Bring you own DNS name

If you decide to go with the solution of using your own custom DNS, before moving forward be sure to create a DNS record that points to your server public IPv4 ( and IPv6 if you have one ) address and verify that it is propagated correctly.

### Firewall and traffic

As mentioned above, at the very minimum your server will need to answer incoming requests on port 80 and 443 for the Oracle to be working correctly.

For outgoing traffic, just allow all connectivity as many network ports are involved in the communication especially in the higher range (>= 30K).
