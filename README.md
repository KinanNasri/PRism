
# PRScope

**AI-powered code reviews that actually help.**
<img width="647" height="700" alt="image" src="https://github.com/user-attachments/assets/5b3ae721-1ae5-43ba-a85e-3308bef0d783" />

Stop waiting days for human reviewers to point out an unvalidated input six files deep.
PRScope reads your diffs, understands context, and posts structured findings — directly on your pull request in under a minute.

[![npm](https://img.shields.io/npm/v/prscope?color=blue&label=npm)](https://www.npmjs.com/package/prscope)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## What it does

You open a pull request. PRScope:

1. Reads the diff
2. Sends it to your chosen LLM (OpenAI, Anthropic, Ollama, or any OpenAI-compatible endpoint)
3. Posts a structured review comment with severity ratings, risk assessment, and concrete suggestions

That's it. No dashboards. No sign-ups. No vendor lock-in. Your API key, your model, your rules.

---

## 30-second setup

```bash
npx prscope init
```

The wizard walks you through everything:

- Pick a provider (OpenAI, Anthropic, Ollama, or self-hosted)
- Paste your API key (stored locally in `.env`, never committed)
- Choose a model from a live list or curated defaults
- Set your review profile (balanced, security-focused, performance-focused, or strict)

It generates two files:

| File | Purpose |
|------|---------|
| `prscope.config.json` | Review settings — provider, model, profile, limits |
| `.github/workflows/prscope.yml` | GitHub Action that runs on every PR |

Commit both. Add your API key to **GitHub Secrets** (Settings > Secrets > Actions). Done.

Next time someone opens a PR, PRScope reviews it automatically.

---

## What a review looks like

PRScope posts a single comment on your PR with:

- **Risk assessment** — low, medium, or high, based on what changed
- **Findings table** — severity, category, file location, one-line title for each issue
- **Detailed breakdown** — collapsible section with full explanations and fix suggestions
- **Praise** — what was done well (because reviews shouldn't only be negative)

Everything is Markdown. No images, no external links, no JavaScript. Just a clean, readable comment that works on any GitHub plan.

---

## Supported providers

| Provider | Models | Setup |
|----------|--------|-------|
| **OpenAI** | GPT-4.1, o3, o4-mini, GPT-4o | `OPENAI_API_KEY` secret |
| **Anthropic** | Claude Sonnet 4, Claude 3.7, Claude 3.5 | `ANTHROPIC_API_KEY` secret |
| **Ollama** | Llama 3.3, Qwen 2.5, DeepSeek, Codestral | Local — no key needed |
| **OpenAI-compatible** | Any model behind a `/v1/chat/completions` endpoint | Custom base URL + key |

If your provider speaks the OpenAI API protocol, PRScope supports it. LM Studio, vLLM, Together, Groq — all work out of the box.

---

## Review profiles

Control how aggressive the review is:

| Profile | What it catches |
|---------|----------------|
| `balanced` | Bugs, security issues, performance, code quality — practical defaults |
| `security` | Injection attacks, auth flaws, data exposure, insecure defaults |
| `performance` | Memory leaks, unnecessary allocations, algorithmic issues |
| `strict` | Everything. Style, naming, docs, edge cases. Nothing gets through |

Set once in `prscope.config.json`. Change anytime.

---

## Configuration

All settings live in `prscope.config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4.1",
  "apiKeyEnv": "OPENAI_API_KEY",
  "profile": "balanced",
  "commentMode": "summary-only",
  "maxFiles": 30,
  "maxDiffBytes": 100000
}
```

| Field | What it controls |
|-------|-----------------|
| `provider` | `openai`, `anthropic`, `openai-compat`, `ollama` |
| `model` | The model ID to use |
| `apiKeyEnv` | Name of the env var / secret holding your API key |
| `profile` | Review intensity — `balanced`, `security`, `performance`, `strict` |
| `commentMode` | `summary-only` (one comment) or `inline+summary` |
| `maxFiles` | Skip PRs that touch more files than this |
| `maxDiffBytes` | Total diff budget — large diffs get truncated, not skipped |

---

## How it works under the hood

```
PR opened → GitHub Action triggers → PRScope reads diff
    ↓
Filters noise (lockfiles, build artifacts, binaries)
    ↓
Builds a structured prompt with your review profile
    ↓
Sends to your LLM → parses structured JSON response
    ↓
Validates output against a strict schema (Zod)
    ↓
Renders a clean Markdown comment → posts to PR
```

PRScope never stores your code. The diff goes to your chosen LLM provider and nowhere else. If you use Ollama, everything stays on your machine.

---

## Using as a GitHub Action directly

If you prefer to set up the action manually instead of using `npx prscope init`:

```yaml
name: PRScope Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    if: ${{ !github.event.pull_request.draft }}
    steps:
      - uses: actions/checkout@v4
      - uses: KinanNasri/PRScope@main
        with:
          config_path: prscope.config.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## Project structure

```
packages/
  core/     Review engine, diff parsing, LLM providers, Markdown renderer
  cli/      The `prscope` command — interactive setup wizard
  action/   GitHub Action wrapper
```

---

## Contributing

PRScope is open source under the MIT license. Issues and PRs are welcome.

```bash
git clone https://github.com/KinanNasri/PRScope.git
cd PRScope
pnpm install
pnpm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT — do whatever you want with it.
