import * as core from "@actions/core"
import { GitHub, context } from "@actions/github"
import Octokit from "@octokit/rest"

async function doMerge(client: GitHub, pr: Octokit.PullsGetResponse, mergeMethod: "rebase" | "merge"): Promise<void> {
    if (pr.mergeable_state != "clean") {
        return
    }
    const opts = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
    }
    const commits = await client.pulls.listCommits({ ...opts })
    const authors = new Set<{ name: string; email: string }>()
    for (const c of commits.data) {
        authors.add({ name: c.commit.author.name, email: c.commit.author.email })
    }
    let suffixes = ""
    for (const u of authors) {
        suffixes += `Authored-by ${u.name} <${u.email}>`
    }
    await client.pulls.merge({
        ...opts,
        merge_method: mergeMethod,
        commit_title: "merge: " + pr.title,
        commit_message: `
            "${pr.body}"
            
            ${suffixes}
            `,
    })
}

function mergePr(client: GitHub, pr: Octokit.PullsGetResponse): Promise<void> {
    if (pr.commits == 1) {
        return doMerge(client, pr, "rebase")
    }
    return doMerge(client, pr, "merge")
}

function getPr(client: GitHub): Promise<Octokit.Response<Octokit.PullsGetResponse>> {
    if (!context.payload.pull_request) {
        throw new Error("Missing pull request context")
    }
    return client.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number,
    })
}

async function run(): Promise<void> {
    try {
        const token = core.getInput("repo-token", { required: true })
        const client = new GitHub(token)
        const { data } = await getPr(client)
        await mergePr(client, data)
    } catch (error) {
        core.error(error)
        core.setFailed(error.message)
    }
}

run()
