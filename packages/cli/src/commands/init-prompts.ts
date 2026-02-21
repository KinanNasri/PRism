import { select, input, search, confirm } from "@inquirer/prompts";
import type { ProviderType, ReviewProfile, CommentMode, ModelInfo } from "prism-core";

export async function askProvider(): Promise<ProviderType> {
    return select({
        message: "Which LLM provider do you want to use?",
        choices: [
            { name: "OpenAI", value: "openai" as const, description: "GPT-4o, o1, o3-mini via OpenAI API" },
            { name: "Anthropic", value: "anthropic" as const, description: "Claude 3.5/4 via Anthropic API" },
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
    if (models.length === 0) {
        return askModelManual();
    }

    const useList = await confirm({
        message: `Found ${models.length} available models. Select from list?`,
        default: true,
    });

    if (!useList) return askModelManual();

    const choices = models.map((m) => ({
        name: m.name !== m.id ? `${m.name} (${m.id})` : m.id,
        value: m.id,
    }));

    return search({
        message: "Search and select a model:",
        source: (term) => {
            if (!term) return choices;
            const lower = term.toLowerCase();
            return choices.filter(
                (c) => c.name.toLowerCase().includes(lower) || c.value.toLowerCase().includes(lower),
            );
        },
    });
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
