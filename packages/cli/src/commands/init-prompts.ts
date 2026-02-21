import { select, input, search, confirm, password } from "@inquirer/prompts";
import type { ProviderType, ReviewProfile, CommentMode, ModelInfo } from "prism-core";

const OPENAI_MODELS: ModelInfo[] = [
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "o3", name: "o3" },
    { id: "o3-mini", name: "o3 Mini" },
    { id: "o4-mini", name: "o4 Mini" },
];

const ANTHROPIC_MODELS: ModelInfo[] = [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    { id: "claude-haiku-4-20250514", name: "Claude Haiku 4" },
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
];

const OLLAMA_MODELS: ModelInfo[] = [
    { id: "llama3.3:70b", name: "Llama 3.3 70B" },
    { id: "llama3.2:8b", name: "Llama 3.2 8B" },
    { id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B" },
    { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder 7B" },
    { id: "deepseek-r1:14b", name: "DeepSeek R1 14B" },
    { id: "deepseek-coder-v2:16b", name: "DeepSeek Coder V2 16B" },
    { id: "codestral:22b", name: "Codestral 22B" },
    { id: "mistral-small:22b", name: "Mistral Small 22B" },
];

export function getFallbackModels(provider: ProviderType): ModelInfo[] {
    switch (provider) {
        case "openai": return OPENAI_MODELS;
        case "anthropic": return ANTHROPIC_MODELS;
        case "ollama": return OLLAMA_MODELS;
        case "openai-compat": return [];
    }
}

export async function askProvider(): Promise<ProviderType> {
    return select({
        message: "Which LLM provider do you want to use?",
        choices: [
            { name: "OpenAI", value: "openai" as const, description: "GPT-4.1, o3, o4-mini" },
            { name: "Anthropic", value: "anthropic" as const, description: "Claude Sonnet 4, Claude 3.7" },
            { name: "OpenAI-compatible", value: "openai-compat" as const, description: "LM Studio, vLLM, or any /v1/chat/completions endpoint" },
            { name: "Ollama", value: "ollama" as const, description: "Local models via Ollama" },
        ],
    });
}

export async function askApiKeyEnv(provider: ProviderType): Promise<string> {
    const defaults: Record<ProviderType, string> = {
        openai: "OPENAI_API_KEY",
        anthropic: "ANTHROPIC_API_KEY",
        "openai-compat": "LLM_API_KEY",
        ollama: "OLLAMA_HOST",
    };

    return input({
        message: "Environment variable name for your API key:",
        default: defaults[provider],
    });
}

export async function askApiKeyForFetch(provider: ProviderType, apiKeyEnv: string): Promise<string> {
    if (provider === "ollama") return "";

    const existing = process.env[apiKeyEnv];
    if (existing) return existing;

    const wantsFetch = await confirm({
        message: "Provide your API key now to auto-detect available models?",
        default: true,
    });

    if (!wantsFetch) return "";

    return password({
        message: "API key (used only for model detection, not stored):",
        mask: "*",
    });
}

export async function askBaseUrl(provider: ProviderType): Promise<string | undefined> {
    const defaults: Record<string, string> = {
        openai: "https://api.openai.com",
        "openai-compat": "http://localhost:1234",
        ollama: "http://localhost:11434",
    };

    if (provider === "anthropic") return undefined;

    const defaultUrl = defaults[provider];
    const needsUrl = provider === "openai-compat" || provider === "ollama";

    if (!needsUrl) {
        const customize = await confirm({
            message: "Do you want to use a custom base URL?",
            default: false,
        });
        if (!customize) return defaultUrl;
    }

    return input({
        message: "Base URL for the API:",
        default: defaultUrl,
    });
}

export async function askModelFromList(models: ModelInfo[]): Promise<string> {
    const choices = models.map((m) => ({
        name: m.name !== m.id ? `${m.name} (${m.id})` : m.id,
        value: m.id,
    }));

    choices.push({ name: "Enter manually", value: "__manual__" });

    const result = await search({
        message: "Search and select a model:",
        source: (term) => {
            if (!term) return choices;
            const lower = term.toLowerCase();
            return choices.filter(
                (c) => c.name.toLowerCase().includes(lower) || c.value.toLowerCase().includes(lower),
            );
        },
    });

    if (result === "__manual__") return askModelManual();
    return result;
}

export async function askModelManual(): Promise<string> {
    return input({
        message: "Enter model name:",
        validate: (v) => (v.trim().length > 0 ? true : "Model name is required"),
    });
}

export async function askProfile(): Promise<ReviewProfile> {
    return select({
        message: "Review profile:",
        choices: [
            { name: "Balanced", value: "balanced" as const, description: "Bugs, security, performance, and quality" },
            { name: "Security-focused", value: "security" as const, description: "Prioritize security vulnerabilities" },
            { name: "Performance-focused", value: "performance" as const, description: "Prioritize performance issues" },
            { name: "Strict", value: "strict" as const, description: "Maximum scrutiny on everything" },
        ],
    });
}

export async function askCommentMode(): Promise<CommentMode> {
    return select({
        message: "Comment mode:",
        choices: [
            { name: "Summary only", value: "summary-only" as const, description: "One top-level PR comment" },
            { name: "Inline + Summary", value: "inline+summary" as const, description: "Inline comments plus summary" },
        ],
    });
}

export async function askMaxFiles(): Promise<number> {
    const result = await input({
        message: "Max files to review per PR:",
        default: "30",
        validate: (v) => {
            const n = parseInt(v, 10);
            return n > 0 ? true : "Must be a positive number";
        },
    });
    return parseInt(result, 10);
}

export async function askMaxDiffBytes(): Promise<number> {
    const result = await input({
        message: "Max total diff size (bytes):",
        default: "100000",
        validate: (v) => {
            const n = parseInt(v, 10);
            return n > 0 ? true : "Must be a positive number";
        },
    });
    return parseInt(result, 10);
}
