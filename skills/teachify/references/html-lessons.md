# Interactive HTML lesson contract

Use this reference whenever Teachify creates a lesson page.

## Required page structure

- A short selection summary: subject, learner level, and objectives.
- A visible progress indicator based on exercises attempted and correct.
- Connected sections for anchor, mechanism, boundary, and application.
- Two to five exercises placed after the material they test.
- A final recap containing the mental model, not a transcript of the page.

## Exercise behavior

Use a semantic `fieldset` for each question and ordinary form controls. The submit button
must:

1. detect whether an answer was selected;
2. mark correct answers with a green state, `✓ Correct`, and explanatory feedback;
3. mark incorrect answers with a red state, `✕ Not yet`, corrective feedback, and another
   enabled attempt;
4. update progress without counting repeated attempts as new exercises;
5. move focus to the feedback region only when that improves keyboard use.

Use green and red because the user requested them, but never use colour as the only
signal. Include text, an icon, border style, and an `aria-live="polite"` result.

## Technical boundaries

- One `.html` file with inline CSS and JavaScript.
- No external scripts, stylesheets, fonts, images, analytics, forms, or network requests.
- Support light and dark colour schemes with readable focus states.
- Responsive at 320px and usable with keyboard navigation.
- Buttons remain buttons; do not make clickable `div` elements.
- Escape all topic-derived text before inserting it into HTML.
- Do not place secrets, private paths, or identifying session content in the page.

Start from `assets/lesson-template.html`. Replace its sample topic and exercises rather
than accumulating another UI framework.

Validate the finished file with `scripts/validate-lesson.mjs`. Render it once when a
browser is already available. A missing browser is a bounded validation gap, not a reason
to install dependencies or keep probing the machine.
