#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { access, mkdir, readFile, realpath, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";

const KIND_FOLDERS = {
  landmark: "landmarks",
  flow: "flows",
  decision: "decisions",
  invariant: "invariants",
  trap: "traps",
  command: "commands",
  external: "externals",
};
const KINDS = new Set(Object.keys(KIND_FOLDERS));
const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const EDGE_PATTERN = /^[a-z][a-z0-9-]*$/;
const defaultCatalog = resolve(
  process.env.MAPIFY_CATALOG ??
  join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "mapify", "catalog.json"),
);

function usage(code = 0) {
  const out = code ? process.stderr : process.stdout;
  out.write(`Mapify — sparse verified codebase graph\n\n` +
    `Usage:\n` +
    `  mapify.mjs find QUERY [--catalog FILE] [--limit N] [--json]\n` +
    `  mapify.mjs propose --repo DIR --id ID --kind KIND --summary TEXT [options]\n` +
    `  mapify.mjs capture --repo DIR --id ID --kind KIND --summary TEXT [options]\n` +
    `  mapify.mjs refresh --repo DIR --id ID [updated capture options]\n` +
    `  mapify.mjs verify --repo DIR [--id ID] [--tombstone-missing] [--replacement ID]\n` +
    `  mapify.mjs rebuild --repo DIR [--repo-id ID] [--catalog FILE]\n\n` +
    `Capture options: --path REL --symbol NAME --line N --tag TAG --edge TYPE:ID --note TEXT\n` +
    `Shared options: --catalog FILE (default: ${defaultCatalog})\n` +
    `Find exits: 0=current candidate, 1=no match, 2=only missing/removed matches\n`);
  process.exit(code);
}

function parseArgs(argv) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) usage(0);
  const command = argv[0];
  const options = { tags: [], edgeSpecs: [], catalog: defaultCatalog, limit: 5, json: false };
  const positional = [];
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    if (arg === "--json") options.json = true;
    else if (arg === "--tombstone-missing") options.tombstoneMissing = true;
    else {
      const value = argv[++index];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (key === "tag") options.tags.push(value);
      else if (key === "edge") options.edgeSpecs.push(value);
      else options[key] = value;
    }
  }
  options.query = positional.join(" ").trim();
  options.limit = Number(options.limit);
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50) {
    throw new Error("--limit must be an integer from 1 to 50");
  }
  return { command, options };
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function atomicWrite(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content, "utf8");
  await rename(temporary, path);
}

function repositoryPath(repo, value) {
  if (!value) return null;
  if (isAbsolute(value)) throw new Error("node path must be repository-relative");
  const target = resolve(repo, value);
  const fromRepo = relative(repo, target);
  const separator = process.platform === "win32" ? "\\" : "/";
  if (!fromRepo || fromRepo === ".." || fromRepo.startsWith(`..${separator}`) || isAbsolute(fromRepo)) {
    throw new Error("node path must stay inside the repository");
  }
  return { target, relative: fromRepo.replaceAll("\\", "/") };
}

async function isReallyInside(repo, target) {
  const [realRepo, realTarget] = await Promise.all([realpath(repo), realpath(target)]);
  const fromRepo = relative(realRepo, realTarget);
  const separator = process.platform === "win32" ? "\\" : "/";
  return Boolean(fromRepo) && fromRepo !== ".." && !fromRepo.startsWith(`..${separator}`) && !isAbsolute(fromRepo);
}

function revision(repo) {
  try {
    return execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unversioned";
  }
}

async function fingerprint(path) {
  if (!path || !await exists(path)) return null;
  return `sha256:${createHash("sha256").update(await readFile(path)).digest("hex")}`;
}

function parseValue(value) {
  try { return JSON.parse(value); } catch { return value.trim(); }
}

function parseFrontmatter(source, file) {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const data = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator > 0) data[line.slice(0, separator).trim()] = parseValue(line.slice(separator + 1).trim());
  }
  return { data, rest: source.slice(match[0].length) };
}

