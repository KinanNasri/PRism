import { createHash } from "node:crypto";
import type { PRScopeConfig } from "./types.js";

export function computeReviewHash(diff: string, config: PRScopeConfig): string {
    const input = [diff, config.model, config.provider, config.profile].join("|");
    return createHash("sha256").update(input).digest("hex");
}
