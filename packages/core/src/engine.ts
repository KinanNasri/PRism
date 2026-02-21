import type { PRScopeConfig, ReviewResult, PullRequestFile } from "./types.js";
import { createProvider } from "./providers/factory.js";
import { prepareDiffs } from "./diff.js";
import { buildPrompt } from "./prompt.js";
import { parseReviewResult } from "./schema.js";
import { renderComment, renderFallbackComment } from "./renderer.js";

export async function runReview(config: PRScopeConfig, files: PullRequestFile[]): Promise<string> {
    if (files.length === 0) {
        return renderComment({
            summary: "This PR has no reviewable file changes.",
            overall_risk: "low",
            findings: [],
            praise: [],
        });
    }

    const { filtered } = prepareDiffs(files, config.maxFiles, config.maxDiffBytes);

    if (filtered.length === 0) {
        return renderComment({
            summary: "All changed files were filtered out (lockfiles, build artifacts, binaries). Nothing to review.",
            overall_risk: "low",
            findings: [],
            praise: [],
        });
    }

    const provider = createProvider(config);
    const messages = buildPrompt(filtered, config);
    const raw = await provider.chat(messages);

    try {
        const cleaned = extractJson(raw);
        const result: ReviewResult = parseReviewResult(JSON.parse(cleaned));
        return renderComment(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return renderFallbackComment(`Schema validation failed: ${message}`);
    }
}

function extractJson(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) return fenced[1].trim();

    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
        return text.slice(braceStart, braceEnd + 1);
    }

    return text.trim();
}
