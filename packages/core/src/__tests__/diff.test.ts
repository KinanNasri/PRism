import { describe, it, expect } from "vitest";
import { isNoiseFile, filterFiles, truncatePatch, prepareDiffs } from "../diff.js";
import type { PullRequestFile } from "../types.js";

function makeFile(filename: string, patch = "diff content"): PullRequestFile {
    return { filename, status: "modified", patch, additions: 1, deletions: 0, sha: "abc123" };
}

describe("isNoiseFile", () => {
    it("flags lockfiles", () => {
        expect(isNoiseFile("package-lock.json")).toBe(true);
        expect(isNoiseFile("pnpm-lock.yaml")).toBe(true);
        expect(isNoiseFile("yarn.lock")).toBe(true);
    });

    it("flags build artifacts", () => {
        expect(isNoiseFile("dist/bundle.js")).toBe(true);
        expect(isNoiseFile("build/output.css")).toBe(true);
        expect(isNoiseFile("vendor/lib.js")).toBe(true);
    });

    it("flags binary assets", () => {
        expect(isNoiseFile("logo.png")).toBe(true);
        expect(isNoiseFile("font.woff2")).toBe(true);
        expect(isNoiseFile("icon.svg")).toBe(true);
    });

    it("passes real source files", () => {
        expect(isNoiseFile("src/index.ts")).toBe(false);
        expect(isNoiseFile("lib/utils.js")).toBe(false);
        expect(isNoiseFile("README.md")).toBe(false);
        expect(isNoiseFile("styles/main.css")).toBe(false);
    });

    it("flags minified files", () => {
        expect(isNoiseFile("app.min.js")).toBe(true);
        expect(isNoiseFile("styles.min.css")).toBe(true);
    });
});

describe("filterFiles", () => {
    it("removes noise files", () => {
        const files = [makeFile("src/app.ts"), makeFile("package-lock.json"), makeFile("src/utils.ts")];
        const result = filterFiles(files, 10);
        expect(result).toHaveLength(2);
        expect(result.map((f) => f.filename)).toEqual(["src/app.ts", "src/utils.ts"]);
    });

    it("respects maxFiles limit", () => {
        const files = Array.from({ length: 50 }, (_, i) => makeFile(`src/file${i}.ts`));
        const result = filterFiles(files, 5);
        expect(result).toHaveLength(5);
    });
});

describe("truncatePatch", () => {
    it("returns unchanged when under limit", () => {
        const patch = "short patch";
        expect(truncatePatch(patch, 1000)).toBe(patch);
    });

    it("truncates and adds marker when over limit", () => {
        const patch = "a".repeat(200);
        const result = truncatePatch(patch, 50);
        expect(result.length).toBeLessThan(200);
        expect(result).toContain("[TRUNCATED by PRScope");
    });

    it("cuts at last newline for clean breaks", () => {
        const patch = "line1\nline2\nline3\nline4\nline5";
        const result = truncatePatch(patch, 15);
        expect(result).toContain("[TRUNCATED");
        expect(result.split("[TRUNCATED")[0]!.endsWith("\n")).toBe(false);
    });
});

describe("prepareDiffs", () => {
    it("filters noise and prepares files", () => {
        const files = [makeFile("src/app.ts", "real"), makeFile("package-lock.json", "lock"), makeFile("dist/bundle.js", "dist")];
        const { filtered } = prepareDiffs(files, 30, 100_000);
        expect(filtered).toHaveLength(1);
        expect(filtered[0]!.filename).toBe("src/app.ts");
    });

    it("handles missing patches gracefully", () => {
        const files: PullRequestFile[] = [{ filename: "binary.wasm", status: "added", additions: 0, deletions: 0, sha: "abc" }];
        const { filtered } = prepareDiffs(files, 30, 100_000);
        expect(filtered[0]!.patch).toContain("context unavailable");
    });
});
