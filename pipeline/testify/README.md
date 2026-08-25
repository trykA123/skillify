# Testify

[← All skills](../../README.md#skills) · [Runtime contract](SKILL.md) · [Behavior cases](../../evals/testify/cases.json)

> **Behavior and risk in → a suite of defensible bets out.**

Testify designs evidence: which behaviors deserve a test, which claim each test pins,
and when a flaky signal is quarantined instead of deleted.

## Evidence design flow

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Subject[Behaviors + risks] --> Rank[Rank by cost of failure]
    Rank --> Claims[One claim per test]
    Claims --> Write[Few strong tests over many weak]
    Bug[Bug report] --> Regress[Failing regression test first]
    Flaky[Flaky test] --> Quarantine[Quarantine + instrument]
    Quarantine -->|evidence says noise| Delete[Delete with reasoning recorded]
    Quarantine -->|evidence says race| Fix[Fix product or test assumptions]
```

## Example

```text
We need tests for the billing module before the pricing refactor next week.
```

> [!IMPORTANT]
> Coverage measures what is untested, never what is important. A percentage is an
> observation, not a goal.
