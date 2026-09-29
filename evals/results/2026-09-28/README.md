# Paired eval results, 2026-09-28

Raw output of `scripts/run-paired.mjs`: one JSON object per run with `task`, `arm`
(`base` = no skills, `skill` = the task's skill loaded), `model`, `score` (0–1),
`cost` (USD, from the CLI's usage report), `turns`, `seconds` and the final `answer`.

- `r1-*` is the first full pass: 6 tasks × 2 arms × 3 runs per model.
- `r2-*` re-ran single tasks after the skills changed. For a model and task present in
  both, `r2` supersedes `r1`.
- `sonnet` and `haiku` are Claude Code model aliases as resolved on that day;
  `deepseek-flash` is DeepSeek-V4.1-Flash through `ds-claude`.
- Rubric tasks were graded by Codex; runs that hit an API or grader error were
  re-run, so none are marked invalid here.
- `cost` is what the CLI reports. For `deepseek-flash` rows (`costSource: "cli-estimate"`)
  it is Claude Code's estimate at Anthropic prices, not DeepSeek's bill; the account
  balance moved by about $0.01 per run. The dashboard leaves those out of cost comparisons.
- Three `review-ratelimit` skill-arm DeepSeek runs first failed to grade (Codex usage
  limit) and were stored as 0. They were regraded with the same prompt and rubric by
  Codex on 2026-09-29 (1.00, 1.00, 0.85); `detail.regraded` marks them.
