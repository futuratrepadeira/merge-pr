import * as core from "@actions/core"
import { GitHub, context } from "@actions/github"
import Octokit from "@octokit/rest"

async function mergePr(client: GitHub, pr: Octokit.PullsGetResponse): Promise<void> {
    if (pr.mergeable_state != "clean") {
        return
    }
    const opts = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
    }
    const commits = await client.pulls.listCommits({ ...opts })
    const authors = new Set<string>()
    for (const c of commits.data) {
        authors.add(`Authored-by: ${c.commit.author.name} <${c.commit.author.email}>`)
    }
    await client.pulls.merge({
        ...opts,
        merge_method: pr.commits == 1 ? "rebase" : "merge",
        commit_title: "merge: " + pr.title,
        commit_message: `"${pr.body}"\n\n${Array.from(authors.values()).join("\n")}`,
    })
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
