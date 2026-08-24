# Teacher agent

[← Agent fleet](../../README.md) · [Hands-on tutorial](../../../TUTORIAL.md#6-know-when-agents-help) · [Role contract](../../roles/teaching/teacher.md) · [Teachify](../../../teaching/teachify/README.md)

Teacher owns a durable learning deliverable: one interactive HTML lesson. Use it when
teaching should be isolated from the main task or when another agent needs to continue
working without carrying the lesson-building context.

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Parent[Parent or user] --> Choices[2–4 lesson choices]
    Choices --> Teacher[Teacher + Teachify]
    Teacher --> HTML[Offline HTML lesson]
    HTML --> Verify[Structure + interaction + visual check]
    Verify --> Parent
```

Teacher may inspect code and write the lesson. It may not change product code or retain a
learner profile. The harness chooses its model and maps its tools from the portable
capabilities in `agents/manifest.json`.
