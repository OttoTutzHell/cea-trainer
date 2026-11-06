// Writes the three calibration sheets for the cage-free case into calibration/.
//   npm run calibration
// Each sheet has a hand-worked answer key in calibration/README.md. Formulas are written with their
// saved values (computed here), since SheetJS doesn't recalculate; Excel and Sheets recalculate on open.
import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "node:fs";

const out = new URL("../calibration/", import.meta.url);
mkdirSync(out, { recursive: true });

/* Rows of cells: a string or number is a value; {f, v} is a formula with its saved value;
   add `note` to either form for a cell comment, and `z` for a number format. */
function sheet(rows, cols) {
  const ws = {};
  let maxC = 0;
  rows.forEach((row, r) => (row || []).forEach((spec, c) => {
    if (spec === null || spec === undefined || spec === "") return;
    const s = typeof spec === "object" ? spec : { v: spec };
    const cell = { v: s.v, t: typeof s.v === "number" ? "n" : typeof s.v === "boolean" ? "b" : "s" };
    if (s.f) cell.f = s.f;
    if (s.z) cell.z = s.z;
    if (s.note) { cell.c = [{ a: "Candidate", t: s.note }]; cell.c.hidden = true; }
    ws[XLSX.utils.encode_cell({ r, c })] = cell;
    maxC = Math.max(maxC, c);
  }));
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: maxC } });
  if (cols) ws["!cols"] = cols.map((wch) => ({ wch }));
  return ws;
}
function save(name, ws) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Model");
  writeFileSync(new URL(name, out), XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  console.log("wrote calibration/" + name);
}
const pct = "0.0%";
const COLS = [44, 16, 22, 22, 70];
const HEAD = ["Label", "Value", "Unit", "Type", "Source or note"];

/* ---------- The shared, correct core of the model ---------- */
const v = {};
v.pledged = 14.0e6; v.cagefree = 2.5e6; v.caged = v.pledged - v.cagefree;
v.bBefore = 0.30; v.bAfter = 0.70; v.cBefore = 0.40; v.cAfter = 0.65;
v.uplift = ((v.bAfter - v.bBefore) + (v.cAfter - v.cBefore)) / 2;
v.countryA = 0.75; v.upliftA = v.uplift * v.countryA;
v.done = 17; v.planned = 20; v.exec = v.done / v.planned;
v.moved = v.caged * v.upliftA * v.exec;
v.years = 7; v.henYears = v.moved * v.years;
v.activities = 350000; v.grantYears = 2; v.fte = 2.5; v.kr = 40000; v.fx = 10; v.months = v.grantYears * 12;
v.cost = v.activities * v.grantYears + v.fte * v.kr / v.fx * v.months;
v.bar = 5;

const core = [
  HEAD,
  ["Pledged hens", v.pledged, "hens", "data", "D3"],
  ["Already cage-free", v.cagefree, "hens", "data", "D3"],
  ["Caged hens under pledge", { f: "B2-B3", v: v.caged }, "hens", "calculated", "Only caged hens can be moved"],
  ["Follow-through before, Country B", { v: v.bBefore, z: pct }, "share of pledged hens", "data", "D5"],
  ["Follow-through after, Country B", { v: v.bAfter, z: pct }, "share of pledged hens", "data", "D5"],
  ["Follow-through before, Country C", { v: v.cBefore, z: pct }, "share of pledged hens", "data", "D5"],
  ["Follow-through after, Country C", { v: v.cAfter, z: pct }, "share of pledged hens", "data", "D5"],
  ["Uplift from comparable campaigns", { f: "AVERAGE(B6-B5,B8-B7)", v: v.uplift, z: pct }, "percentage points", "calculated", "Mean before-and-after change. It sits on top of D4's 35% baseline, so the baseline nets out."],
  ["Effectiveness in Country A vs comparables", v.countryA, "multiplier", "data", "D5: roughly 25% less effective"],
  ["Uplift in Country A", { f: "B9*B10", v: v.upliftA, z: pct }, "percentage points", "calculated", ""],
  ["Campaigns completed", v.done, "campaigns", "data", "D6"],
  ["Campaigns planned", v.planned, "campaigns", "data", "D6"],
  ["Chance the campaign runs as planned", { f: "B12/B13", v: v.exec }, "probability", "calculated", ""],
  ["Extra hens moved by the deadline", { f: "B4*B11*B14", v: v.moved }, "hens", "calculated", ""],
  ["Years each move is brought forward", v.years, "years", "data", "D7. Not the 1.5-year lay period (D9): a place moved 7 years early gives 7 hen-years whoever lives in it."],
  ["Hen-years from the campaign, all groups", { f: "B15*B16", v: v.henYears }, "hen-years", "calculated", ""]
];
const costRows = (r0) => [   // r0 is the 1-based row the cost block starts on
  ["Campaign activities", v.activities, "$ per year", "data", "D1, excludes salaries"],
  ["Grant length", v.grantYears, "years", "data", "D1"],
  ["Campaign staff", v.fte, "FTE", "data", "D2"],
  ["Staff cost", v.kr, "kr per FTE-month", "data", "D2, fully loaded"],
  ["Exchange rate", v.fx, "kr per $", "data", "D2"],
  ["Months per year", 12, "months per year", "data", "Unit conversion"],
  ["Months of staff time", { f: `B${r0 + 1}*B${r0 + 5}`, v: v.months }, "months", "calculated", ""],
  ["Total cost", { f: `B${r0}*B${r0 + 1}+B${r0 + 2}*B${r0 + 3}/B${r0 + 4}*B${r0 + 6}`, v: v.cost }, "$", "calculated", "Activities plus staff"]
];
// With the cost block on rows 20–27, the rows after it are fixed:
// 28 headline, 29 bar, 30 decision.

