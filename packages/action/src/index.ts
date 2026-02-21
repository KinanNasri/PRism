import * as core from "@actions/core";
import * as github from "@actions/github";
import { loadConfig, resolveConfig, runReview, renderFallbackComment } from "prism-core";
import type { PrismConfig } from "prism-core";
import { getPullRequestContext, fetchPullRequestFiles, upsertComment } from "./github.js";

async function run(): Promise<void> {
    const ctx = getPullRequestContext();

    if (!ctx) {
        core.info("Not a pull request event — skipping PRism review.");
        return;
    }

    const config = await buildConfig();
    core.info(`PRism reviewing PR #${ctx.pullNumber} with ${config.provider}/${config.model}`);

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        core.setFailed("GITHUB_TOKEN is required.");
        return;
    }

    const octokit = github.getOctokit(token);
    const files = await fetchPullRequestFiles(octokit, ctx);

    core.info(`Found ${files.length} changed files`);

    try {
        const result = await runReview(config, files);
        core.info(`Review complete — risk: ${result.review?.overall_risk ?? "unknown"}`);

        if (result.review) {
            core.info(`Findings: ${result.review.findings.length}`);
        }

        await upsertComment(octokit, ctx, result.comment);
        core.info("Comment posted successfully.");
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        core.warning(`Review failed: ${message}`);

        const fallback = renderFallbackComment(message);
        await upsertComment(octokit, ctx, fallback);
    }
}

async function buildConfig(): Promise<PrismConfig> {
    const configPath = core.getInput("config_path");

    const inputOverrides: Partial<PrismConfig> = {};

    const provider = core.getInput("provider");
    if (provider) inputOverrides.provider = provider as PrismConfig["provider"];

    const model = core.getInput("model");
    if (model) inputOverrides.model = model;

    const apiKeyEnv = core.getInput("api_key_env");
    if (apiKeyEnv) inputOverrides.apiKeyEnv = apiKeyEnv;

    const baseUrl = core.getInput("base_url");
    if (baseUrl) inputOverrides.baseUrl = baseUrl;

    const profile = core.getInput("profile");
    if (profile) inputOverrides.profile = profile as PrismConfig["profile"];

    const commentMode = core.getInput("comment_mode");
    if (commentMode) inputOverrides.commentMode = commentMode as PrismConfig["commentMode"];

    const maxFiles = core.getInput("max_files");
    if (maxFiles) inputOverrides.maxFiles = parseInt(maxFiles, 10);

    const maxDiffBytes = core.getInput("max_diff_bytes");
    if (maxDiffBytes) inputOverrides.maxDiffBytes = parseInt(maxDiffBytes, 10);

    try {
        const fileConfig = await loadConfig(
            configPath ? configPath : process.cwd(),
        );
        return resolveConfig(inputOverrides, fileConfig);
    } catch {
        if (Object.keys(inputOverrides).length > 0 && inputOverrides.provider && inputOverrides.model && inputOverrides.apiKeyEnv) {
            return resolveConfig(inputOverrides);
        }
        throw new Error(
            "No config found. Either provide a prism.config.json or pass required inputs (provider, model, api_key_env).",
        );
    }
}

run().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(message);
});
