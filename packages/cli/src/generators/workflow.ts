import type { PRScopeConfig } from "prscope-core";

export function generateWorkflow(options: {
  provider: PRScopeConfig["provider"];
  apiKeyEnv: string;
}): string {
  const secretName = options.apiKeyEnv;

  return `name: PRScope Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    name: PRScope
    runs-on: ubuntu-latest
    if: \${{ !github.event.pull_request.draft }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run PRScope
        uses: KinanNasri/PRScope@main
        with:
          config_path: prscope.config.json
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ${secretName}: \${{ secrets.${secretName} }}
`;
}
