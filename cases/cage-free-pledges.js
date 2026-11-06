/* Case: cage-free pledge follow-through. Fictional: Open Barn and Countries A, B and C are invented.
   Format: cases/README.md. Check it with `npm run check`. */
CEA.registerCase({
  id: "cage-free-pledges",
  version: 1,
  title: "Cage-free pledge follow-through",
  lede: "A two-year corporate campaign in Country A, asking whether it clears a funder's bar.",
  area: "Animal welfare",
  minutes: 60,
  metric: "cage-free hen-years per dollar",
  bar: 5,
  author: "Otto Tutzauer Hellström",

  brief: [
    "You are a research analyst at a foundation. **Open Barn**, an animal-advocacy NGO in Country A, asks for a two-year grant to push 31 egg buyers to honour the cage-free pledges they have already made.",
    "Build a back-of-the-envelope cost-effectiveness estimate in a spreadsheet. The headline is **cage-free hen-years per dollar**. The foundation funds campaigns that clear **5 hen-years per dollar**.",
    "Your sheet should show: the headline, whether the campaign clears the bar, and the two or three things the answer depends on most.",
    "It has to be understandable by others on the team, but it does not need to be polished. If information is missing, make an assumption and flag it."
  ],

  data: [
    { id: "D1", name: "Grant request", text: "$350,000 per year for 2 years, for campaign activities (events, research, ads, travel). Salaries are funded separately and are **not** included in this figure." },
    { id: "D2", name: "Staff", text: "2.5 FTE of campaign staff for both years. Fully loaded cost is **40,000 kr per FTE per month**. Exchange rate: 10 kr = $1." },
    { id: "D3", name: "Pledges", text: "31 companies in Country A have public pledges to source only cage-free eggs by the deadline, which falls at the end of the campaign's second year. Together they source from **14.0 million laying hens**, of which **2.5 million are already cage-free**." },
    { id: "D4", name: "Industry forecast", text: "Without new campaigning, an industry analyst expects **35%** of the pledged hens that are still caged to be cage-free by the deadline." },
    { id: "D5", name: "Comparable campaigns", text: "After a similar two-year campaign, follow-through rose from **30% to 70%** in Country B and from **40% to 65%** in Country C. An analyst notes that B and C have more concentrated grocery retail, which makes pressure campaigns easier, and expects a campaign in Country A to be **roughly 25% less effective**." },
    { id: "D6", name: "Track record", text: "Of Open Barn's last 20 planned campaigns, **17** ran to completion as planned." },
    { id: "D7", name: "Counterfactual timing", text: "Analysts expect the industry would have moved these hens to cage-free anyway, about **7 years after the deadline**, as retailers converge on the same standard." },
    { id: "D8", name: "Other groups", text: "Two other NGOs campaign on the same pledges. Open Barn is the largest of the three and coordinates their joint actions." },
    { id: "D9", name: "Context", text: "Country A has 38 million laying hens in total. There are about 5 billion caged hens worldwide. A laying hen is typically kept for about 1.5 years." }
  ],

  reference: {
    headline: 8.9,
    band: [5.9, 13.3],
    steps: [
      { step: "Caged hens under pledge", working: "14.0M − 2.5M", value: "11.5M", source: "D3" },
      { step: "Uplift from a campaign", working: "mean(70−30, 65−40) = 32.5 pp", value: "32.5 pp", source: "D5" },
      { step: "Adjusted for Country A", working: "32.5 pp × 0.75", value: "24.4 pp", source: "D5" },
      { step: "Chance it runs as planned", working: "17 / 20", value: "0.85", source: "D6" },
      { step: "Extra hens moved by the deadline", working: "11.5M × 24.4% × 0.85", value: "2.38M", source: "" },
      { step: "Years each move is brought forward", working: "", value: "7", source: "D7" },
      { step: "Hen-years from the campaign (all groups)", working: "2.38M × 7", value: "16.7M", source: "" },
      { step: "Open Barn's counterfactual share", working: "assumption, flagged", value: "0.5", source: "D8" },
      { step: "Hen-years attributable to Open Barn", working: "16.7M × 0.5", value: "8.34M", source: "" },
      { step: "Cost", working: "$700k + 2.5 × $4,000 × 24", value: "$940k", source: "D1, D2" },
      { step: "Hen-years per dollar", working: "8.34M / $940k", value: "≈ 8.9", source: "" }
    ],
    reasoning: [
      "The decision turns on D8, the one number the pack withholds. The campaign clears the bar if Open Barn's counterfactual share is above about 0.28 (5 × $940k / 16.7M). At 0.33 it gives 5.9; at 0.25 it gives 4.4. A good memo names D8 as the decision-relevant unknown and shows where it crosses the bar.",
      "The next drivers are the 7-year speed-up (at 4 years the headline is about 5.1) and the size of the uplift.",
      "The 35% forecast in D4 is what happens without the campaign. The comparables in D5 are before-and-after changes, so the campaign's effect is their percentage-point uplift, applied to caged hens only. Adding the uplift to 35% and then subtracting 35% again gives the same answer. Using 70% or 65% as the share of hens the campaign moves counts hens that would have moved anyway.",
      "D9 is context. The 1.5-year lay period does not shorten the impact: a housing place that is cage-free 7 years earlier gives 7 hen-years whoever lives in it.",
      "Accepted alternatives: a share between 0.3 and 0.7 with a reason; arguing the comparables already include execution risk and leaving D6 out, if stated; a range or Monte Carlo instead of one share."
    ]
  },

  considerations: [
    { id: "T1", name: "Already cage-free hens excluded", dimensions: ["mechanics"], handling: "The base is the 11.5M caged hens, not all 14.0M pledged hens (D3)." },
    { id: "T2", name: "Counterfactual baseline", dimensions: ["counterfactual"], handling: "The effect is the change against what would happen anyway (D4, D5): a percentage-point uplift, not an absolute follow-through rate." },
    { id: "T3", name: "Generalisability discount", dimensions: ["mechanics"], handling: "The comparables come from easier countries. The 25% reduction in D5 is applied, or a justified alternative is used." },
    { id: "T4", name: "Execution risk", dimensions: ["mechanics"], handling: "The 17-of-20 track record (D6) is applied, or leaving it out is argued explicitly." },
    { id: "T5", name: "Attribution among groups", dimensions: ["counterfactual"], handling: "Open Barn does not get full credit for an outcome three groups produce (D8). A share is an explicit, flagged assumption, ideally with what it would take to change the decision." },
    { id: "T6", name: "Full costs, in dollars", dimensions: ["mechanics"], handling: "Staff costs are added (D2), converted from kr per month to dollars over 24 months: $240k on top of $700k." },
    { id: "T7", name: "Impact duration", dimensions: ["counterfactual"], handling: "Impact lasts the 7 years the change is brought forward (D7). It is not permanent, and it is not cut to the 1.5-year lay period (D9)." },
    { id: "T8", name: "Distractors left out", dimensions: ["mechanics"], handling: "The national flock and the global figure in D9 play no part in the estimate." },
    { id: "T9", name: "Decision and crux", dimensions: ["headline", "uncertainty"], handling: "The sheet states whether the bar is cleared and names the variable the decision turns on, ideally with the break-even value." }
  ]
});
