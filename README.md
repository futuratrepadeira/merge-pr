# Pull Request Merger

This GitHub action automatically merges pull requests. If the PR contains a single commit, it rebases and merges it. Otherwise, it contains a merge commit containing the PR body as the commit message the PR title as the commit title, prefixed by `merge: `.