/* ---------- 1. reference.xlsx: the reference model, typed clean ---------- */
{
  const share = 0.5;
  const attributed = v.henYears * share;
  const headline = attributed / v.cost;
  const breakEven = v.bar * v.cost / v.henYears;
  const rows = [
    ...core,
    ["Open Barn's counterfactual share", share, "share of the outcome", "ASSUMPTION (judgement)", { v: "D8 gives no share. Open Barn is the largest of three groups and coordinates, so above a third; 0.5 is a midpoint guess. Plausible range 0.3 to 0.7.", note: "Flagged: this is the number the decision turns on. See the break-even share below." }],
    ["Hen-years attributable to Open Barn", { f: "B17*B18", v: attributed }, "hen-years", "calculated", ""],
    ...costRows(20),
    ["Hen-years per dollar (headline)", { f: "B19/B27", v: headline }, "hen-years per $", "calculated", ""],
    ["Funder's bar", v.bar, "hen-years per $", "data", "Brief"],
    ["Decision", { f: 'IF(B28>=B29,"Clears the bar","Fails the bar")', v: headline >= v.bar ? "Clears the bar" : "Fails the bar" }, "", "calculated", "Clears at the assumed share; see the crux below"],
    [],
    ["Crux: break-even share for Open Barn", { f: "B29*B27/B17", v: breakEven }, "share of the outcome", "calculated", "The decision turns on B18. The campaign clears the bar only if Open Barn's share is above this."],
    [],
    ["Sensitivity to the share (B18)", "Share", "Hen-years per $"],
    ...[0.25, 0.33, 0.5, 0.7].map((s, i) => [`Share ${s}`, s, { f: `B$17*B${35 + i}/B$27`, v: v.henYears * s / v.cost }]),
    [],
    ["Sensitivity to years brought forward (B16)", "Years", "Hen-years per $"],
    ...[4, 7, 10].map((y, i) => [`${y} years`, y, { f: `B$15*B${41 + i}*B$18/B$27`, v: v.moved * y * share / v.cost }]),
    [],
    ["Left out", "", "", "", "D9's national flock (38M) and the global figure (5bn) play no part in this estimate."]
  ];
  save("reference.xlsx", sheet(rows, COLS));
}

/* ---------- 2. full-credit.xlsx: right mechanics, but full credit to Open Barn and no crux ---------- */
{
  const headline = v.henYears / v.cost;
  const rows = [
    ...core,
    ["Credit given to Open Barn", 1, "share of the outcome", "judgement", "Two other NGOs campaign too (D8), but Open Barn coordinates them, so it gets full credit."],
    ["Hen-years attributable to Open Barn", { f: "B17*B18", v: v.henYears }, "hen-years", "calculated", ""],
    ...costRows(20),
    ["Hen-years per dollar (headline)", { f: "B19/B27", v: headline }, "hen-years per $", "calculated", ""],
    ["Funder's bar", v.bar, "hen-years per $", "data", "Brief"],
    ["Decision", { f: 'IF(B28>=B29,"Clears the bar","Fails the bar")', v: headline >= v.bar ? "Clears the bar" : "Fails the bar" }, "", "calculated", ""],
    [],
    ["Main uncertainties", "", "", "", "The size of the uplift; how many years the change is brought forward; whether the campaign runs as planned."]
  ];
  save("full-credit.xlsx", sheet(rows, COLS));
}

/* ---------- 3. naive.xlsx: gross outcomes, sparse labels, numbers inside formulas ---------- */
{
  const hens = 14.0e6, rate = 0.7;
  const moved = hens * rate, henYears = moved * 7, cost = 350000 * 2;
  const rows = [
    ["Cage-free campaign"],
    ["Hens", hens],
    ["Follow-through", rate],
    ["Hens moved", { f: "B2*B3", v: moved }],
    ["Years", { f: "B4*7", v: henYears }],
    ["Cost", { f: "350000*2", v: cost }],
    ["Per dollar", { f: "B5/B6", v: henYears / cost }],
    ["Clears bar", { f: "B7>5", v: henYears / cost > 5 }]
  ];
  save("naive.xlsx", sheet(rows, [20, 14]));
}

console.log(`reference headline ${(v.henYears * 0.5 / v.cost).toFixed(2)}, full-credit ${(v.henYears / v.cost).toFixed(2)}, naive ${(14e6 * 0.7 * 7 / 700000).toFixed(1)} hen-years per $`);
