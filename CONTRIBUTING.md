# Contributing to PRScope

Thanks for your interest in contributing.

## Setup

```bash
git clone https://github.com/KinanNasri/PRScope.git
cd PRScope
pnpm install
pnpm run build
```

## Development

The project is a pnpm monorepo with three packages:

- `packages/core` — Review engine, diff parsing, LLM providers, schema validation
- `packages/cli` — The `prscope` CLI (interactive setup wizard)
- `packages/action` — GitHub Action wrapper

### Building

```bash
pnpm run build        # builds all packages
pnpm run test         # runs all tests
pnpm run typecheck    # checks types across all packages
```

### Testing

```bash
cd packages/core
pnpm run test
```

## Pull requests

- Keep changes focused — one concern per PR
- Add tests for new functionality
- Make sure `pnpm run build` and `pnpm run test` pass before submitting
- Use clear commit messages

## Reporting issues

Open an issue on [GitHub](https://github.com/KinanNasri/PRScope/issues). Include:

- What you expected
- What happened
- Steps to reproduce
- Your Node.js version and OS
