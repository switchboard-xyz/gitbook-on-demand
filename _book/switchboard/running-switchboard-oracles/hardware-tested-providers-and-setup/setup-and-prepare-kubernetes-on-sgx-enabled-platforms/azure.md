# Azure

### Links

Website: [https://portal.azure.com](https://portal.azure.com/#home)

Product types supporting SGX:

* [DCsv3/DCdsv3-series](https://learn.microsoft.com/en-us/azure/virtual-machines/dcv3-series)

### Process to enable SGX

SGX is already enabled by default on these systems, so no need to do any additional step besides setting it up as usual.

### Notes

Azure supports TEE/SGX via their [confidential compute platforms](https://learn.microsoft.com/en-us/azure/confidential-computing/trusted-execution-environment).

You can either use the products above as a standard Virtual Machine and use Docker Compose or Kubernetes or go with their Kubernetes offering (AKS) and select the node server type using the model above.
