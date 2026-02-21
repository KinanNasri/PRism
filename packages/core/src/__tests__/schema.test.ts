import { describe, it, expect } from "vitest";
import { parseReviewResult, parseConfig } from "../schema.js";

describe("parseReviewResult", () => {
    const validResult = {
        summary: "This PR adds a new utility function.",
        overall_risk: "low",
        findings: [
            {
                file: "src/utils.ts",
                line: 42,
                severity: "medium",
                category: "bug",
                title: "Potential null reference",
                message: "The variable could be null at this point.",
                suggestion: "Add a null check before accessing the property.",
                confidence: 0.85,
            },
        ],
        praise: ["Clean separation of concerns."],
    };

    it("parses valid review result", () => {
        const result = parseReviewResult(validResult);
        expect(result.summary).toBe("This PR adds a new utility function.");
        expect(result.overall_risk).toBe("low");
        expect(result.findings).toHaveLength(1);
        expect(result.praise).toHaveLength(1);
    });

    it("accepts null line numbers", () => {
        const withNullLine = { ...validResult, findings: [{ ...validResult.findings[0]!, line: null }] };
        const result = parseReviewResult(withNullLine);
        expect(result.findings[0]!.line).toBeNull();
    });

    it("rejects invalid risk level", () => {
        const invalid = { ...validResult, overall_risk: "extreme" };
        expect(() => parseReviewResult(invalid)).toThrow();
    });

    it("rejects invalid severity", () => {
        const invalid = {
            ...validResult,
            findings: [{ ...validResult.findings[0]!, severity: "critical" }],
        };
        expect(() => parseReviewResult(invalid)).toThrow();
    });

    it("rejects confidence out of range", () => {
        const invalid = {
            ...validResult,
            findings: [{ ...validResult.findings[0]!, confidence: 1.5 }],
        };
        expect(() => parseReviewResult(invalid)).toThrow();
    });

    it("rejects complete garbage", () => {
        expect(() => parseReviewResult("not json")).toThrow();
        expect(() => parseReviewResult(42)).toThrow();
        expect(() => parseReviewResult(null)).toThrow();
        expect(() => parseReviewResult(undefined)).toThrow();
    });

    it("accepts empty findings and praise", () => {
        const minimal = { summary: "All good.", overall_risk: "low", findings: [], praise: [] };
        const result = parseReviewResult(minimal);
        expect(result.findings).toHaveLength(0);
        expect(result.praise).toHaveLength(0);
    });
});

describe("parseConfig", () => {
    it("parses valid config", () => {
        const config = parseConfig({
            provider: "openai",
            model: "gpt-4o",
            apiKeyEnv: "OPENAI_API_KEY",
        });
        expect(config.provider).toBe("openai");
        expect(config.profile).toBe("balanced");
        expect(config.maxFiles).toBe(30);
    });

    it("rejects missing required fields", () => {
        expect(() => parseConfig({ provider: "openai" })).toThrow();
        expect(() => parseConfig({})).toThrow();
    });

    it("rejects invalid provider", () => {
        expect(() =>
            parseConfig({ provider: "grok", model: "x", apiKeyEnv: "KEY" }),
        ).toThrow();
    });
});
