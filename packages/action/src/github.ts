import * as github from "@actions/github";
import type { PullRequestFile } from "prscope-core";
import { PRSCOPE_COMMENT_MARKER } from "prscope-core";

type Octokit = ReturnType<typeof github.getOctokit>;

export interface PullRequestContext {
    owner: string;
    repo: string;
    number: number;
}

export function getPullRequestContext(): PullRequestContext {
    const payload = github.context.payload;
    const pr = payload.pull_request;

    if (!pr) throw new Error("This action must run on pull_request events.");

    return {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        number: pr.number as number,
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
            pull_number: ctx.number,
            per_page: 100,
            page,
        });

        if (data.length === 0) break;

        for (const file of data) {
            let patch = file.patch;

            if (!patch && file.status !== "removed") {
                try {
                    const { data: rawDiff } = await octokit.rest.pulls.get({
                        owner: ctx.owner,
                        repo: ctx.repo,
                        pull_number: ctx.number,
                        mediaType: { format: "diff" },
                    });
                    patch = typeof rawDiff === "string" ? rawDiff : undefined;
                } catch {
                    patch = undefined;
                }
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

export async function upsertComment(
    octokit: Octokit,
    ctx: PullRequestContext,
    body: string,
): Promise<void> {
    const { data: comments } = await octokit.rest.issues.listComments({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: ctx.number,
        per_page: 100,
    });

    const botLogin = await getBotLogin(octokit);
    const existing = comments.find(
        (c) =>
            c.body?.includes(PRSCOPE_COMMENT_MARKER) &&
            c.user?.login === botLogin,
    );

    if (existing) {
        await octokit.rest.issues.updateComment({
            owner: ctx.owner,
            repo: ctx.repo,
            comment_id: existing.id,
            body,
        });
    } else {
        await octokit.rest.issues.createComment({
            owner: ctx.owner,
            repo: ctx.repo,
            issue_number: ctx.number,
            body,
        });
    }
}

async function getBotLogin(octokit: Octokit): Promise<string> {
    try {
        const { data } = await octokit.rest.users.getAuthenticated();
        return data.login;
    } catch {
        return "github-actions[bot]";
    }
}
