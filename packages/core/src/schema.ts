import { z } from "zod";
import type { PRScopeConfig, ReviewResult } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

export const ReviewResultSchema = z.object({
    summary: z.string().min(1),
    overall_risk: z.enum(["low", "medium", "high"]),
    findings: z.array(
        z.object({
            file: z.string(),
            line: z.number().nullable(),
            severity: z.enum(["low", "medium", "high"]),
            category: z.enum(["bug", "security", "performance", "maintainability", "dx"]),
            title: z.string().min(1),
            message: z.string().min(1),
            suggestion: z.string().default(""),
            confidence: z.number().min(0).max(1),
        }),
    ),
    praise: z.array(z.string()),
});

export const PRScopeConfigSchema = z.object({
    provider: z.enum(["openai", "anthropic", "openai-compat", "ollama"]),
    model: z.string().min(1),
    apiKeyEnv: z.string().min(1),
    baseUrl: z.string().optional(),
    profile: z.enum(["balanced", "security", "performance", "strict"]).default("balanced"),
    commentMode: z.enum(["summary-only", "inline+summary"]).default("summary-only"),
    maxFiles: z.number().int().positive().default(DEFAULT_CONFIG.maxFiles),
    maxDiffBytes: z.number().int().positive().default(DEFAULT_CONFIG.maxDiffBytes),
    configPath: z.string().optional(),
});

export function parseReviewResult(data: unknown): ReviewResult {
    return ReviewResultSchema.parse(data);
}

export function parseConfig(data: unknown): PRScopeConfig {
    return PRScopeConfigSchema.parse(data);
}
