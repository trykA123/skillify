export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION = 130;
export const SKILLS = [
  {name: 'orientify', verb: 'Find your bearings.', detail: 'Trace a real flow. Name the seams and traps.', source: 'skills/orientify/SKILL.md', start: 16, end: 22, visual: 'map'},
  {name: 'undumbify', verb: 'Make intent complete.', detail: 'Supply decisions. Ask only what changes the outcome.', source: 'skills/undumbify/SKILL.md', start: 22, end: 28, visual: 'signal'},
  {name: 'researchify', verb: 'Find what holds up.', detail: 'Official sources first. State confidence and gaps.', source: 'skills/researchify/SKILL.md', start: 28, end: 34, visual: 'lens'},
  {name: 'traceify', verb: 'Find the cause.', detail: 'Falsify hypotheses before making the smallest fix.', source: 'skills/traceify/SKILL.md', start: 34, end: 40, visual: 'trace'},
  {name: 'audify', verb: 'Measure the condition.', detail: 'Set the standard. Reproduce every finding.', source: 'skills/audify/SKILL.md', start: 40, end: 46, visual: 'measure'},
  {name: 'shapeify', verb: 'Make work executable.', detail: 'Name the files, checks, dependencies and traps.', source: 'skills/shapeify/SKILL.md', start: 46, end: 52, visual: 'blueprint'},
  {name: 'promptify', verb: 'Fit the model.', detail: 'Set outcome, effort, scope and stop rules.', source: 'skills/promptify/SKILL.md', start: 52, end: 58, visual: 'aperture'},
  {name: 'shipify', verb: 'Build. Check. Prove.', detail: 'Set a baseline. Verify each step and the real result.', source: 'skills/shipify/SKILL.md', start: 58, end: 66, visual: 'assembly'},
  {name: 'reviewify', verb: 'Judge against intent.', detail: 'Located findings. Concrete fixes. One verdict.', source: 'skills/reviewify/SKILL.md', start: 66, end: 72, visual: 'verdict'},
  {name: 'releaseify', verb: 'Release honestly.', detail: 'Version from the diff. Rollback before deploy.', source: 'skills/releaseify/SKILL.md', start: 72, end: 78, visual: 'release'},
  {name: 'teachify', verb: 'Make understanding last.', detail: 'Match the learner. Explain, practise and check.', source: 'skills/teachify/SKILL.md', start: 78, end: 84, visual: 'teach'},
];
export const ROLES = [
  {name: 'scout', heading: 'Find the exact path.', detail: 'Read only. Return files, flow and the first file to open.', source: 'agents/scout.md', start: 96, end: 99.5},
  {name: 'researcher', heading: 'Bring the evidence.', detail: 'Read and web. Return sources, confidence and gaps.', source: 'agents/researcher.md', start: 99.5, end: 103},
  {name: 'worker', heading: 'Execute the contract.', detail: 'Edit within scope. Establish a baseline and verify.', source: 'agents/worker.md', start: 103, end: 106.5},
  {name: 'reviewer', heading: 'Make an independent call.', detail: 'Read only. Located findings and one verdict.', source: 'agents/reviewer.md', start: 106.5, end: 110},
];
export const SCENES = [
  {id: 'power', start: 0, end: 8, title: 'An agent has power.'},
  {id: 'method', start: 8, end: 16, title: 'Give it a method.'},
  ...SKILLS.map(skill => ({id: skill.name, title: skill.name, start: skill.start, end: skill.end})),
  {id: 'system', start: 84, end: 96, title: 'Eleven disciplines. One method.'},
  {id: 'agents', start: 96, end: 110, title: 'Four roles. Clear boundaries.'},
  {id: 'principles', start: 110, end: 120, title: 'Intent. Evidence. Judgment.'},
  {id: 'resolve', start: 120, end: 130, title: 'skillify'},
];
