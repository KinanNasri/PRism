import type { PrismConfig, ReviewProfile, CommentMode } from "prism-core";

export function generateConfig(options: {
    provider: PrismConfig["provider"];
    model: string;
    apiKeyEnv: string;
    baseUrl?: string;
    profile: ReviewProfile;
    commentMode: CommentMode;
    maxFiles: number;
    maxDiffBytes: number;
}): string {
    const config: Record<string, unknown> = {
        provider: options.provider,
        model: options.model,
        apiKeyEnv: options.apiKeyEnv,
        profile: options.profile,
        commentMode: options.commentMode,
        maxFiles: options.maxFiles,
        maxDiffBytes: options.maxDiffBytes,
    };

    if (options.baseUrl) {
        config.baseUrl = options.baseUrl;
    }

    return JSON.stringify(config, null, 2) + "\n";
}
