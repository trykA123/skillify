#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const agnosticTerms = /\b(?:OpenAI|Codex|Claude|Anthropic|Qwen|Gemini|Cursor|Copilot|Windsurf|OpenCode|GPT(?:-\d)?)\b/i;

function fail(message) {
  failures.push(message);
}

async function text(path) {
  return readFile(path, "utf8");
}

async function json(path, label) {
  try {
    return JSON.parse(await text(path));
  } catch (error) {
    fail(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function frontmatter(source, label) {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) {
    fail(`${label}: missing YAML frontmatter`);
    return {};
  }

  const values = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (field) values[field[1]] = field[2].trim();
  }
  return values;
}

async function markdownReferences(path, source) {
  const references = [];
  const linkPattern = /\]\(([^)]+)\)/g;
  for (const match of source.matchAll(linkPattern)) {
    const target = match[1].split("#", 1)[0].trim();
    if (!target || /^(?:https?:|mailto:|#)/.test(target) || target.includes("<")) continue;
    const resolved = resolve(dirname(path), target);
    if (!(await exists(resolved))) {
      fail(`${relative(root, path)}: missing local reference ${target}`);
    } else {
      references.push(resolved);
    }
  }
  return references;
}

async function filesBelow(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...(await filesBelow(child)));
    else found.push(child);
  }
  return found;
}

const licensePath = join(root, "LICENSE");
if (!(await exists(licensePath)) || !(await text(licensePath)).startsWith("MIT License\n")) {
  fail("LICENSE: an MIT license is required");
}

const rootReadmePath = join(root, "README.md");
if (!(await exists(rootReadmePath))) {
  fail("README.md: missing repository guide");
} else {
  const source = await text(rootReadmePath);
  await markdownReferences(rootReadmePath, source);
  for (const topic of ["Natural requests first", "Choice cards", "Weight controls rigor", "Layman", "--native-agents"]) {
    if (!source.includes(topic)) fail(`README.md: missing required topic ${topic}`);
  }
  if (!source.includes("```mermaid")) fail("README.md: missing system diagram");
}

const agentsReadmePath = join(root, "agents", "README.md");
if (!(await exists(agentsReadmePath))) {
  fail("agents/README.md: missing fleet guide");
} else {
  const source = await text(agentsReadmePath);
  await markdownReferences(agentsReadmePath, source);
  if (!source.includes("```mermaid")) fail("agents/README.md: missing fleet diagram");
}

const skillFamilies = ["entry", "pipeline", "teaching"];
const skills = new Map();