function parseEdges(specs) {
  return specs.map((spec) => {
    const separator = spec.indexOf(":");
    const type = separator > 0 ? spec.slice(0, separator) : "";
    const to = separator > 0 ? spec.slice(separator + 1) : "";
    if (!EDGE_PATTERN.test(type) || !ID_PATTERN.test(to)) throw new Error(`invalid edge '${spec}'; use TYPE:ID`);
    return { type, to };
  }).filter((edge, index, all) => all.findIndex((candidate) => candidate.type === edge.type && candidate.to === edge.to) === index)
    .sort((a, b) => `${a.type}:${a.to}`.localeCompare(`${b.type}:${b.to}`));
}

function renderNode(node, note = "") {
  const fields = [
    "schemaVersion", "id", "kind", "status", "path", "symbol", "lineHint",
    "summary", "tags", "edges", "verifiedRevision", "verifiedAt", "fingerprint",
    "removedRevision", "removedAt", "replacement",
  ];
  const lines = ["---"];
  for (const field of fields) {
    if (node[field] !== undefined && node[field] !== null && node[field] !== "") {
      lines.push(`${field}: ${JSON.stringify(node[field])}`);
    }
  }
  lines.push("---", "", `# ${node.id}`);
  if (note.trim()) lines.push("", note.trim());
  return `${lines.join("\n")}\n`;
}

