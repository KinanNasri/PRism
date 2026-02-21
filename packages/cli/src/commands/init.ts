import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import {
    createOpenAIProvider,
    createAnthropicProvider,
    createOpenAICompatProvider,
    createOllamaProvider,
} from "prism-core";
import type { ModelInfo, ProviderType } from "prism-core";
import { generateConfig } from "../generators/config.js";
import { generateWorkflow } from "../generators/workflow.js";
import * as ui from "../ui.js";
import {
    askProvider,
    askApiKeyEnv,
    askApiKeyForFetch,
    askBaseUrl,
    askModelFromList,
    askModelManual,
    askProfile,
    askCommentMode,
    askMaxFiles,
    askMaxDiffBytes,
    getFallbackModels,
} from "./init-prompts.js";

export async function runInit(): Promise<void> {
    ui.banner();
    ui.heading("Initialize PRism");

    const provider = await askProvider();
    const apiKeyEnv = await askApiKeyEnv(provider);
    const baseUrl = await askBaseUrl(provider);

    ui.heading("Model selection");

    const apiKey = await askApiKeyForFetch(provider, apiKeyEnv);
    let models: ModelInfo[] = [];

    if (apiKey || provider === "ollama") {
        ui.info("Fetching available models...");
        models = await fetchModelsForProvider(provider, apiKey, baseUrl);
    }

    let model: string;
    const fallback = getFallbackModels(provider);

    if (models.length > 0) {
        ui.success(`Found ${models.length} available models`);
        model = await askModelFromList(models);
    } else if (fallback.length > 0) {
        if (apiKey) {
            ui.warn("Could not fetch live models — showing known models instead");
        }
        model = await askModelFromList(fallback);
    } else {
        model = await askModelManual();
    }

    ui.heading("Review preferences");

    const profile = await askProfile();
    const commentMode = await askCommentMode();
    const maxFiles = await askMaxFiles();
    const maxDiffBytes = await askMaxDiffBytes();

    ui.divider();
    ui.heading("Generating configuration");

    const configContent = generateConfig({
        provider,
        model,
        apiKeyEnv,
        baseUrl,
        profile,
        commentMode,
        maxFiles,
        maxDiffBytes,
    });

    const workflowContent = generateWorkflow({ provider, apiKeyEnv });

    const configPath = resolve(process.cwd(), "prism.config.json");
    await writeFile(configPath, configContent, "utf-8");
    ui.success("Created prism.config.json");

    const workflowPath = resolve(process.cwd(), ".github/workflows/prism.yml");
    await mkdir(dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, workflowContent, "utf-8");
    ui.success("Created .github/workflows/prism.yml");

    ui.divider();

    ui.box("PRism Configuration", [
        `Provider:     ${provider}`,
        `Model:        ${model}`,
        `Profile:      ${profile}`,
        `Comment mode: ${commentMode}`,
        `Max files:    ${maxFiles}`,
        `Max diff:     ${(maxDiffBytes / 1000).toFixed(0)}KB`,
    ]);

    ui.nextSteps([
        `Add your API key as a repository secret named ${apiKeyEnv}`,
        "Commit prism.config.json and .github/workflows/prism.yml",
        "Open a pull request",
        "Watch PRism review your code",
    ]);
}

async function fetchModelsForProvider(
    provider: ProviderType,
    apiKey: string,
    baseUrl?: string,
): Promise<ModelInfo[]> {
    try {
        switch (provider) {
            case "openai": {
                const p = createOpenAIProvider({
                    apiKey,
                    baseUrl: baseUrl ?? "https://api.openai.com",
                    model: "",
                });
                return await p.listModels();
            }
            case "anthropic": {
                const p = createAnthropicProvider({ apiKey, model: "" });
                return await p.listModels();
            }
            case "openai-compat": {
                const p = createOpenAICompatProvider({
                    apiKey,
                    baseUrl: baseUrl ?? "http://localhost:1234",
                    model: "",
                });
                return await p.listModels();
            }
            case "ollama": {
                const p = createOllamaProvider({
                    host: baseUrl ?? "http://localhost:11434",
                    model: "",
                });
                return await p.listModels();
            }
        }
    } catch {
        return [];
    }
}
