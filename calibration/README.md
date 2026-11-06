# Calibrating the grader

A language model grades the hand-ins, so check it before you trust its scores. These three sheets for the cage-free case each have an answer key: the score the anchors give when a person applies them by hand. Grade all three and compare.

The sheets are built by `npm run calibration` (`scripts/make-calibration.mjs`), so their formulas and values can be read in the script.

## The three sheets

| Sheet | What it is | Headline | Key total | Pass range |
|---|---|---|---|---|
| [`reference.xlsx`](reference.xlsx) | The reference model typed clean: flagged share, break-even, two sensitivity tables, every input cited | 8.87 | 100 | 90–100 |
| [`full-credit.xlsx`](full-credit.xlsx) | The same mechanics, but Open Barn gets full credit and the uncertainties are an unranked list | 17.7 | 77–82 | 70–88 |
| [`naive.xlsx`](naive.xlsx) | Gross outcomes: all 14.0M hens, 70% follow-through as the effect, no staff cost, no discounts, sparse labels, numbers inside formulas | 98 | 20–27 | 15–35 |

## The answer keys

**`reference.xlsx`: 100**

| Dimension | Anchor | Why |
|---|---|---|
| Counterfactuals and attribution | 25 | The uplift nets out the baseline (B9), the share is an explicit flagged assumption (B18), and the impact lasts the 7 years in D7 (B16) |
| Model mechanics | 25 | 11.5M caged hens (B4), $940k with staff (B27), the 0.75 and 0.85 discounts applied once, D9 left out |
| Headline and decision | 15 | 8.87 is inside the 5.9–13.3 band, and B30 states the decision |
| Uncertainty and cruxes | 15 | Names the share as the crux, gives the break-even of 0.28 (B32), and shows the headline across shares and years |
| Assumptions and legibility | 20 | Every input cited, the one assumption flagged with a reason, labels and units on every row, no bare numbers in formulas |

**`full-credit.xlsx`: 77–82**

| Dimension | Anchor | Why |
|---|---|---|
| Counterfactuals and attribution | 19 | Baseline and duration are right. Attribution is acknowledged (B18, E18) but handled loosely: full credit, which no counterfactual argument supports |
| Model mechanics | 25 | The same correct chain as the reference |
| Headline and decision | 11 | 17.7 is 2.0× the reference: outside the band, within 2.5×, with a decision |
| Uncertainty and cruxes | 7 | A list of uncertainties with no ranking, and the variable the decision turns on (attribution) isn't among them |
| Assumptions and legibility | 15–20 | Clean and cited. The full-credit row is typed "judgement" with a reason, but it is not flagged as an assumption |

**`naive.xlsx`: 20–27**

| Dimension | Anchor | Why |
|---|---|---|
| Counterfactuals and attribution | 6–13 | Only the duration (7 years, inside B5's formula) is counterfactual. The 70% counts hens that would have moved anyway, and Open Barn gets full credit |
| Model mechanics | 6 | Several errors that compound to 11×: the 14.0M base, no staff cost, no generalisability or execution discount. B5 is labelled "Years" but holds hen-years |
| Headline and decision | 0–3 | 98 is 11× the reference. B8 states a decision, with no reasoning |
| Uncertainty and cruxes | 0 | A point estimate presented as certain |
| Assumptions and legibility | 5 | Bare labels, no units or sources, and numbers inside formulas |

## The protocol

1. Open the cage-free case, start the clock, and hand in `reference.xlsx`. Note the total.
2. Do the same for `full-credit.xlsx` and `naive.xlsx`.
3. Hand in one of the three a second time.

**The grader passes when:**
- each total falls in its pass range;
- the order is right: reference above full-credit above naive;
- the repeat lands within 5 points of the first grading.

If it fails, don't rely on the scores. [Open an issue](https://github.com/OttoTutzHell/cea-trainer/issues) with the sheet, the total, and the dimension that was off. The keys are the author's reading of the anchors. If you think a key is wrong rather than the grader, say so in the issue.

The time used doesn't affect the score, so it doesn't matter how long you leave the clock running.
