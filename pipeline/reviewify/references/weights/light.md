# Light review

Use for a small, reversible change. Cover the changed requirement or contract, its
invariant and the nearest realistic failure path. Inspect the directly exercising check
and the final diff; do not expand into a repository audit.

Return Solo findings unless the user explicitly needs a standalone handoff:

```markdown
### F<n>: <problem> [Blocking | Material | Advisory]
**Where:** `file:line` → symbol
**Fix:** <concrete behavior change>
**Verify:** <command or observation>
```

Finish with follow-ups and exactly one verdict. No findings is a valid result when the
evidence supports approval.
