/* The shared namespace, the rubric, and the case registry.
   Load order in index.html: core.js → cases/*.js → workbook.js → grader.js → app.js. */
window.CEA = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Case text is plain text plus **bold**. Everything else is escaped, so a case file can't inject markup. */
  const markup = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const plain = (s) => String(s ?? "").replace(/\*\*(.+?)\*\*/g, "$1");

  /* ---------- The rubric: five dimensions, anchored at every level ----------
     {band} in an anchor is replaced with the case's full-credit band.
     A case links each of its considerations to the dimensions it bears on. */
  const RUBRIC = [
    { key: "counterfactual", name: "Counterfactuals and attribution", max: 25, anchors: [
      [25, "Every effect is measured against what would have happened anyway: the baseline is netted out, credit is shared with other actors through an explicit, flagged assumption, and the impact stops when the counterfactual would have caught up."],
      [19, "Baseline and duration are right. Attribution is acknowledged but handled loosely: a share with no reason, or a point made only in a note."],
      [13, "One of the three (baseline, attribution, duration) is handled in the model. The other two are missing or wrong."],
      [6, "Counterfactual thinking appears only in words. The numbers count gross outcomes."],
      [0, "Gross outcomes are counted as impact throughout, with no sign of a counterfactual."]
    ]},
    { key: "mechanics", name: "Model mechanics", max: 25, anchors: [
      [25, "Right base population, all costs included, units and currencies consistent, every discount the data supports applied once, no double counting, formulas trace cleanly to the headline."],
      [19, "One minor slip that moves the headline by less than 1.5×."],
      [13, "One major error that moves the headline by 1.5× or more, such as a missing cost line or the wrong base."],
      [6, "Several major errors, or an arithmetic chain that does not compute what its labels say."],
      [0, "No working calculation reaches a headline."]
    ]},
    { key: "headline", name: "Headline and decision", max: 15, anchors: [
      [15, "Headline is in the requested unit and within the reference band ({band}). The decision against the bar is stated and follows from the number."],
      [11, "Headline within 2.5× of the reference, or outside the band through a defensible, stated difference in structure. Decision stated."],
      [7, "Headline within 4× of the reference with a decision, or within the band but with no decision stated."],
      [3, "Headline more than 4× off, but a decision is stated with its reasoning."],
      [0, "No headline, or the headline is in the wrong unit."]
    ]},
    { key: "uncertainty", name: "Uncertainty and cruxes", max: 15, anchors: [
      [15, "Names the variable the decision turns on, shows how the headline moves with it, and gives the value at which the decision flips."],
      [11, "Names the right crux but does not quantify it; or quantifies sensitivity well but on a secondary driver while still naming the crux."],
      [7, "A list of uncertainties or ranges with no prioritisation, or the wrong variable named as the crux."],
      [3, "A single generic caveat."],
      [0, "A point estimate presented as certain."]
    ]},
    { key: "legibility", name: "Assumptions and legibility", max: 20, anchors: [
      [20, "Every number not in the data pack is visibly marked as an assumption with a reason. Inputs cite their data item. Every row has a label and a unit. No bare numbers inside formulas. A teammate could audit it in five minutes."],
      [15, "Mostly flagged and cited. One or two unlabelled or hard-coded numbers."],
      [10, "Assumptions exist but cannot be told apart from data. Several labels or units missing."],
      [5, "Hard to follow: numbers without labels, logic spread across cells with no order."],
      [0, "Values only, with no visible structure or labels."]
    ]}
  ];

  const BANDS = [
    [90, "Exceptional", "Would stand out in a top work test. Every planted consideration is handled, the decision-relevant unknown is named and quantified, and a teammate could audit the sheet in five minutes."],
    [75, "Strong", "Passes most work tests. The structure is right, with one or two minor gaps."],
    [60, "Solid but flawed", "Mostly the right structure, with one major miss that moves the headline by 1.5× or more or leaves the decision unsupported."],
    [40, "Partial", "Several major misses. The headline is more than 2.5× off, or the decision rests on gross rather than counterfactual impact."],
    [20, "Weak", "Mostly gross outcomes. Errors dominate and the sheet is hard to audit."],
    [1, "Minimal", "No working model or no headline."]
  ];

  const bandFor = (total) => BANDS.find((b) => total >= b[0]) || BANDS[BANDS.length - 1];
  const bandText = (c) => `${c.reference.band[0]} to ${c.reference.band[1]} ${c.metric}`;
  const anchorText = (c, text) => text.replace("{band}", bandText(c));
  /* The considerations a dimension draws on in this case, e.g. "T2, T5, T7". */
  const drawsOn = (c, key) => c.considerations.filter((t) => t.dimensions.includes(key)).map((t) => t.id).join(", ");

  /* ---------- Case registry ---------- */
  const cases = [];
  function registerCase(c) {
    if (!c || !c.id) throw new Error("A case needs an id.");
    if (cases.some((x) => x.id === c.id)) throw new Error(`Two cases share the id "${c.id}".`);
    cases.push(c);
  }
  const getCase = (id) => cases.find((c) => c.id === id) || null;

  return { esc, markup, plain, RUBRIC, BANDS, bandFor, bandText, anchorText, drawsOn, cases, registerCase, getCase };
})();
