# Trusted Execution Environments (TEEs)

Switchboard enhances its security model with Trusted Execution Environments. Instead of relying solely on the assumption that the majority of oracles are honest (“honest-majority”), we use TEEs like AMD Secure Encrypted Virtualisation (AMD SEV) and Intel Software Guard Extensions (Intel SGX) for added protection.

Think of TEEs as secure enclaves where code can run in isolation, protected from the rest of the system. This means:

* **Code Verification:** Switchboard can cryptographically verify that each oracle node acting as a publisher is running _only_ the approved and verified code. No rogue modifications allowed.
* **Data Integrity:** This verification process ensures the integrity of the data being provided, as the code responsible for fetching and signing data hasn't been tampered with.

In essence, TEEs provide a hardware-backed guarantee of code integrity, offering a robust defence against malicious actors and further bolstering the reliability of Switchboard's data feeds on-chain.

***

### **TEE Applications and Considerations**

TEEs are generally overlooked, but they are used by many of the most popular applications that are synonymous with security and safety.

* [Signal app](https://signal.org/blog/private-contact-discovery/) uses TEEs to safeguard its users' messages, guaranteeing they remain secure and private.
* [Azure Cloud](https://techcommunity.microsoft.com/t5/azure-confidential-computing/announcing-microsoft-moves-25-billion-in-credit-card/ba-p/3981180) (Microsoft) leverages TEEs, to ensure top-tier credit card data management and protection, so both Azure and its corporate clients can maintain optimum [PCI compliance](https://www.pcisecuritystandards.org/).
* [1Password](https://blog.1password.com/using-intels-sgx-to-keep-secrets-even-safer/) employs TEEs (across a host of its platforms), adding extra layers of security to a user’s passwords.
* [Flashbots](https://writings.flashbots.net/block-building-inside-sgx) relies on TEEs as an integral tool in verifiable block operations, so trust and integrity will be maintained within blockchain operations.

Because TEEs are not perfect and can have undocumented security flaws, Switchboard needs to have a system in place to quickly shut down or upgrade any oracle. To stay on top of this, Switchboard makes all oracles prove they’re still trustworthy by re-verifying their certificates and also uses economic incentives to help ensure integrity.&#x20;