function parseNode(source, file) {
  const { data: node, rest } = parseFrontmatter(source, file);
  if (node.schemaVersion !== 1 || typeof node.id !== "string" || !ID_PATTERN.test(node.id) ||
      typeof node.kind !== "string" || !KINDS.has(node.kind) ||
      !["active", "stale", "removed"].includes(node.status) ||
      typeof node.summary !== "string" ||
      (node.path !== undefined && typeof node.path !== "string") ||
      (node.symbol !== undefined && typeof node.symbol !== "string") ||
      (node.lineHint !== undefined && (!Number.isInteger(node.lineHint) || node.lineHint < 1)) ||
      !Array.isArray(node.tags ?? []) || (node.tags ?? []).some((tag) => typeof tag !== "string")) {
    throw new Error(`${file}: invalid Mapify v1 node`);
  }
  if (!Array.isArray(node.edges ?? []) || (node.edges ?? []).some((edge) =>
    typeof edge?.type !== "string" || !EDGE_PATTERN.test(edge.type) ||
    typeof edge?.to !== "string" || !ID_PATTERN.test(edge.to))) {
    throw new Error(`${file}: invalid typed edges`);
  }
  node._file = file;
  node._note = rest.replace(/^\s*# [^\n]+\n?/, "").trim();
  return node;
}

function cleanNode(node) {
  const result = { ...node };
  delete result._file;
  delete result._note;
  return result;
}

function defaultRepoId(repo) {
  const slug = basename(repo).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `repo-${createHash("sha256").update(repo).digest("hex").slice(0, 8)}`;
}

async function ensureManifest(repo, requestedId) {
  const file = join(repo, ".mapify", "manifest.md");
  if (await exists(file)) {
    const { data } = parseFrontmatter(await readFile(file, "utf8"), file);
    if (data.schemaVersion !== 1 || !ID_PATTERN.test(data.repoId ?? "")) throw new Error(`${file}: invalid Mapify manifest`);
    if (requestedId && requestedId !== data.repoId) throw new Error(`repository already uses repoId '${data.repoId}'`);
    return data;
  }
  const repoId = requestedId ?? defaultRepoId(repo);
  if (!ID_PATTERN.test(repoId)) throw new Error("--repo-id must contain lowercase letters, digits, dots, or hyphens");
  const manifest = { schemaVersion: 1, repoId, createdAt: new Date().toISOString() };
  await atomicWrite(file, `---\nschemaVersion: 1\nrepoId: ${JSON.stringify(repoId)}\ncreatedAt: ${JSON.stringify(manifest.createdAt)}\n---\n\n# Mapify — ${repoId}\n`);
  return manifest;
}

async function readManifest(repo) {
  const file = join(repo, ".mapify", "manifest.md");
  if (!await exists(file)) throw new Error("repository has no .mapify/manifest.md; capture or rebuild first");
  const { data } = parseFrontmatter(await readFile(file, "utf8"), file);
  if (data.schemaVersion !== 1 || !ID_PATTERN.test(data.repoId ?? "")) throw new Error(`${file}: invalid Mapify manifest`);
  return data;
}

async function nodesIn(repo) {
  const found = [];
  for (const folder of Object.values(KIND_FOLDERS)) {
    const root = join(repo, ".mapify", "nodes", folder);
    if (!await exists(root)) continue;
    for (const name of await readdir(root)) {
      if (name.endsWith(".md")) found.push(parseNode(await readFile(join(root, name), "utf8"), join(root, name)));
    }
  }
  const tombstones = join(repo, ".mapify", "tombstones");
  if (await exists(tombstones)) {
    for (const name of await readdir(tombstones)) {
      if (name.endsWith(".md")) found.push(parseNode(await readFile(join(tombstones, name), "utf8"), join(tombstones, name)));
    }
  }
  const ids = new Set();
  for (const node of found) {
    if (ids.has(node.id)) throw new Error(`duplicate Mapify node ID: ${node.id}`);
    ids.add(node.id);
  }
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

function nodeRelativePath(repo, node) {
  return relative(join(repo, ".mapify"), node._file).replaceAll("\\", "/");
}

async function writeLocalViews(repo, manifest, nodes) {
  const safe = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
  const index = [
    "# Mapify index", "", `Repository: **${manifest.repoId}**`, "",
    "Generated pointer index. Current source remains authoritative.", "",
    "| Node | Kind | Status | Path / symbol | Summary |", "|---|---|---|---|---|",
  ];
  for (const node of nodes) {
    const location = [node.path, node.symbol].filter(Boolean).join(" # ") || "—";
    index.push(`| [${safe(node.id)}](${nodeRelativePath(repo, node)}) | ${safe(node.kind)} | ${safe(node.status)} | ${safe(location)} | ${safe(node.summary)} |`);
  }
  await atomicWrite(join(repo, ".mapify", "index.md"), `${index.join("\n")}\n`);

  const root = { children: new Map(), nodes: [] };
  for (const node of nodes.filter((candidate) => candidate.status !== "removed" && candidate.path)) {
    let cursor = root;
    for (const part of node.path.split("/")) {
      if (!cursor.children.has(part)) cursor.children.set(part, { children: new Map(), nodes: [] });
      cursor = cursor.children.get(part);
    }
    cursor.nodes.push(node);
  }
  const tree = ["# Source-tree view", "", "Generated from mapped nodes; this is not a copy of the repository.", "", "```text", manifest.repoId];
  function renderBranch(branch, prefix = "") {
    const entries = [
      ...[...branch.children.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, child]) => ({ name, child })),
      ...branch.nodes.sort((a, b) => a.id.localeCompare(b.id)).map((node) => ({ name: `↳ ${node.id}${node.symbol ? ` # ${node.symbol}` : ""}` })),
    ];
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      tree.push(`${prefix}${last ? "└──" : "├──"} ${entry.name}`);
      if (entry.child) renderBranch(entry.child, `${prefix}${last ? "    " : "│   "}`);
    });
  }
  renderBranch(root);
  tree.push("```", "");
  await atomicWrite(join(repo, ".mapify", "views", "source-tree.md"), tree.join("\n"));

  const topics = new Map();
  for (const node of nodes) for (const tag of node.tags ?? []) {
    if (!topics.has(tag)) topics.set(tag, []);
    topics.get(tag).push(node);
  }
  const topicLines = ["# Topic view", "", "Generated from node tags; links point to durable nodes."];
  for (const [tag, tagged] of [...topics.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    topicLines.push("", `## ${tag}`, "");
    for (const node of tagged.sort((a, b) => a.id.localeCompare(b.id))) {
      topicLines.push(`- [${node.id}](../${nodeRelativePath(repo, node)}) — ${node.status} — ${node.summary}`);
    }
  }
  topicLines.push("");
  await atomicWrite(join(repo, ".mapify", "views", "topics.md"), topicLines.join("\n"));
}

async function readCatalog(path) {
  if (!await exists(path)) return { schemaVersion: 1, generatedAt: null, nodes: [] };
  const catalog = JSON.parse(await readFile(path, "utf8"));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.nodes)) throw new Error(`${path}: invalid Mapify catalogue`);
  for (const node of catalog.nodes) {
    if (!node || typeof node.id !== "string" || !ID_PATTERN.test(node.id) ||
        typeof node.kind !== "string" || !KINDS.has(node.kind) ||
        !["active", "stale", "removed"].includes(node.status) ||
        typeof node.repoId !== "string" || typeof node.repoRoot !== "string" ||
        typeof node.summary !== "string" ||
        (node.path !== null && node.path !== undefined && typeof node.path !== "string") ||
        (node.symbol !== null && node.symbol !== undefined && typeof node.symbol !== "string") ||
        !Array.isArray(node.tags ?? []) || (node.tags ?? []).some((tag) => typeof tag !== "string") ||
        !Array.isArray(node.edges ?? []) || (node.edges ?? []).some((edge) =>
          typeof edge?.type !== "string" || !EDGE_PATTERN.test(edge.type) ||
          typeof edge?.to !== "string" || !ID_PATTERN.test(edge.to))) {
      throw new Error(`${path}: invalid Mapify catalogue node`);
    }
  }
  return catalog;
}

