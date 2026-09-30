# Skills-v2 verification

- Static validation: 11 skills, four agents, catalog 2786/2800 B; no budget increases.
- Regression tests: installer safety, agent formats, routing fixtures, five field-evidence tests, three README-generator tests, README freshness, and dashboard export passed.
- Dashboard: production build and TypeScript check passed. Browser fixture checks passed at 390×844 and 1600×1000, light and dark. Concrete, none and unknown catches, search, run details, catch coverage and sparse usage medians were exercised. Screenshots were inspected; no horizontal overflow or browser errors occurred.
- Existing paired results remain unchanged. README numbers and Overview headline use the shared analysis. Teachify and the shipify fast path cost effect remain unmeasured.
- Final live routing is pending. Completed pre-amendment runs: Sonnet 21/21, Haiku 20/21. Final definitions contain 22 cases; repeated runs aborted on the local subscription limit. Raw evidence: `evals/routing-results/2026-09-30-skills-v2/`.
- The CLI reports its weekly limit resets October 4, 10:00 Europe/Bucharest. Do not use an API fallback or infer final success from incomplete calls.
- Six real field entries under the new guidance record catches (entries 47–52 in `feedback/field.jsonl`), completing the five-entry observation. Harness usage was unavailable and remains omitted; historical runs were not backfilled.

## Resume the live routing check

Use a new output directory after subscription quota resets. Preserve older artifacts.

```bash
skillify_route_dir="evals/routing-results/$(date +%F)-skills-v2-final-$(date +%H%M%S)"
mkdir -p "$skillify_route_dir"
env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_BASE_URL \
  -u CLAUDE_CODE_USE_BEDROCK -u CLAUDE_CODE_USE_VERTEX \
  node scripts/run-evals.mjs --adapter claude --model sonnet --routes-only \
  --out "$skillify_route_dir/sonnet.jsonl"
env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_BASE_URL \
  -u CLAUDE_CODE_USE_BEDROCK -u CLAUDE_CODE_USE_VERTEX \
  node scripts/run-evals.mjs --adapter claude --model haiku --routes-only \
  --out "$skillify_route_dir/haiku.jsonl"
```

Acceptance: 22/22 routes pass on each alias. Report aliases unless resolved versions are available.
