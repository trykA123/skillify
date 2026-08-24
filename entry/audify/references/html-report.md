# Audify HTML report module

Read this module only after the audit standard, evidence, and findings are settled and an
HTML report will be produced. It controls presentation, not audit conclusions.

## Required structure

- **Verdict readable in ten seconds:** subject, boundary, date, one-sentence condition,
  and counts by severity × effort quadrant. A reader who stops here knows whether to
  worry.
- **Standard:** the predeclared criteria, so readers can dispute the yardstick rather
  than only the findings.
- **Action grid:** the severity × effort matrix is navigation, not decoration. Clicking
  a quadrant filters the findings.
- **Findings:** severity, effort, location, measurement or observation, provenance,
  reproduction method, and concrete first step. Collapse evidence by default but keep it
  one action away.
- **What's sound:** a short account of verified healthy areas.
- **Coverage:** examined areas, sampling method, and what was not examined. Never imply
  total coverage.

## Visual and interaction rules

Use one structural idea—the action grid—and execute it well. Prefer density and
navigability to decoration. Findings must scan quickly and expand on demand. Use a real
type scale and keep monospace for code and commands.

Use OKLCH colors. Severity is a status ramp; categories are a separate categorical set.
A category must not borrow the red that means critical. Meaning must survive greyscale
printing and common color-vision deficiencies, so hue is never the only signal.

Add a chart only when it communicates real counts better than a sentence. Hand-write
inline SVG from measured values, state the sample size, avoid chart libraries, and never
use a pie chart with more than four segments.

Support dark and light through `prefers-color-scheme`. On laptop widths, wide tables and
code blocks scroll inside their containers instead of widening the page. Keep CSS and JS
inline; use no CDN, external font, image, or runtime network request.

## Render check

Open the completed file and inspect it before delivery. Verify that quadrant filters,
collapsed evidence, keyboard navigation, focus indicators, dark/light contrast,
responsive overflow, and displayed counts work from disk. An unrendered audit is an
unverified claim inside a report about verification.
