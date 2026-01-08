# Claude Code Guidelines for GitBook On-Demand Docs

## Directory Structure and Navigation

**IMPORTANT:** The directory structure must match the navigation structure defined in `SUMMARY.md`.

When making changes:
- Any change to `SUMMARY.md` navigation paths must be reflected in the actual directory structure
- Any change to directory structure must be reflected in `SUMMARY.md`
- Keep paths consistent between the two

For example, if `SUMMARY.md` shows:
```markdown
* [Solana / SVM](docs-by-chain/solana-svm/README.md)
  * [Price Feeds](docs-by-chain/solana-svm/price-feeds/README.md)
```

Then the directory structure should be:
```
docs-by-chain/
  solana-svm/
    README.md
    price-feeds/
      README.md
```

Do not create `tutorials/` subdirectories unless they appear in `SUMMARY.md`.
