import { writeFile, readFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import {
    createOpenAIProvider,
    createAnthropicProvider,
    createOpenAICompatProvider,
    createOllamaProvider,
} from "prscope-core";
import type { ModelInfo, ProviderType } from "prscope-core";
import { generateConfig } from "../generators/config.js";
import { generateWorkflow } from "../generators/workflow.js";
import * as ui from "../ui.js";
import {
    askProvider,
    askApiKey,
    askBaseUrl,
    askModelFromList,
    askModelManual,
    askProfile,
    askCommentMode,
    askMaxFiles,
    askMaxDiffBytes,
    getFallbackModels,
} from "./init-prompts.js";

const ENV_VAR_NAMES: Record<ProviderType, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    "openai-compat": "LLM_API_KEY",
    ollama: "OLLAMA_HOST",
};

export async function runInit(): Promise<void> {
    ui.banner();
    ui.heading("Initialize PRScope");

    const provider = await askProvider();
    const apiKey = await askApiKey(provider);
    const baseUrl = await askBaseUrl(provider);
    const apiKeyEnv = ENV_VAR_NAMES[provider];

    ui.heading("Model selection");

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
    ui.heading("Setting up your project");

    if (apiKey && provider !== "ollama") {
        await writeEnvFile(apiKeyEnv, apiKey);
        await ensureGitignoreHasEnv();
        ui.success(`Saved API key to .env (${apiKeyEnv})`);
    }

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

    const configPath = resolve(process.cwd(), "prscope.config.json");
    await writeFile(configPath, configContent, "utf-8");
    ui.success("Created prscope.config.json");

    const workflowPath = resolve(process.cwd(), ".github/workflows/prscope.yml");
    await mkdir(dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, workflowContent, "utf-8");
    ui.success("Created .github/workflows/prscope.yml");

    ui.divider();

    ui.box("PRScope Configuration", [
        `Provider:     ${provider}`,
        `Model:        ${model}`,
        `Profile:      ${profile}`,
        `Comment mode: ${commentMode}`,
        `Max files:    ${maxFiles}`,
        `Max diff:     ${(maxDiffBytes / 1000).toFixed(0)}KB`,
    ]);

    ui.nextSteps([
        `Add ${apiKeyEnv} to your GitHub repo secrets (Settings > Secrets > Actions)`,
        "Commit prscope.config.json and .github/workflows/prscope.yml",
        "Open a pull request — PRScope will review it automatically",
    ]);
}

async function writeEnvFile(envVar: string, value: string): Promise<void> {
    const envPath = resolve(process.cwd(), ".env");
    let existing = "";

    try {
        existing = await readFile(envPath, "utf-8");
    } catch {
        // no existing .env
    }

    const pattern = new RegExp(`^${envVar}=.*$`, "m");

    if (pattern.test(existing)) {
        existing = existing.replace(pattern, `${envVar}=${value}`);
    } else {
        existing = existing.trimEnd() + (existing.length > 0 ? "\n" : "") + `${envVar}=${value}\n`;
    }

    await writeFile(envPath, existing, "utf-8");
}

async function ensureGitignoreHasEnv(): Promise<void> {
    const gitignorePath = resolve(process.cwd(), ".gitignore");
    let content = "";

    try {
        content = await readFile(gitignorePath, "utf-8");
    } catch {
        // no existing .gitignore
    }

    if (!content.includes(".env")) {
        content = content.trimEnd() + (content.length > 0 ? "\n" : "") + ".env\n";
        await writeFile(gitignorePath, content, "utf-8");
    }
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
            default:
                return [];
        }
    } catch {
        return [];
    }
}
