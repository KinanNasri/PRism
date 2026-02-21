# Security

If you discover a security vulnerability in PRScope, please report it responsibly.

## Reporting

Email security concerns to the maintainer rather than opening a public issue. Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Scope

PRScope itself does not store or transmit code beyond sending diffs to your configured LLM provider. Security concerns related to your LLM provider's data handling are outside PRScope's scope.

## API keys

- API keys entered during `prscope init` are stored locally in `.env` and added to `.gitignore`
- For GitHub Actions, keys should be stored as repository secrets — never committed to the repo
- PRScope never logs, transmits, or persists API keys beyond the local `.env` file
