---
description: Setup nginx Ingress for our Kubernetes cluster
---

# Ingress

Setting up a working Ingress takes a little bit of network knowledge, Linux system administration and basic Kubernetes knowledge. This guide assumes that there's a working DNS record set pointing to your cluster and already successfully propageted, as that is going to be needed later in the setup.

One of the awesome aspects of Kubernetes is how well everything integrates and how each piece complement with the others.

One of this synergies is how Ingress and Cert-manager cooperate to create a working HTTPs entrypoint in your cluster by exposing an HTTP+TLS endpoint.

To test that it's actually working as intended, below here's a quick _"hello-world"-ish test_ script that can validate if everything is working as intended:

<pre class="language-bash"><code class="lang-bash"><strong>./32-test-cert-setup.sh
</strong></code></pre>

If the above works correctly and creates a valid LetsEncrypt STAGING certificate (you can check using your browser), you can move on and change the cluster issuer from `letsencrypt-staging-http` to `letsencrypt-prod-http` to generate a valid LetsEncrypt regular certificate.\
Using staging certificate initially is a good habit as LetsEncrypt will rate limite creation of certificates and spamming them with requests of invalid certs is a good way to get rate limited.

Once done with the tests above, you can go ahead and cancel the test by running:

```bash
./33-test-cert-cleanup.sh
```
