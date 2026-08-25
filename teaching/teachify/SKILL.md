---
name: teachify
description: Teach a topic with an interactive HTML lesson: short explanations, exercises, instant feedback. Use when you want to understand, practice, or be taught something. Not for quick factual answers.
---

# Teachify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

Teach one subject without flattening it. Adapt vocabulary, abstraction, examples,
questions, and mathematical or technical depth to the learner—not merely the word count.

## Build the lesson

1. Establish the learner's goal and choose one level: **Layman, Beginner, Practitioner,
   Advanced, or Expert**. Infer it from the conversation; ask only when a wrong level
   would waste the lesson.
2. Read [the teaching method](references/pedagogy.md). For code or a local system, inspect
   the real symbols, callers, tests, configuration, and one end-to-end path. For current
   external facts, use a sourced research method first.
3. Teach the same core idea through a concrete anchor, the mechanism, one boundary or
   failure mode, and a useful application. Define a term before relying on it.
4. Add two to five exercises that test the lesson's stated objectives. Prefer prediction,
   classification, ordering, and scenario choices. Every auto-graded question must have
   an unambiguous answer and feedback that explains why.
5. Read [the HTML contract](references/html-lessons.md), adapt
   [the lesson template](assets/lesson-template.html), and write one self-contained page
   to the requested path or `lessons/<date>-<slug>.html`.

## Interaction contract

Submitting a correct answer marks the exercise green and explains the reasoning.
Submitting an incorrect answer marks it red, explains the misconception, and allows
another attempt. Never rely on colour alone: show text and a symbol, use `aria-live`, and
preserve keyboard operation. Do not auto-grade subjective free text.

Run `node <skill-dir>/scripts/validate-lesson.mjs <lesson.html>`. If a browser is already
available, open the page and inspect it once. If none is available, do not install one or
search repeatedly: report structural validation and leave visual inspection as an explicit
limitation. The page must work from disk with no network, CDN, external font, build step,
or server.

## Boundaries

Teachify writes only the requested lesson. It does not edit product code, keep a learner
profile, record the session, award points, or build a knowledge archive. Those side
effects require a separate explicit system outside this skill.

Return the lesson path, selected level, objectives, and the number of exercises. Do not
repeat the lesson in chat.
