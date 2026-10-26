# Tracked pull request intake

The table replaces the fictional PR #284-#264 rows with twelve repository references. The first four are the governance repositories explicitly named in the request: `TWGT-`, `twgt-bridge`, `twgt-schema-gate`, and `engineering-intelligence`. The next eight are early entries from the supplied inventory: `rootly-mcp-server`, `Swarm-Mind-Console`, `caddy`, `sanitizers`, `plugins`, `router-cli`, `all-in-one`, and `gods-eye-view`.

Each row links to its repository. On first load the table says **Not checked** rather than inventing PR status, score, or CI evidence. The **Check public PRs** button sends read-only unauthenticated requests to GitHub's public `GET /repos/{owner}/{repo}/pulls` endpoint, requesting the most recently updated PR (`state=all`, `per_page=1`) for each named repository. Closed and merged are distinguished using `merged_at`. The result is the latest public PR, not a complete PR count or a CI verdict. Rate limits, private repositories, and unavailable responses are shown explicitly. No token is stored or transmitted.

Table filters, sorting, and CSV export work on the currently displayed repository rows. The date and segment controls above continue to govern demo analytics; they do not silently hide the twelve tracked repositories. Live checks, git health scores, and evidence classification would require separately authenticated, reviewed adapters.

API reference: https://docs.github.com/en/rest/pulls/pulls#list-pull-requests