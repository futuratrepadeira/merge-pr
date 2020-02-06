"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
function mergePr(client, pr) {
    return __awaiter(this, void 0, void 0, function* () {
        if (pr.mergeable_state != "clean") {
            return;
        }
        const opts = {
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            pull_number: pr.number,
        };
        const commits = yield client.pulls.listCommits(Object.assign({}, opts));
        const authors = new Set();
        for (const c of commits.data) {
            authors.add(`Authored-by: ${c.commit.author.name} <${c.commit.author.email}>`);
        }
        if (commits.data.length == 1) {
            const msg = commits.data[0].commit.message;
            const divider = msg.indexOf("\n");
            const title = msg.slice(0, divider);
            const body = msg.slice(divider);
            yield client.pulls.merge(Object.assign(Object.assign({}, opts), { merge_method: "squash", commit_title: title + ` (#${pr.number})`, commit_message: body }));
        }
        else {
            yield client.pulls.merge(Object.assign(Object.assign({}, opts), { merge_method: "merge", commit_title: "merge: " + pr.title + ` (#${pr.number})`, commit_message: `"${pr.body}"\n\n${Array.from(authors.values()).join("\n")}` }));
        }
    });
}
function getPr(client) {
    var _a;
    let pr;
    if (github_1.context.payload.pull_request) {
        pr = github_1.context.payload.pull_request.number;
    }
    else if ((_a = github_1.context.payload.issue) === null || _a === void 0 ? void 0 : _a.number) {
        pr = github_1.context.payload.issue.number;
    }
    else {
        throw new Error("Missing pull request context");
    }
    return client.pulls.get({
        owner: github_1.context.repo.owner,
        repo: github_1.context.repo.repo,
        pull_number: pr,
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput("repo-token", { required: true });
            const client = new github_1.GitHub(token);
            const { data } = yield getPr(client);
            yield mergePr(client, data);
        }
        catch (error) {
            core.error(error.message);
            core.setFailed(error.message);
        }
    });
}
run();
