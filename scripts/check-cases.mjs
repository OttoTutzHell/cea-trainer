// Checks every case in cases/ against the format in cases/README.md.
//   npm run check
// Exits non-zero on any error, so CI can block a broken case.
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

// Run core.js and the case files the way the page does, with `window` as the global object.
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(read("src/core.js"), sandbox, { filename: "src/core.js" });

const errors = [];
const warnings = [];
const caseFiles = readdirSync(new URL("cases/", root)).filter((f) => f.endsWith(".js")).sort();
const html = read("index.html");
const tagged = [...html.matchAll(/<script src="cases\/([^"]+\.js)"><\/script>/g)].map((m) => m[1]);

for (const f of caseFiles) if (!tagged.includes(f)) errors.push(`index.html has no <script src="cases/${f}"> line, so the page won't load it.`);
for (const f of tagged) if (!caseFiles.includes(f)) errors.push(`index.html loads cases/${f}, which doesn't exist.`);

for (const f of caseFiles) {
  const before = sandbox.CEA.cases.length;
  try {
    vm.runInContext(read("cases/" + f), sandbox, { filename: "cases/" + f });
  } catch (e) {
    errors.push(`cases/${f}: ${e.message}`);
    continue;
  }
  if (sandbox.CEA.cases.length !== before + 1) { errors.push(`cases/${f}: should call CEA.registerCase exactly once.`); continue; }
  checkCase(sandbox.CEA.cases[sandbox.CEA.cases.length - 1], `cases/${f}`);
}

function checkCase(c, where) {
  const err = (m) => errors.push(`${where}: ${m}`);
  const warn = (m) => warnings.push(`${where}: ${m}`);
  const isStr = (x) => typeof x === "string" && x.trim().length > 0;
  const isNum = (x) => typeof x === "number" && Number.isFinite(x);
  const RUBRIC = sandbox.CEA.RUBRIC;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id || "")) err(`id "${c.id}" must be lowercase words joined by hyphens.`);
  if (where !== `cases/${c.id}.js`) err(`the file should be named cases/${c.id}.js to match the id.`);
  for (const k of ["title", "lede", "area", "metric", "author"]) if (!isStr(c[k])) err(`"${k}" must be a non-empty string.`);
  if (!Number.isInteger(c.version) || c.version < 1) err(`"version" must be a whole number from 1. Raise it when the numbers change, so old attempts don't mix with new ones.`);
  if (!Number.isInteger(c.minutes) || c.minutes < 5) err(`"minutes" must be a whole number of at least 5.`);
  if (!isNum(c.bar)) err(`"bar" must be a number in the headline's unit.`);
  if (!Array.isArray(c.brief) || !c.brief.length || !c.brief.every(isStr)) err(`"brief" must be a list of paragraphs.`);

  // Data items: D1, D2, … in order.
  const dataIds = new Set();
  if (!Array.isArray(c.data) || !c.data.length) err(`"data" must be a non-empty list.`);
  else c.data.forEach((d, i) => {
    if (d.id !== `D${i + 1}`) err(`data item ${i + 1} should have id "D${i + 1}", not "${d.id}".`);
    if (!isStr(d.name) || !isStr(d.text)) err(`data item ${d.id} needs a name and a text.`);
    dataIds.add(d.id);
  });

  // The reference model.
  const r = c.reference || {};
  if (!isNum(r.headline)) err(`reference.headline must be a number.`);
  if (!Array.isArray(r.band) || r.band.length !== 2 || !r.band.every(isNum) || !(r.band[0] < r.band[1])) err(`reference.band must be [low, high] with low < high.`);
  else if (isNum(r.headline) && (r.headline < r.band[0] || r.headline > r.band[1])) err(`reference.headline ${r.headline} lies outside reference.band.`);
  if (!Array.isArray(r.steps) || !r.steps.length) err(`reference.steps must be a non-empty list.`);
  else r.steps.forEach((s, i) => {
    if (!isStr(s.step) || !isStr(s.value)) err(`reference step ${i + 1} needs a "step" and a "value".`);
    for (const k of ["working", "source"]) if (typeof s[k] !== "string") err(`reference step ${i + 1}: "${k}" must be a string (use "" if empty).`);
  });
  if (!Array.isArray(r.reasoning) || !r.reasoning.length || !r.reasoning.every(isStr)) err(`reference.reasoning must be a list of paragraphs.`);

  // Considerations: T1, T2, …, each tied to rubric dimensions.
  const keys = RUBRIC.map((d) => d.key);
  if (!Array.isArray(c.considerations) || !c.considerations.length) err(`"considerations" must be a non-empty list.`);
  else {
    c.considerations.forEach((t, i) => {
      if (t.id !== `T${i + 1}`) err(`consideration ${i + 1} should have id "T${i + 1}", not "${t.id}".`);
      if (!isStr(t.name) || !isStr(t.handling)) err(`consideration ${t.id} needs a name and a handling.`);
      if (!Array.isArray(t.dimensions) || !t.dimensions.length) err(`consideration ${t.id} needs "dimensions", one or more of ${keys.join(", ")}.`);
      else for (const k of t.dimensions) if (!keys.includes(k)) err(`consideration ${t.id} names an unknown dimension "${k}".`);
    });
    for (const k of keys) {
      if (k === "legibility") continue;  // judged on the sheet as a whole
      if (!c.considerations.some((t) => t.dimensions?.includes(k))) warn(`no consideration bears on "${k}", so the grader has no case-specific guidance for it.`);
    }
  }

  // Text: plain text plus **bold**. HTML is escaped on the page, so tags would show up literally.
  const texts = [c.title, c.lede, ...(c.brief || []), ...(c.data || []).map((d) => d.text), ...(r.reasoning || []), ...(c.considerations || []).map((t) => t.handling)];
  for (const t of texts.filter((x) => typeof x === "string")) {
    if (/<\/?[a-z][^>]*>/i.test(t)) err(`HTML tags aren't allowed in case text; use **bold**. Found in: "${t.slice(0, 60)}…"`);
    if ((t.match(/\*\*/g) || []).length % 2) err(`unmatched ** in: "${t.slice(0, 60)}…"`);
  }

  // Every D-reference points at a real data item.
  const refs = [...(c.considerations || []).map((t) => t.handling), ...(r.steps || []).map((s) => s.source), ...(r.reasoning || [])];
  for (const t of refs.filter((x) => typeof x === "string")) for (const m of t.matchAll(/\bD(\d+)\b/g)) if (!dataIds.has("D" + m[1])) err(`refers to D${m[1]}, which isn't in the data pack.`);
}

for (const w of warnings) console.log("warning: " + w);
for (const e of errors) console.log("error:   " + e);
const n = sandbox.CEA.cases.length;
if (errors.length) { console.log(`\n${errors.length} error(s) in ${caseFiles.length} case file(s).`); process.exit(1); }
console.log(`${n} case${n === 1 ? "" : "s"} OK: ${sandbox.CEA.cases.map((c) => c.id).join(", ")}.`);
