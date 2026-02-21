import * as core from "@actions/core";
import * as github from "@actions/github";
import { loadConfig, resolveConfig, runReview, renderFallbackComment } from "prscope-core";
import type { PRScopeConfig } from "prscope-core";
import { getPullRequestContext, fetchPullRequestFiles, upsertComment } from "./github.js";

async function run(): Promise<void> {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) throw new Error("GITHUB_TOKEN is required");

        const configPath = core.getInput("config_path");
        let config: PRScopeConfig;

        try {
            config = await loadConfig(process.cwd());
        } catch {
            const provider = core.getInput("provider");
            const model = core.getInput("model");
            const apiKeyEnv = core.getInput("api_key_env");

            if (!provider || !model || !apiKeyEnv) {
                throw new Error(
                    "No prscope.config.json found and required inputs (provider, model, api_key_env) are missing.",
                );
            }

            config = resolveConfig({
                provider: provider as PRScopeConfig["provider"],
                model,
                apiKeyEnv,
                baseUrl: core.getInput("base_url") || undefined,
                profile: (core.getInput("profile") || "balanced") as PRScopeConfig["profile"],
                commentMode: (core.getInput("comment_mode") || "summary-only") as PRScopeConfig["commentMode"],
                maxFiles: parseInt(core.getInput("max_files") || "30", 10),
                maxDiffBytes: parseInt(core.getInput("max_diff_bytes") || "100000", 10),
                configPath: configPath || undefined,
            });
        }

        const octokit = github.getOctokit(token);
        const ctx = getPullRequestContext();
        const files = await fetchPullRequestFiles(octokit, ctx);

        core.info(`Reviewing ${files.length} files with ${config.provider}/${config.model}`);

        const comment = await runReview(config, files);
        await upsertComment(octokit, ctx, comment);

        core.info("Review posted.");
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        core.setFailed(message);

        try {
            const token = process.env.GITHUB_TOKEN;
            if (token) {
                const octokit = github.getOctokit(token);
                const ctx = getPullRequestContext();
                await upsertComment(octokit, ctx, renderFallbackComment(message));
            }
        } catch {
            // couldn't post fallback comment
        }
    }
}

run();
