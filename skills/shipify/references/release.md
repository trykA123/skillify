# Release

The version claims what kind of change it is, the changelog claims what changed, and the
rollback plan claims you can undo it. Make all three true.

- **Version from the diff.** Read everything merged since the last tag. Breaking change
  to public API, config, stored data, or documented behavior means major; new capability
  means minor; fixes only means patch. If the request says "minor" and the diff breaks
  something, stop and say so.
- **Changelog from evidence.** Each entry names the user-visible change and cites its
  commit or PR. Write for the operator deciding whether to upgrade: what changed, what
  it affects, what they must do. Internal refactors get at most one line. Do not invent
  highlights.
- **Rollback before deploy.** Name the previous artifact, the revert or redeploy
  command, the data reversal (or the accepted irreversibility), and who runs it. If no
  safe rollback exists, name the point of no return and get approval first.
- **Build from the tag.** Release artifacts come from exactly the tagged revision.
- **Heavy releases** add a staged rollout, health checks between stages, and a named
  owner for go and revert.

Done when the tag matches the honest version, every changelog line cites real work,
required user actions are explicit, and the rollback path is written and owned.
