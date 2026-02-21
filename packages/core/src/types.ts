export type RiskLevel = "low" | "medium" | "high";

export type Severity = "low" | "medium" | "high";

export type Category = "bug" | "security" | "performance" | "maintainability" | "dx";

export type ReviewProfile = "balanced" | "security" | "performance" | "strict";

export type CommentMode = "summary-only" | "inline+summary";

export type ProviderType = "openai" | "anthropic" | "openai-compat" | "ollama";

export interface Finding {
    file: string;
    line: number | null;
    severity: Severity;
    category: Category;
    title: string;
    message: string;
    suggestion: string;
    confidence: number;
}

export interface ReviewResult {
    summary: string;
    overall_risk: RiskLevel;
    findings: Finding[];
    praise: string[];
}

export interface PRScopeConfig {
    provider: ProviderType;
    model: string;
    apiKeyEnv: string;
    baseUrl?: string;
    profile: ReviewProfile;
    commentMode: CommentMode;
    maxFiles: number;
    maxDiffBytes: number;
    configPath?: string;
}

export interface PullRequestFile {
    filename: string;
    status: string;
    patch?: string;
    additions: number;
    deletions: number;
    sha: string;
}

export interface ModelInfo {
    id: string;
    name: string;
    created?: number;
    owned_by?: string;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatProvider {
    chat(messages: ChatMessage[]): Promise<string>;
    listModels(): Promise<ModelInfo[]>;
}

export interface ReviewInput {
    files: PullRequestFile[];
    config: PRScopeConfig;
}

export const PRSCOPE_COMMENT_MARKER = "<!-- prscope:review -->";

export const CONFIG_FILENAMES = ["prscope.config.json", ".prscopeRC.json"] as const;

export const DEFAULT_CONFIG: Omit<PRScopeConfig, "provider" | "model" | "apiKeyEnv"> = {
    profile: "balanced",
    commentMode: "summary-only",
    maxFiles: 30,
    maxDiffBytes: 100_000,
};

export const NOISE_PATTERNS = [
    /package-lock\.json$/,
    /pnpm-lock\.yaml$/,
    /yarn\.lock$/,
    /\.lock$/,
    /dist\//,
    /build\//,
    /vendor\//,
    /node_modules\//,
    /\.min\.(js|css)$/,
    /\.map$/,
    /\.snap$/,
    /\.generated\./,
    /\.g\.(ts|dart|cs)$/,
    /\.pb\.(go|ts|js)$/,
    /\.svg$/,
    /\.ico$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
    /\.png$/,
    /\.jpe?g$/,
    /\.gif$/,
    /\.webp$/,
    /\.avif$/,
] as const;