for (const family of skillFamilies) {
  const familyRoot = join(root, family);
  for (const entry of await readdir(familyRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(familyRoot, entry.name, "SKILL.md");
    if (!(await exists(skillPath))) continue;
    const source = await text(skillPath);
    const meta = frontmatter(source, relative(root, skillPath));
    if (meta.name !== entry.name) {
      fail(`${relative(root, skillPath)}: frontmatter name must be ${entry.name}`);
    }
    if (!meta.description) fail(`${relative(root, skillPath)}: description is required`);

    const reachedMarkdown = new Set([resolve(skillPath)]);
    const pendingMarkdown = (await markdownReferences(skillPath, source))
      .filter((path) => path.endsWith(".md"));
    while (pendingMarkdown.length) {
      const referencePath = resolve(pendingMarkdown.pop());
      const skillRelative = relative(dirname(skillPath), referencePath);
      if (skillRelative === ".." || skillRelative.startsWith(`..${sep}`)) {
        fail(`${relative(root, skillPath)}: local reference escapes its skill directory`);
        continue;
      }
      if (reachedMarkdown.has(referencePath)) continue;
      reachedMarkdown.add(referencePath);
      const children = await markdownReferences(referencePath, await text(referencePath));
      pendingMarkdown.push(...children.filter((path) => path.endsWith(".md")));
    }
    const referencedTexts = await Promise.all(
      [...reachedMarkdown].filter((path) => path !== resolve(skillPath)).map((path) => text(path)),
    );
    const portableSource = [source, ...referencedTexts].join("\n\n");
    if (agnosticTerms.test(portableSource)) {
      fail(`${relative(root, skillPath)}: portable skill contains a vendor or model name`);
    }
    if (!portableSource.includes("Weight: Light | Standard | Heavy") ||
        !portableSource.includes("Verbosity: Terse | Concise | Detailed") ||
        !portableSource.includes("Explanation: Layman | Operational | Expert")) {
      fail(`${relative(root, skillPath)}: missing portable output controls`);
    }
    if (!portableSource.includes("choice") && !portableSource.includes("Choice")) {
      fail(`${relative(root, skillPath)}: missing natural-language choice behavior`);
    }
    if (!portableSource.includes("**Customize**") ||
        !portableSource.includes("one second-stage selector") ||
        !portableSource.includes("Ownership value") ||
        !portableSource.includes("smallest useful roles") ||
        !portableSource.includes("confirmed receipt")) {
      fail(`${relative(root, skillPath)}: missing second-stage customization behavior`);
    }

    const guidePath = join(familyRoot, entry.name, "README.md");
    if (!(await exists(guidePath))) {
      fail(`${relative(root, dirname(skillPath))}/README.md: missing human guide`);
    } else {
      const guideSource = await text(guidePath);
      await markdownReferences(guidePath, guideSource);
      if (!guideSource.includes("```mermaid")) {
        fail(`${relative(root, guidePath)}: missing visual flow`);
      }
    }

    if (skills.has(entry.name)) fail(`duplicate skill name: ${entry.name}`);
    skills.set(entry.name, skillPath);

    const referenceRoot = join(familyRoot, entry.name, "references");
    if (await exists(referenceRoot)) {
      const markdownResources = (await filesBelow(referenceRoot))
        .filter((path) => path.endsWith(".md"));
      for (const resource of markdownResources) {
        if (!reachedMarkdown.has(resolve(resource))) {
          fail(`${relative(root, resource)}: reference is not reachable from SKILL.md`);
        }
      }
    }
  }
}

const evalRoot = join(root, "evals");
const evalManifest = await json(join(evalRoot, "manifest.json"), "evals/manifest.json");
const evalSchema = await json(join(evalRoot, "schema.json"), "evals/schema.json");
if (evalManifest?.schemaVersion !== 1) fail("evals/manifest.json: schemaVersion must be 1");
if (evalManifest?.caseSchema !== "schema.json") {
  fail("evals/manifest.json: caseSchema must reference schema.json");
}
if (evalManifest?.fleetCaseSchema !== "agents/schema.json" ||
    evalManifest?.fleetSuite !== "agents/cases.json") {
  fail("evals/manifest.json: fleet schema and suite references are required");
}
if (evalSchema?.properties?.schemaVersion?.const !== 1) {
  fail("evals/schema.json: schemaVersion contract must be 1");
}

const evalCategories = new Set(["activation", "routing", "selection", "contract", "boundary", "handoff", "integration"]);
const invocationRules = new Set(["required", "forbidden"]);
const deliveryWeights = new Set(["Light", "Standard", "Heavy"]);
const verbosityLevels = new Set(["Terse", "Concise", "Detailed"]);
const explanationLevels = new Set(["Layman", "Operational", "Expert"]);
const ownershipLevels = new Set(["Solo", "Team", "Custom team"]);
const choiceCardRules = new Set(["required", "optional", "forbidden"]);
const evalIds = new Set();
let skillCustomizationCases = 0;
let skillNaturalPauseCases = 0;

function validateCustomization(expected, caseLabel) {
  const customization = expected.customization;
  if (customization === undefined) return;
  if (expected.choiceCard !== "required") {
    fail(`${caseLabel}: customization requires a choiceCard`);
  }
  if (!deliveryWeights.has(customization.weight)) {
    fail(`${caseLabel}: unknown customization weight ${customization.weight ?? "missing"}`);
  }
  if (!verbosityLevels.has(customization.verbosity)) {
    fail(`${caseLabel}: unknown customization verbosity ${customization.verbosity ?? "missing"}`);
  }
  if (!explanationLevels.has(customization.explanation)) {
    fail(`${caseLabel}: unknown customization explanation ${customization.explanation ?? "missing"}`);
  }
  if (!ownershipLevels.has(customization.ownership)) {
    fail(`${caseLabel}: unknown customization ownership ${customization.ownership ?? "missing"}`);
  }
  if (customization.roles !== undefined &&
      (!Array.isArray(customization.roles) || customization.roles.length === 0)) {
    fail(`${caseLabel}: customization roles must be a non-empty array`);
  }
  if (customization.ownership === "Custom team" && !customization.roles?.length) {
    fail(`${caseLabel}: Custom team requires explicit roles`);
  }
  if (customization.roles?.length && customization.ownership !== "Custom team") {
    fail(`${caseLabel}: explicit roles require Custom team ownership`);
  }
}

for (const [skillName, skillPath] of skills) {
  const suitePath = join(evalRoot, skillName, "cases.json");
  if (!(await exists(suitePath))) {
    fail(`evals/${skillName}/cases.json: missing behavioral suite`);
    continue;
  }

  const label = relative(root, suitePath);
  const suite = await json(suitePath, label);
  if (!suite) continue;
  if (suite.schemaVersion !== 1) fail(`${label}: schemaVersion must be 1`);
  if (suite.skill !== skillName) fail(`${label}: skill must be ${skillName}`);
  if (!Array.isArray(suite.cases) || suite.cases.length < 6) {
    fail(`${label}: at least six behavioral cases are required`);
    continue;
  }

  for (const [index, evalCase] of suite.cases.entries()) {
    const caseLabel = `${label}: cases[${index}]`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(evalCase.id ?? "")) {
      fail(`${caseLabel}: id must be lowercase kebab-case`);
    } else if (evalIds.has(evalCase.id)) {
      fail(`${caseLabel}: duplicate id ${evalCase.id}`);
    } else {
      evalIds.add(evalCase.id);
    }
    if (!evalCategories.has(evalCase.category)) {
      fail(`${caseLabel}: unknown category ${evalCase.category ?? "missing"}`);
    }
    if (typeof evalCase.prompt !== "string" || evalCase.prompt.trim().length < 10) {
      fail(`${caseLabel}: prompt must contain a realistic request`);
    }

    const expected = evalCase.expected ?? {};
    if (!invocationRules.has(expected.invocation)) {
      fail(`${caseLabel}: invocation must be required or forbidden`);
    }
    if (expected.weight !== undefined && !deliveryWeights.has(expected.weight)) {
      fail(`${caseLabel}: unknown weight ${expected.weight}`);
    }
    if (expected.verbosity !== undefined && !verbosityLevels.has(expected.verbosity)) {
      fail(`${caseLabel}: unknown verbosity ${expected.verbosity}`);
    }
    if (expected.explanation !== undefined && !explanationLevels.has(expected.explanation)) {
      fail(`${caseLabel}: unknown explanation ${expected.explanation}`);
    }
    if (expected.choiceCard !== undefined && !choiceCardRules.has(expected.choiceCard)) {
      fail(`${caseLabel}: unknown choiceCard rule ${expected.choiceCard}`);
    }
    if (expected.naturalPause !== undefined) {
      if (expected.naturalPause !== "required" || expected.choiceCard !== "required") {
        fail(`${caseLabel}: naturalPause requires a required choiceCard`);
      }
      skillNaturalPauseCases += 1;
    }
    if (expected.customization !== undefined) {
      skillCustomizationCases += 1;
      validateCustomization(expected, caseLabel);
    }
    if (!Array.isArray(expected.behaviors) || expected.behaviors.length === 0) {
      fail(`${caseLabel}: expected.behaviors must be non-empty`);
    }
    if (!Array.isArray(expected.forbidden)) {
      fail(`${caseLabel}: expected.forbidden must be an array`);
    }

    if (expected.references !== undefined && !Array.isArray(expected.references)) {
      fail(`${caseLabel}: expected.references must be an array`);
      continue;
    }

    for (const target of expected.references ?? []) {
      const resolved = resolve(dirname(skillPath), target);
      if (!(await exists(resolved))) {
        fail(`${caseLabel}: missing skill reference ${target}`);
      }
    }
  }
}

