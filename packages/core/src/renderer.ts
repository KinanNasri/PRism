import type { Finding, ReviewResult, RiskLevel } from "./types.js";
import { PRSCOPE_COMMENT_MARKER } from "./types.js";

const RISK_LABELS: Record<RiskLevel, string> = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
};

const SEVERITY_LABELS: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
};

const CATEGORY_LABELS: Record<string, string> = {
    bug: "Bug",
    security: "Security",
    performance: "Performance",
    maintainability: "Maintainability",
    dx: "Developer Experience",
};

function riskIndicator(risk: RiskLevel): string {
    const dots: Record<RiskLevel, string> = {
        low: "`LOW`",
        medium: "`MEDIUM`",
        high: "`HIGH`",
    };
    return dots[risk];
}

function renderFindingsTable(findings: Finding[]): string {
    if (findings.length === 0) return "*No issues found — this PR looks good.*\n";

    const sorted = [...findings].sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    });

    const rows = sorted.map((f) => {
        const severity = SEVERITY_LABELS[f.severity] ?? f.severity;
        const category = CATEGORY_LABELS[f.category] ?? f.category;
        const location = f.line ? `\`${f.file}:${f.line}\`` : `\`${f.file}\``;
        return `| ${severity} | ${category} | ${f.title} | ${location} |`;
    });

    return [
        "| Severity | Category | Finding | Location |",
        "|----------|----------|---------|----------|",
        ...rows,
        "",
    ].join("\n");
}

function renderFindingDetails(findings: Finding[]): string {
    if (findings.length === 0) return "";

    const details = findings.map((f) => {
        const location = f.line ? `${f.file}:${f.line}` : f.file;
        return [
            `#### ${f.title}`,
            `**Location:** \`${location}\` — **Confidence:** ${Math.round(f.confidence * 100)}%`,
            "",
            f.message,
            "",
            f.suggestion ? `> **Suggestion:** ${f.suggestion}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    });

    return [
        "<details>",
        "<summary>Detailed findings</summary>",
        "",
        ...details,
        "",
        "</details>",
        "",
    ].join("\n");
}

function renderPraise(praise: string[]): string {
    if (praise.length === 0) return "";

    const items = praise.map((p) => `- ${p}`).join("\n");
    return ["<details>", "<summary>What looks good</summary>", "", items, "", "</details>", ""].join("\n");
}

export function renderComment(result: ReviewResult): string {
    const badge = RISK_LABELS[result.overall_risk];
    const indicator = riskIndicator(result.overall_risk);

    return [
        PRSCOPE_COMMENT_MARKER,
        "",
        `## PRScope Review — ${badge} ${indicator}`,
        "",
        result.summary,
        "",
        "---",
        "",
        "### Findings",
        "",
        renderFindingsTable(result.findings),
        renderFindingDetails(result.findings),
        renderPraise(result.praise),
        "---",
        "",
        "<sub>Powered by <a href=\"https://github.com/KinanNasri/PRScope\">PRScope</a></sub>",
        "",
    ].join("\n");
}

export function renderFallbackComment(error: string): string {
    return [
        PRSCOPE_COMMENT_MARKER,
        "",
        "## PRScope Review",
        "",
        "PRScope could not produce a structured review for this PR.",
        "",
        `**Reason:** ${error}`,
        "",
        "The model response did not match the expected schema. This can happen with very large diffs or provider-specific formatting quirks. The PR was still analyzed — try re-running the workflow.",
        "",
        "---",
        "",
        "<sub>Powered by <a href=\"https://github.com/KinanNasri/PRScope\">PRScope</a></sub>",
        "",
    ].join("\n");
}