function topicFileName(tag) {
  const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "topic";
  return `${slug}-${createHash("sha256").update(tag).digest("hex").slice(0, 6)}.json`;
}

async function writeGlobalViews(catalogPath, catalog) {
  const base = dirname(catalogPath);
  const repos = new Map();
  const topics = new Map();
  for (const node of catalog.nodes) {
    const repoKey = `${node.repoId}-${createHash("sha256").update(node.repoRoot).digest("hex").slice(0, 8)}`;
    if (!repos.has(repoKey)) repos.set(repoKey, []);
    repos.get(repoKey).push(node);
    for (const tag of node.tags ?? []) {
      if (!topics.has(tag)) topics.set(tag, []);
      topics.get(tag).push(node);
    }
  }
  const repoRoot = join(base, "repos");
  await mkdir(repoRoot, { recursive: true });
  for (const name of await readdir(repoRoot)) if (name.endsWith(".json")) await unlink(join(repoRoot, name));
  for (const [key, nodes] of repos) await atomicWrite(
    join(repoRoot, `${key}.json`),
    `${JSON.stringify({ schemaVersion: 1, repoId: nodes[0].repoId, repoRoot: nodes[0].repoRoot, nodes }, null, 2)}\n`,
  );
  const topicRoot = join(base, "topics");
  await mkdir(topicRoot, { recursive: true });
  for (const name of await readdir(topicRoot)) if (name.endsWith(".json")) await unlink(join(topicRoot, name));
  for (const [tag, nodes] of topics) {
    await atomicWrite(join(topicRoot, topicFileName(tag)), `${JSON.stringify({ schemaVersion: 1, topic: tag, nodes }, null, 2)}\n`);
  }
}

