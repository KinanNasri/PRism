import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseConfig } from "./schema.js";
import type { PRScopeConfig } from "./types.js";
import { CONFIG_FILENAMES, DEFAULT_CONFIG } from "./types.js";

export async function loadConfig(cwd = process.cwd()): Promise<PRScopeConfig> {
    for (const filename of CONFIG_FILENAMES) {
        const filepath = resolve(cwd, filename);
        try {
            const raw = await readFile(filepath, "utf-8");
            const parsed = JSON.parse(raw) as unknown;
            return parseConfig(parsed);
        } catch {
            continue;
        }
    }

    throw new Error(
        `No config found. Run \`npx prscope init\` or create ${CONFIG_FILENAMES.join(" / ")} in your project root.`,
    );
}

export function resolveConfig(overrides: Partial<PRScopeConfig>, base?: Partial<PRScopeConfig>): PRScopeConfig {
    const merged = { ...DEFAULT_CONFIG, ...base, ...overrides };
    return parseConfig(merged);
}
