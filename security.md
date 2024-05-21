# Security

## SGX

While Intel's Software Guard Extensions (SGX) might be a relatively new term for some, its security benefits are already a significant part of the technology landscape, quietly enhancing the safety of several everyday applications:

* [Signal app](https://signal.org/blog/private-contact-discovery/) leverages Intel SGX to safeguard your messages, ensuring they remain secure and private.
* [Azure Cloud ](https://techcommunity.microsoft.com/t5/azure-confidential-computing/announcing-microsoft-moves-25-billion-in-credit-card/ba-p/3981180)utilizes SGX to manage and protect credit card data, helping both Azure and its corporate clients maintain [PCI compliant](https://www.pcisecuritystandards.org/).
* [1Password](https://blog.1password.com/using-intels-sgx-to-keep-secrets-even-safer/) employs Intel SGX to encrypt user data across its platforms, adding an extra layer of security to your passwords.
* [Flashbots](https://writings.flashbots.net/block-building-inside-sgx) relies on Intel SGX for the critical task of verifiable block building, enhancing transparency and trust in blockchain operations.

Despite its broad adoption and security prowess, SGX is not without its challenges. Security researchers have identified [vulnerabilities](https://sgx.fail/) through specific memory abuse patterns that can potentially compromise the confidentiality protections SGX aims to provide.&#x20;

In this vein, it is of utmost importance for SGX platforms to diligently manage certificate revocations for chips with identified critical vulnerabilities. This is why Switchboard enforces weekly certificate re-verification for all oracles and guardians, effectively narrowing the window for exploiting known enclave vulnerabilities.

Thus, while leveraging secure enclaves' robust protections, Switchboard boosts resilience with its distributed system, ensuring redundancy in price fetching across the network for enhanced security and reliability.