async function syncCatalog(repo, catalogPath, requestedRepoId) {
  const manifest = await ensureManifest(repo, requestedRepoId);
  const nodes = await nodesIn(repo);
  const catalog = await readCatalog(catalogPath);
  const retained = catalog.nodes.filter((entry) => resolve(entry.repoRoot) !== repo);
  const local = nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    status: node.status,
    repoId: manifest.repoId,
    repoRoot: repo,
    nodePath: node._file,
    path: node.path ?? null,
    symbol: node.symbol ?? null,
    lineHint: node.lineHint ?? null,
    summary: node.summary,
    tags: node.tags ?? [],
    edges: node.edges ?? [],
    verifiedRevision: node.verifiedRevision,
    verifiedAt: node.verifiedAt,
  }));
  const next = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    nodes: [...retained, ...local].sort((a, b) => `${a.repoRoot}:${a.id}`.localeCompare(`${b.repoRoot}:${b.id}`)),
  };
  await atomicWrite(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  await Promise.all([writeLocalViews(repo, manifest, nodes), writeGlobalViews(catalogPath, next)]);
  return next;
}

async function capture(options) {
  const repo = resolve(options.repo ?? "");
  const node = await buildActiveNode(repo, options, "capture");
  const manifest = await ensureManifest(repo, options.repoId);
  const prior = (await nodesIn(repo)).find((candidate) => candidate.id === options.id);
  const nodePath = join(repo, ".mapify", "nodes", KIND_FOLDERS[node.kind], `${node.id}.md`);
  await atomicWrite(nodePath, renderNode(node, options.note));
  if (prior?._file !== nodePath && prior && await exists(prior._file)) await unlink(prior._file);
  const tombstonePath = join(repo, ".mapify", "tombstones", `${node.id}.md`);
  if (await exists(tombstonePath) && tombstonePath !== prior?._file) await unlink(tombstonePath);
  await syncCatalog(repo, resolve(options.catalog), manifest.repoId);
  console.log(`${node.id}\t${node.path ?? "—"}\t${node.symbol ?? "—"}\tactive`);
}

async function buildActiveNode(repo, options, command) {
  if (!options.repo || !options.id || !options.kind || !options.summary) {
    throw new Error(`${command} requires --repo, --id, --kind, and --summary`);
  }
  if (!await exists(repo)) throw new Error(`repository does not exist: ${repo}`);
  if (!ID_PATTERN.test(options.id)) throw new Error("--id must contain lowercase letters, digits, dots, or hyphens");
  if (!KINDS.has(options.kind)) throw new Error(`unknown kind: ${options.kind}`);
  const located = repositoryPath(repo, options.path);
  if (located && !await exists(located.target)) throw new Error(`mapped path does not exist: ${located.relative}`);
  if (located && !await isReallyInside(repo, located.target)) throw new Error("mapped path resolves outside the repository");
  if (["landmark", "flow"].includes(options.kind) && !located) throw new Error(`${options.kind} nodes require --path`);
  if (options.line !== undefined && (!Number.isInteger(Number(options.line)) || Number(options.line) < 1)) throw new Error("--line must be a positive integer");
  if (located && options.symbol && !(await readFile(located.target, "utf8")).includes(options.symbol)) {
    throw new Error(`symbol not found in mapped path: ${options.symbol}`);
  }
  const node = {
    schemaVersion: 1,
    id: options.id,
    kind: options.kind,
    status: "active",
    path: located?.relative,
    symbol: options.symbol,
    lineHint: options.line === undefined ? undefined : Number(options.line),
    summary: options.summary.trim(),
    tags: [...new Set(options.tags)].sort(),
    edges: parseEdges(options.edgeSpecs),
    verifiedRevision: revision(repo),
    verifiedAt: new Date().toISOString(),
    fingerprint: await fingerprint(located?.target),
  };
  return node;
}

async function propose(options) {
  const repo = resolve(options.repo ?? "");
  const node = await buildActiveNode(repo, options, "propose");
  process.stdout.write(renderNode(node, options.note));
}

function edgeProblems(edges, nodeById) {
  return (edges ?? []).flatMap((edge) => {
    const targetNode = nodeById.get(edge.to);
    if (!targetNode) return [`${edge.type}:${edge.to}:missing`];
    if (targetNode.status === "removed" && edge.type !== "supersedes") return [`${edge.type}:${edge.to}:removed`];
    return [];
  });
}