if (skillCustomizationCases < 1) {
  fail("evals: at least one skill customization case is required");
}
if (skillNaturalPauseCases < 1) {
  fail("evals: at least one unforced natural-pause case is required");
}

const manifestPath = join(root, "agents", "manifest.json");
const manifest = await json(manifestPath, "agents/manifest.json");
if (!manifest) process.exit(1);
const capabilityNames = new Set(Object.keys(manifest.capabilities ?? {}));
const contractNames = new Set(Object.keys(manifest.contracts ?? {}));
const expectedWeights = ["Light", "Standard", "Heavy"];
if (JSON.stringify(Object.keys(manifest.weights ?? {})) !== JSON.stringify(expectedWeights)) {
  fail("agents/manifest.json: weights must declare Light, Standard and Heavy in order");
}
const verbosityConfig = manifest.outputControls?.verbosity ?? {};
const explanationConfig = manifest.outputControls?.explanation ?? {};
const ownershipConfig = manifest.ownership ?? {};
if (verbosityConfig.default !== "Concise" ||
    JSON.stringify(verbosityConfig.levels) !== JSON.stringify(["Terse", "Concise", "Detailed"])) {
  fail("agents/manifest.json: verbosity must define Terse, Concise and Detailed with Concise default");
}
if (explanationConfig.default !== "Operational" ||
    JSON.stringify(explanationConfig.levels) !== JSON.stringify(["Layman", "Operational", "Expert"])) {
  fail("agents/manifest.json: explanation must define Layman, Operational and Expert with Operational default");
}
if (ownershipConfig.default !== "Solo" ||
    JSON.stringify(ownershipConfig.levels) !== JSON.stringify(["Solo", "Team", "Custom team"])) {
  fail("agents/manifest.json: ownership must define Solo, Team and Custom team with Solo default");
}

