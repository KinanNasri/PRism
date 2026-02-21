import type { PRScopeConfig } from "../types.js";
import { createOpenAIProvider } from "./openai.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createOpenAICompatProvider } from "./openai-compat.js";
import { createOllamaProvider } from "./ollama.js";
import type { ChatProvider } from "./types.js";

export function createProvider(config: PRScopeConfig): ChatProvider {
    const apiKey = process.env[config.apiKeyEnv] ?? "";

    switch (config.provider) {
        case "openai":
            return createOpenAIProvider({
                apiKey,
                baseUrl: config.baseUrl ?? "https://api.openai.com",
                model: config.model,
            });

        case "anthropic":
            return createAnthropicProvider({
                apiKey,
                model: config.model,
            });

        case "openai-compat":
            return createOpenAICompatProvider({
                apiKey,
                baseUrl: config.baseUrl ?? "http://localhost:1234",
                model: config.model,
            });

        case "ollama":
            return createOllamaProvider({
                host: config.baseUrl ?? "http://localhost:11434",
                model: config.model,
            });

        default: {
            const _exhaustive: never = config.provider;
            throw new Error(`Unknown provider: ${_exhaustive}`);
        }
    }
}