async function refresh(options) {
  if (!options.repo || !options.id) throw new Error("refresh requires --repo and --id");
  const repo = resolve(options.repo);
  const allNodes = await nodesIn(repo);
  const existing = allNodes.find((node) => node.id === options.id);
  if (!existing) throw new Error(`unknown node: ${options.id}`);
  const effective = {
    ...options,
    repo,
    kind: options.kind ?? existing.kind,
    summary: options.summary ?? existing.summary,
    path: options.path ?? existing.path,
    symbol: options.symbol ?? existing.symbol,
    line: options.line ?? existing.lineHint,
    tags: options.tags.length ? options.tags : (existing.tags ?? []),
    edgeSpecs: options.edgeSpecs.length ? options.edgeSpecs : (existing.edges ?? []).map((edge) => `${edge.type}:${edge.to}`),
    note: options.note ?? existing._note,
  };
  const candidate = await buildActiveNode(repo, effective, "refresh");
  const problems = edgeProblems(candidate.edges, new Map(allNodes.map((node) => [node.id, node])));
  if (problems.length) throw new Error(`refresh refused; repair invalid edges first: ${problems.join(",")}`);
  await capture(effective);
}

function matchDetails(node, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const fields = {
    file: basename(node.path ?? "").toLowerCase(),
    id: node.id.toLowerCase(),
    symbol: String(node.symbol ?? "").toLowerCase(),
    path: String(node.path ?? "").toLowerCase(),
    summary: String(node.summary ?? "").toLowerCase(),
    tags: (node.tags ?? []).join(" ").toLowerCase(),
    edges: (node.edges ?? []).map((edge) => `${edge.type} ${edge.to}`).join(" ").toLowerCase(),
  };
  let total = 0;
  const matches = [];
  const add = (term, field, value, weight) => {
    total += weight;
    matches.push({ term, field, value, weight });
  };
  for (const term of terms) {
    if (fields.file === term) add(term, "file-exact", basename(node.path ?? ""), 20);
    if (fields.id === term) add(term, "id-exact", node.id, 16);
    if (fields.symbol === term) add(term, "symbol-exact", String(node.symbol), 16);
    if (fields.path.includes(term)) add(term, "path", String(node.path), 8);
    if (fields.id.includes(term) && fields.id !== term) add(term, "id", node.id, 7);
    if (fields.symbol.includes(term) && fields.symbol !== term) add(term, "symbol", String(node.symbol), 7);
    const tag = (node.tags ?? []).find((candidate) => String(candidate).toLowerCase().includes(term));
    if (tag) add(term, "tag", String(tag), 5);
    const edge = (node.edges ?? []).find((candidate) => `${candidate.type} ${candidate.to}`.toLowerCase().includes(term));
    if (edge) add(term, edge.to.toLowerCase().includes(term) ? "edge-target" : "edge-type", `${edge.type}:${edge.to}`, 3);
    if (fields.summary.includes(term)) add(term, "summary", node.summary, 2);
  }
  return { score: total, matches };
}

async function find(options) {
  if (!options.query) throw new Error("find requires a query");
  const catalog = await readCatalog(resolve(options.catalog));
  const results = catalog.nodes.map((node) => ({ ...node, ...matchDetails(node, options.query) }))
    .filter((node) => node.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, options.limit);
  for (const node of results) {
    node.pathExists = node.path ? await exists(resolve(node.repoRoot, node.path)) : null;
    node.trust = node.status === "active" && node.pathExists !== false ? "verify-before-use" : "stale-or-removed";
  }
  if (options.json) console.log(JSON.stringify(results, null, 2));
  else for (const node of results) {
    const why = node.matches.map((match) => `${match.field}:${match.value}`).join(",");
    console.log(`${node.id}\t${node.status}\t${node.repoRoot}\t${node.path ?? "—"}\t${node.symbol ?? "—"}\t${node.trust}\tmatched-by=${why}`);
  }
  if (!results.length) process.exitCode = 1;
  else if (results.every((node) => node.trust === "stale-or-removed")) process.exitCode = 2;
}