for (const [contractName, contractTarget] of Object.entries(manifest.contracts ?? {})) {
  const contractPath = join(root, "agents", contractTarget);
  if (!(await exists(contractPath))) {
    fail(`agents/manifest.json: contract ${contractName} is missing ${contractTarget}`);
  } else {
    const contractSource = await text(contractPath);
    if (agnosticTerms.test(contractSource)) {
      fail(`${relative(root, contractPath)}: portable contract contains a vendor or model name`);
    }
    await markdownReferences(contractPath, contractSource);
  }
}
for (const contractName of manifest.globalContracts ?? []) {
  if (!contractNames.has(contractName)) {
    fail(`agents/manifest.json: unknown global contract ${contractName}`);
  }
}

const expectedContractProfiles = {
  base: ["core", "communication"],
  interactive: ["selection", "customization"],
  delegated: ["handoff"],
};
for (const [profile, expected] of Object.entries(expectedContractProfiles)) {
  const actual = manifest.contractProfiles?.[profile];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`agents/manifest.json: ${profile} contract profile must be ${expected.join(", ")}`);
  }
  if (new Set(actual ?? []).size !== (actual ?? []).length) {
    fail(`agents/manifest.json: ${profile} contract profile contains duplicates`);
  }
  for (const contractName of actual ?? []) {
    if (!contractNames.has(contractName)) {
      fail(`agents/manifest.json: ${profile} profile references unknown contract ${contractName}`);
    }
  }
}
const profiledContracts = [...new Set(Object.values(manifest.contractProfiles ?? {}).flat())];
if (JSON.stringify(profiledContracts) !== JSON.stringify(manifest.globalContracts ?? [])) {
  fail("agents/manifest.json: contract profiles must cover globalContracts once and in order");
}

