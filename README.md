# Pull Request Merger

This GitHub action automatically merges pull requests. If the PR contains a single commit, the action squashes and merges the commit, adding the PR number to the commit title. Otherwise, the action creates a merge commit containing the PR body as the commit message and the PR title as the commit title, prefixed by `merge: `, and suffixed by the PR number.