async function verify(options) {
  if (!options.repo) throw new Error("verify requires --repo");
  if (options.replacement && (!options.id || !ID_PATTERN.test(options.replacement))) {
    throw new Error("--replacement requires one --id and a valid replacement node ID");
  }
  const repo = resolve(options.repo);
  await readManifest(repo);
  const allNodes = await nodesIn(repo);
  const nodeById = new Map(allNodes.map((node) => [node.id, node]));
  const nodes = allNodes.filter((node) => !options.id || node.id === options.id);
  if (!nodes.length) throw new Error(options.id ? `unknown node: ${options.id}` : "repository has no Mapify nodes");
  let invalid = 0;
  for (const node of nodes) {
    if (node.status === "removed") {
      console.log(`${node.id}\tremoved\t${node.path ?? "—"}`);
      continue;
    }
    let target = null;
    try {
      target = repositoryPath(repo, node.path)?.target ?? null;
    } catch {
      invalid += 1;
      console.log(`${node.id}\texternal\t${node.path ?? "—"}\tpath-escapes-repository`);
      continue;
    }
    const targetExists = target ? await exists(target) : true;
    if (!targetExists) {
      if (options.tombstoneMissing) {
        const removed = {
          ...cleanNode(node), status: "removed", removedRevision: revision(repo),
          removedAt: new Date().toISOString(), replacement: options.replacement,
        };
        const destination = join(repo, ".mapify", "tombstones", `${node.id}.md`);
        await atomicWrite(destination, renderNode(removed, node._note));
        await unlink(node._file);
        console.log(`${node.id}\tremoved\t${node.path}`);
      } else {
        invalid += 1;
        console.log(`${node.id}\tmissing\t${node.path}`);
      }
      continue;
    }
    if (target && !await isReallyInside(repo, target)) {
      invalid += 1;
      console.log(`${node.id}\texternal\t${node.path}\tpath-escapes-repository`);
      continue;
    }
    const currentFingerprint = await fingerprint(target);
    const source = target && node.symbol ? await readFile(target, "utf8") : "";
    const symbolPresent = !node.symbol || source.includes(node.symbol);
    const unchanged = !node.fingerprint || node.fingerprint === currentFingerprint;
    const problems = edgeProblems(node.edges, nodeById);
    const state = symbolPresent && unchanged && problems.length === 0 ? "valid" : "stale";
    if (state !== "valid") invalid += 1;
    console.log(`${node.id}\t${state}\t${node.path ?? "—"}\t${symbolPresent ? "symbol-ok" : "symbol-missing"}\t${unchanged ? "fingerprint-ok" : "fingerprint-changed"}\t${problems.length ? `edges-${problems.join(",")}` : "edges-linked"}`);
  }
  if (options.tombstoneMissing) await syncCatalog(repo, resolve(options.catalog));
  if (invalid) process.exitCode = 1;
}

async function rebuild(options) {
  if (!options.repo) throw new Error("rebuild requires --repo");
  const repo = resolve(options.repo);
  const catalog = await syncCatalog(repo, resolve(options.catalog), options.repoId);
  console.log(`catalogue: ${resolve(options.catalog)} (${catalog.nodes.length} nodes)`);
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === "find") await find(options);
  else if (command === "propose") await propose(options);
  else if (command === "capture") await capture(options);
  else if (command === "refresh") await refresh(options);
  else if (command === "verify") await verify(options);
  else if (command === "rebuild") await rebuild(options);
  else throw new Error(`unknown command: ${command}`);
} catch (error) {
  console.error(`mapify: ${error.message}`);
  process.exitCode = 1;
}
