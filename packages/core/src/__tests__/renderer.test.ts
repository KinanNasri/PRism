import { describe, it, expect } from "vitest";
import { renderComment, renderFallbackComment } from "../renderer.js";
import type { ReviewResult } from "../types.js";
import { PRSCOPE_COMMENT_MARKER } from "../types.js";

describe("renderComment", () => {
    const result: ReviewResult = {
        summary: "This PR introduces a new authentication module.",
        overall_risk: "medium",
        findings: [
            {
                file: "src/auth.ts",
                line: 42,
                severity: "high",
                category: "security",
                title: "Missing input validation",
                message: "User input is not sanitized.",
                suggestion: "Use a validation library.",
                confidence: 0.95,
            },
        ],
        praise: ["Good test coverage"],
    };

    it("includes the comment marker", () => {
        const comment = renderComment(result);
        expect(comment).toContain(PRSCOPE_COMMENT_MARKER);
    });

    it("shows the risk label", () => {
        const comment = renderComment(result);
        expect(comment).toContain("Medium Risk");
    });

    it("includes collapsible details", () => {
        const comment = renderComment(result);
        expect(comment).toContain("<details>");
        expect(comment).toContain("Detailed findings");
    });

    it("renders findings table", () => {
        const comment = renderComment(result);
        expect(comment).toContain("| Severity |");
        expect(comment).toContain("Missing input validation");
        expect(comment).toContain("src/auth.ts:42");
    });

    it("renders praise section", () => {
        const comment = renderComment(result);
        expect(comment).toContain("Good test coverage");
    });

    it("links to PRScope repo", () => {
        const comment = renderComment(result);
        expect(comment).toContain("KinanNasri/PRScope");
    });
});

describe("renderFallbackComment", () => {
    it("includes the marker and error", () => {
        const comment = renderFallbackComment("Schema validation failed");
        expect(comment).toContain(PRSCOPE_COMMENT_MARKER);
        expect(comment).toContain("Schema validation failed");
    });

    it("links to PRScope repo", () => {
        const comment = renderFallbackComment("test");
        expect(comment).toContain("KinanNasri/PRScope");
    });
});
