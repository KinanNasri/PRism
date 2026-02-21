import * as github from "@actions/github";
import type { PullRequestFile } from "prism-core";
import { PRISM_COMMENT_MARKER } from "prism-core";

type Octokit = ReturnType<typeof github.getOctokit>;

interface PullRequestContext {
    owner: string;
    repo: string;
    pullNumber: number;
}

export function getPullRequestContext(): PullRequestContext | null {
    const { context } = github;
    const pr = context.payload.pull_request;

    if (!pr) return null;

    return {
        owner: context.repo.owner,
        repo: context.repo.repo,
        pullNumber: pr.number,
    };
}

export async function fetchPullRequestFiles(
    octokit: Octokit,
    ctx: PullRequestContext,
): Promise<PullRequestFile[]> {
    const files: PullRequestFile[] = [];
    let page = 1;

    while (true) {
        const { data } = await octokit.rest.pulls.listFiles({
            owner: ctx.owner,
            repo: ctx.repo,
            pull_number: ctx.pullNumber,
            per_page: 100,
            page,
        });

        if (data.length === 0) break;

        for (const file of data) {
            let patch = file.patch;

            if (!patch && file.status !== "removed") {
                patch = await fetchRawPatch(octokit, ctx, file.filename);
            }

            files.push({
                filename: file.filename,
                status: file.status,
                patch,
                additions: file.additions,
                deletions: file.deletions,
                sha: file.sha,
            });
        }

        if (data.length < 100) break;
        page++;
    }

    return files;
}

async function fetchRawPatch(
    octokit: Octokit,
    ctx: PullRequestContext,
    _filename: string,
): Promise<string | undefined> {
    try {
        const { data } = await octokit.rest.pulls.get({
            owner: ctx.owner,
            repo: ctx.repo,
            pull_number: ctx.pullNumber,
            mediaType: { format: "diff" },
        });

        const diffText = data as unknown as string;
        return diffText || undefined;
    } catch {
        return undefined;
    }
}

export async function findExistingComment(
    octokit: Octokit,
    ctx: PullRequestContext,
): Promise<number | null> {
    const { data: comments } = await octokit.rest.issues.listComments({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: ctx.pullNumber,
        per_page: 100,
    });

    const botLogin = await getBotLogin(octokit);

    const existing = comments.find((c) => {
        const isMarked = c.body?.includes(PRISM_COMMENT_MARKER);
        const isBot = botLogin ? c.user?.login === botLogin : true;
        return isMarked && isBot;
    });

    return existing?.id ?? null;
}

export async function upsertComment(
    octokit: Octokit,
    ctx: PullRequestContext,
    body: string,
): Promise<void> {
    const existingId = await findExistingComment(octokit, ctx);

    if (existingId) {
        await octokit.rest.issues.updateComment({
            owner: ctx.owner,
            repo: ctx.repo,
            comment_id: existingId,
            body,
        });
    } else {
        await octokit.rest.issues.createComment({
            owner: ctx.owner,
            repo: ctx.repo,
            issue_number: ctx.pullNumber,
            body,
        });
    }
}

async function getBotLogin(octokit: Octokit): Promise<string | null> {
    try {
        const { data } = await octokit.rest.users.getAuthenticated();
        return data.login;
    } catch {
        return null;
    }
}
