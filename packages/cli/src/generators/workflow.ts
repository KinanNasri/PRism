import type { PrismConfig } from "prism-core";

export function generateWorkflow(options: {
  provider: PrismConfig["provider"];
  apiKeyEnv: string;
}): string {
  const secretName = options.apiKeyEnv.replace(/_/g, "_");

  return `name: PRism Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    name: PRism
    runs-on: ubuntu-latest
    if: \${{ !github.event.pull_request.draft }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run PRism
        uses: ./packages/action
        with:
          config_path: prism.config.json
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ${secretName}: \${{ secrets.${secretName} }}
`;
}
