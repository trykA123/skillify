#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const templateUrl = new URL('../teaching/teachify/assets/lesson-template.html', import.meta.url);
const lessonPath = process.argv[2] ?? templateUrl.pathname;
const html = await readFile(lessonPath, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

assert.ok(script, 'lesson template must contain an inline script');

const attribute = (source, name) => {
  const value = source.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  assert.ok(value, `exercise must define ${name}`);
  return value;
};

const definitions = [...html.matchAll(/<fieldset\b([^>]*\bclass="[^"]*\bexercise\b[^"]*"[^>]*)>([\s\S]*?)<\/fieldset>/g)]
  .map((match) => ({
    answer: attribute(match[1], 'data-answer'),
    correct: attribute(match[1], 'data-correct'),
    incorrect: attribute(match[1], 'data-incorrect'),
    choices: [...match[2].matchAll(/<input\b[^>]*\bvalue="([^"]+)"/g)].map((choice) => choice[1]),
  }));

assert.ok(definitions.length >= 2, 'lesson must contain at least two exercises');

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }
}

const makeExercise = (answer, correct, incorrect) => {
  const listeners = {};
  const feedback = { textContent: '', focus() {} };
  const button = {
    addEventListener(event, callback) {
      listeners[event] = callback;
    },
    click() {
      listeners.click();
    },
  };
  const exercise = {
    classList: new ClassList(),
    dataset: { answer, correct, incorrect },
    selected: null,
    querySelector(selector) {
      if (selector === '.check') return button;
      if (selector === '.feedback') return feedback;
      if (selector === 'input:checked') return this.selected;
      throw new Error(`Unexpected exercise selector: ${selector}`);
    },
  };
  return { exercise, button, feedback };
};

const controls = definitions.map(({ answer, correct, incorrect }) => makeExercise(answer, correct, incorrect));
const exercises = controls.map(({ exercise }) => exercise);
const progress = {
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
};
const bar = { style: {} };
const progressText = { textContent: '' };

const document = {
  querySelectorAll(selector) {
    assert.equal(selector, '.exercise');
    return exercises;
  },
  querySelector(selector) {
    if (selector === '[role="progressbar"]') return progress;
    if (selector === '.progress-bar') return bar;
    if (selector === '#progress-text') return progressText;
    throw new Error(`Unexpected document selector: ${selector}`);
  },
};

vm.runInNewContext(script, { document }, { filename: lessonPath });

assert.equal(progress.attributes['aria-valuenow'], '0');

const first = controls[0];
const wrong = definitions[0].choices.find((choice) => choice !== definitions[0].answer);
assert.ok(wrong, 'first exercise must have a wrong option for retry testing');
first.exercise.selected = { value: wrong };
first.button.click();
assert.ok(first.exercise.classList.contains('incorrect'), 'wrong answer must mark the exercise incorrect');
assert.ok(!first.exercise.classList.contains('correct'));
assert.match(first.feedback.textContent, /^✕ Not yet/);
assert.notEqual(first.exercise.dataset.solved, 'true');
assert.equal(progress.attributes['aria-valuenow'], '0');

first.exercise.selected = { value: definitions[0].answer };
first.button.click();
assert.ok(first.exercise.classList.contains('correct'), 'retry with the right answer must mark it correct');
assert.ok(!first.exercise.classList.contains('incorrect'));
assert.match(first.feedback.textContent, /^✓ Correct/);
assert.equal(first.exercise.dataset.solved, 'true');
assert.equal(progress.attributes['aria-valuenow'], '1');
assert.equal(bar.style.width, `${(1 / exercises.length) * 100}%`);

for (let index = 1; index < controls.length; index += 1) {
  controls[index].exercise.selected = { value: definitions[index].answer };
  controls[index].button.click();
}
assert.equal(progress.attributes['aria-valuenow'], String(exercises.length));
assert.equal(bar.style.width, '100%');

console.log(`${lessonPath}: interaction passed (wrong feedback, retry, correct feedback, and progress)`);
