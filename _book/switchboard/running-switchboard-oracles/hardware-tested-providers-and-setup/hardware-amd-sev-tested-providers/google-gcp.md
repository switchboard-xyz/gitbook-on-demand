# Google GCP

### Links

Website: [https://console.cloud.google.com/](https://console.cloud.google.com/)

Product types supporting AMD SEV:

* n2d-standard-8
* n2d-highmem-8

### Process to enable AMD SEV

AMD SEV is already enabled by default on these systems, so no need to do any additional step besides setting it up as usual.

### Notes

You can either use the products above as a standard Virtual Machine and use Docker Compose or Kubernetes or go with their Kubernetes offering (AKS) and select the node server type using the model above.
