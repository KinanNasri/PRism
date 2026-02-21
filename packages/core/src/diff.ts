import type { PullRequestFile } from "./types.js";
import { NOISE_PATTERNS } from "./types.js";

const TRUNCATION_MARKER = "\n... [TRUNCATED by PRScope — diff too large] ...\n";

export function isNoiseFile(filename: string): boolean {
    return NOISE_PATTERNS.some((pattern) => pattern.test(filename));
}

export function filterFiles(files: PullRequestFile[], maxFiles: number): PullRequestFile[] {
    const meaningful = files.filter((f) => !isNoiseFile(f.filename));
    return meaningful.slice(0, maxFiles);
}

export function truncatePatch(patch: string, maxBytes: number): string {
    const encoded = new TextEncoder().encode(patch);
    if (encoded.byteLength <= maxBytes) return patch;

    const truncated = new TextDecoder().decode(encoded.slice(0, maxBytes));
    const lastNewline = truncated.lastIndexOf("\n");
    const clean = lastNewline > 0 ? truncated.slice(0, lastNewline) : truncated;

    return clean + TRUNCATION_MARKER;
}

export function prepareDiffs(
    files: PullRequestFile[],
    maxFiles: number,
    maxDiffBytes: number,
): { filtered: PullRequestFile[]; totalBytes: number } {
    const filtered = filterFiles(files, maxFiles);
    let totalBytes = 0;
    const budgetPerFile = Math.floor(maxDiffBytes / Math.max(filtered.length, 1));

    const prepared = filtered.map((file) => {
        const patch = file.patch ?? "[context unavailable — binary or oversized diff]";
        const truncated = truncatePatch(patch, budgetPerFile);
        totalBytes += new TextEncoder().encode(truncated).byteLength;
        return { ...file, patch: truncated };
    });

    return { filtered: prepared, totalBytes };
}

export function buildDiffBlock(files: PullRequestFile[]): string {
    return files
        .map((f) => {
            const header = `### ${f.filename} (${f.status}) [+${f.additions} / -${f.deletions}]`;
            const patch = f.patch ?? "[context unavailable]";
            return `${header}\n\`\`\`diff\n${patch}\n\`\`\``;
        })
        .join("\n\n");
}