const referencedRoles = new Set();
const codeAgents = [];
for (const [agentName, agent] of Object.entries(manifest.agents ?? {})) {
  const rolePath = join(root, "agents", agent.role ?? "");
  referencedRoles.add(resolve(rolePath));
  if (!(await exists(rolePath))) {
    fail(`agent ${agentName}: missing role ${agent.role}`);
    continue;
  }

  const source = await text(rolePath);
  const meta = frontmatter(source, relative(root, rolePath));
  if (meta.name !== agentName) {
    fail(`${relative(root, rolePath)}: frontmatter name must be ${agentName}`);
  }
  if (!meta.description) fail(`${relative(root, rolePath)}: description is required`);
  if (agnosticTerms.test(source)) {
    fail(`${relative(root, rolePath)}: portable role contains a vendor or model name`);
  }
  if (/\b(?:spawn_agent|send_input|progress_update|model_reasoning_effort)\b/.test(source)) {
    fail(`${relative(root, rolePath)}: portable role contains runtime-specific tool syntax`);
  }
  await markdownReferences(rolePath, source);

  for (const skill of agent.skills ?? []) {
    if (!skills.has(skill)) fail(`agent ${agentName}: unknown skill ${skill}`);
  }
  for (const capability of agent.capabilities ?? []) {
    if (!capabilityNames.has(capability)) {
      fail(`agent ${agentName}: unknown capability ${capability}`);
    }
  }
  for (const contractName of agent.contracts ?? []) {
    if (!contractNames.has(contractName)) {
      fail(`agent ${agentName}: unknown contract ${contractName}`);
    }
  }

  const caps = new Set(agent.capabilities ?? []);
  if (agent.mutability === "read-only" && (caps.has("artifact-write") || caps.has("code-edit"))) {
    fail(`agent ${agentName}: read-only role has a write capability`);
  } else if (agent.mutability === "artifacts-only" && !caps.has("artifact-write")) {
    fail(`agent ${agentName}: artifacts-only role lacks artifact-write`);
  } else if (agent.mutability === "artifacts-only" && caps.has("code-edit")) {
    fail(`agent ${agentName}: artifacts-only role has code-edit`);
  } else if (agent.mutability === "code" && !caps.has("code-edit")) {
    fail(`agent ${agentName}: code role lacks code-edit`);
  } else if (!["read-only", "artifacts-only", "code"].includes(agent.mutability)) {
    fail(`agent ${agentName}: unknown mutability ${agent.mutability}`);
  }
  if (agent.mutability === "code") codeAgents.push(agentName);

  const guidePath = join(root, "agents", "guides", agentName, "README.md");
  if (!(await exists(guidePath))) {
    fail(`agents/guides/${agentName}/README.md: missing human guide`);
  } else {
    const guideSource = await text(guidePath);
    await markdownReferences(guidePath, guideSource);
    if (!guideSource.includes("```mermaid")) {
      fail(`${relative(root, guidePath)}: missing authority or handoff diagram`);
    }
  }
}

if (JSON.stringify(codeAgents) !== JSON.stringify(["worker"])) {
  fail(`agents/manifest.json: worker must be the only code-mutable role; found ${codeAgents.join(", ") || "none"}`);
}

for (const [alias, target] of Object.entries(manifest.aliases ?? {})) {
  if (!manifest.agents?.[target]) fail(`alias ${alias}: unknown target ${target}`);
}

const guideRoot = join(root, "agents", "guides");
if (await exists(guideRoot)) {
  for (const entry of await readdir(guideRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !manifest.agents?.[entry.name]) {
      fail(`agents/guides/${entry.name}: guide is not backed by an active manifest role`);
    }
  }
}

const roleFiles = (await filesBelow(join(root, "agents", "roles")))
  .filter((path) => path.endsWith(".md"));
for (const rolePath of roleFiles) {
  if (!referencedRoles.has(resolve(rolePath))) {
    fail(`${relative(root, rolePath)}: role is not referenced by the manifest`);
  }
}

