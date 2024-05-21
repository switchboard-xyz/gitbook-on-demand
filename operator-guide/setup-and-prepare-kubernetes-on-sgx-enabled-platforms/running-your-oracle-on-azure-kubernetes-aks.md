---
description: Basic setup steps to create an Azure AKS Kubernetes infrastructure.
---

# Running your Oracle on Azure Kubernetes (AKS)

Hosting on Azure will allow for minimal maintenance effort while leveraging Microsoft's infrastructure assistance and flexibility.&#x20;

## Intro

Once you have created an AKS cluster using a machine type that supports SGX (ex: DCsv3) be sure to enable SGX with the following command:

```
az aks enable-addons --addons confcom --name $TARGET_CLUSTER --resource-group $RESOURCE_GROUP
```
