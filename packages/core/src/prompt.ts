import type { ChatMessage, PRScopeConfig, PullRequestFile } from "./types.js";

const PROFILE_INSTRUCTIONS: Record<string, string> = {
    balanced: "Review for bugs, security issues, performance problems, and code quality. Be thorough but practical.",
    security: "Focus primarily on security vulnerabilities, injection risks, auth flaws, and data exposure. Be strict on security, lighter on style.",
    performance: "Focus primarily on performance regressions, memory leaks, unnecessary allocations, and algorithmic inefficiency.",
    strict: "Maximum scrutiny. Flag everything: bugs, security, performance, style, naming, documentation gaps. Miss nothing.",
};

export function buildPrompt(files: PullRequestFile[], config: PRScopeConfig): ChatMessage[] {
    const profileInstructions = PROFILE_INSTRUCTIONS[config.profile] ?? PROFILE_INSTRUCTIONS.balanced;

    const systemPrompt = [
        "You are a senior code reviewer. You review pull request diffs and produce structured findings.",
        "",
        `Review focus: ${profileInstructions}`,
        "",
        "Respond ONLY with a valid JSON object matching this exact schema:",
        "",
        "{",
        '  "summary": "Brief overall assessment of the PR",',
        '  "overall_risk": "low | medium | high",',
        '  "findings": [',
        "    {",
        '      "file": "path/to/file",',
        '      "line": 42,',
        '      "severity": "low | medium | high",',
        '      "category": "bug | security | performance | maintainability | dx",',
        '      "title": "Short title",',
        '      "message": "Detailed explanation",',
        '      "suggestion": "How to fix it",',
        '      "confidence": 0.92',
        "    }",
        "  ],",
        '  "praise": ["Good things about this PR"]',
        "}",
        "",
        "Rules:",
        "- Output ONLY the JSON object, no markdown fences, no commentary.",
        "- Set confidence between 0 and 1. Only flag findings where confidence > 0.7.",
        "- If the diff looks clean, return an empty findings array.",
        "- Be specific about line numbers when possible.",
        "- Do not hallucinate files or line numbers that are not in the diff.",
    ].join("\n");

    const diffContent = files
        .map((f) => {
            const patch = f.patch ?? "[binary or context unavailable]";
            return `--- ${f.filename} (${f.status}) ---\n${patch}`;
        })
        .join("\n\n");

    const userPrompt = [
        `Review the following pull request diff (${files.length} files):`,
        "",
        diffContent,
    ].join("\n");

    return [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
    ];
}
