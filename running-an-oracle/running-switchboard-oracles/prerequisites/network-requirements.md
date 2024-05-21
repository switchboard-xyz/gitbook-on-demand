---
description: DNS, network, IPv4, IPv6 and more fun stuff!
---

# Network requirements

Your Kubernetes cluster should have a valid DNS record that will be used by the Ingress to identify and reach your Oracle.

Before moving onward be sure to create a DNS record that points to your server public IPv4 ( and IPv6 if you have one ) address.&#x20;

For incoming traffic, at the very minimum your server will need to answer incoming requests on port 80 and 443 for the Ingress to be working.

For outgoing traffic, you'll most likely need a fully working internet connection as during setup many container images and software will need to be downloaed.