const agentSuitePath = join(evalRoot, "agents", "cases.json");
const agentSuite = await json(agentSuitePath, "evals/agents/cases.json");
const agentEvalSchema = await json(join(evalRoot, "agents", "schema.json"), "evals/agents/schema.json");
if (agentEvalSchema?.properties?.schemaVersion?.const !== 1) {
  fail("evals/agents/schema.json: schemaVersion contract must be 1");
}
const agentEvalCategories = new Set(["selection", "authority", "handoff", "topology", "communication", "capability"]);
const agentEntryContexts = new Set(["root", "delegated"]);
const coveredAgents = new Set();
let agentEvalCount = 0;
let agentChoiceCases = 0;
let agentCustomizationCases = 0;

if (agentSuite) {
  if (agentSuite.schemaVersion !== 1) fail("evals/agents/cases.json: schemaVersion must be 1");
  if (agentSuite.subject !== "fleet") fail("evals/agents/cases.json: subject must be fleet");
  if (!Array.isArray(agentSuite.cases) || agentSuite.cases.length < referencedRoles.size + 8) {
    fail("evals/agents/cases.json: every active role plus collision and selection coverage is required");
  } else {
    for (const [index, evalCase] of agentSuite.cases.entries()) {
      const caseLabel = `evals/agents/cases.json: cases[${index}]`;
      agentEvalCount += 1;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(evalCase.id ?? "")) {
        fail(`${caseLabel}: id must be lowercase kebab-case`);
      } else if (evalIds.has(evalCase.id)) {
        fail(`${caseLabel}: duplicate id ${evalCase.id}`);
      } else {
        evalIds.add(evalCase.id);
      }
      if (!agentEvalCategories.has(evalCase.category)) {
        fail(`${caseLabel}: unknown category ${evalCase.category ?? "missing"}`);
      }
      if (typeof evalCase.prompt !== "string" || evalCase.prompt.trim().length < 10) {
        fail(`${caseLabel}: prompt must contain a realistic request`);
      }
      const expected = evalCase.expected ?? {};
      if (!manifest.agents?.[expected.role]) {
        fail(`${caseLabel}: unknown role ${expected.role ?? "missing"}`);
      } else {
        coveredAgents.add(expected.role);
      }
      if (expected.weight !== undefined && !deliveryWeights.has(expected.weight)) {
        fail(`${caseLabel}: unknown weight ${expected.weight}`);
      }
      if (expected.verbosity !== undefined && !verbosityLevels.has(expected.verbosity)) {
        fail(`${caseLabel}: unknown verbosity ${expected.verbosity}`);
      }
      if (expected.explanation !== undefined && !explanationLevels.has(expected.explanation)) {
        fail(`${caseLabel}: unknown explanation ${expected.explanation}`);
      }
      if (expected.choiceCard !== undefined && !choiceCardRules.has(expected.choiceCard)) {
        fail(`${caseLabel}: unknown choiceCard rule ${expected.choiceCard}`);
      }
      if (expected.choiceCard === "required") agentChoiceCases += 1;
      if (expected.entryContext !== undefined && !agentEntryContexts.has(expected.entryContext)) {
        fail(`${caseLabel}: unknown entryContext ${expected.entryContext}`);
      }
      if (expected.entryContext === "delegated" && expected.choiceCard !== "forbidden") {
        fail(`${caseLabel}: delegated entryContext must forbid a choiceCard`);
      }
      if (expected.customization !== undefined) {
        agentCustomizationCases += 1;
        validateCustomization(expected, caseLabel);
        for (const role of expected.customization.roles ?? []) {
          if (!manifest.agents?.[role]) {
            fail(`${caseLabel}: customization references unknown role ${role}`);
          }
        }
      }
      if (!Array.isArray(expected.behaviors) || expected.behaviors.length === 0) {
        fail(`${caseLabel}: expected.behaviors must be non-empty`);
      }
      if (!Array.isArray(expected.forbidden)) {
        fail(`${caseLabel}: expected.forbidden must be an array`);
      }
    }
  }
}
if (agentChoiceCases < 4) fail("evals/agents/cases.json: at least four choice-card cases are required");
if (agentCustomizationCases < 1) fail("evals/agents/cases.json: at least one customization case is required");
for (const agentName of Object.keys(manifest.agents ?? {})) {
  if (!coveredAgents.has(agentName)) fail(`evals/agents/cases.json: no case covers ${agentName}`);
}

const installer = await text(join(root, "install.sh"));
const installerList = installer.match(/SKILLS=\(([^)]+)\)/)?.[1]?.trim().split(/\s+/) ?? [];
const sourceSkills = [...skills.keys()].sort();
const installedSkills = [...installerList].sort();
if (JSON.stringify(sourceSkills) !== JSON.stringify(installedSkills)) {
  fail(`install.sh: SKILLS does not match source skills\n  source: ${sourceSkills.join(", ")}\n  installer: ${installedSkills.join(", ")}`);
}
for (const option of ["--skill", "--family", "--exclude", "--update", "--status", "--dry-run", "--agents-only", "--agents-target", "--native-agents"]) {
  if (!installer.includes(option)) fail(`install.sh: missing public option ${option}`);
}

for (const requiredFile of [
  "scripts/render-agents.mjs",
  "scripts/run-evals.mjs",
  "scripts/compare-evals.mjs",
  "scripts/test-agent-adapters.sh",
  "scripts/test-eval-runner.sh",
  "scripts/report-token-footprint.mjs",
  "scripts/test-token-footprint.sh",
  "evals/token-budgets.json",
  "teaching/teachify/scripts/validate-lesson.mjs",
  "teaching/teachify/assets/lesson-template.html",
]) {
  if (!(await exists(join(root, requiredFile)))) fail(`${requiredFile}: required reliability component is missing`);
}
for (const preset of ["[claude]", "[opencode]", "[copilot]", "[vscode]=copilot", ".github/skills", ".copilot/skills"]) {
  if (!installer.includes(preset)) fail(`install.sh: missing required preset ${preset}`);
}

const claudePluginPath = join(root, ".claude-plugin", "plugin.json");
const claudeMarketplacePath = join(root, ".claude-plugin", "marketplace.json");
const claudePlugin = await json(claudePluginPath, ".claude-plugin/plugin.json");
const claudeMarketplace = await json(claudeMarketplacePath, ".claude-plugin/marketplace.json");
if (claudePlugin?.name !== "skillify") fail(".claude-plugin/plugin.json: name must be skillify");
if (!/^\d+\.\d+\.\d+$/.test(claudePlugin?.version ?? "")) {
  fail(".claude-plugin/plugin.json: version must be semantic x.y.z");
}
if (claudePlugin?.repository !== "https://github.com/trykA123/skillify") {
  fail(".claude-plugin/plugin.json: repository must reference the public repository");
}
const pluginSkills = [];
for (const target of claudePlugin?.skills ?? []) {
  const skillDirectory = resolve(root, target);
  const skillFile = join(skillDirectory, "SKILL.md");
  if (!(await exists(skillFile))) {
    fail(`.claude-plugin/plugin.json: missing skill target ${target}`);
  } else {
    pluginSkills.push(skillDirectory.split(sep).at(-1));
  }
}
if (JSON.stringify(pluginSkills.sort()) !== JSON.stringify(sourceSkills)) {
  fail(`.claude-plugin/plugin.json: skills do not match source skills\n  source: ${sourceSkills.join(", ")}\n  plugin: ${pluginSkills.sort().join(", ")}`);
}
const marketplacePlugin = claudeMarketplace?.plugins?.find((entry) => entry.name === "skillify");
if (claudeMarketplace?.name !== "skillify" || marketplacePlugin?.source !== "./") {
  fail(".claude-plugin/marketplace.json: skillify must publish the repository-root plugin");
}

if (failures.length) {
  console.error(`Skillify contract validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Skillify contracts valid: ${skills.size} skills, ${evalIds.size} eval cases ` +
  `(${agentEvalCount} fleet), ` +
  `${referencedRoles.size} roles, ${capabilityNames.size} capabilities.`,
);
