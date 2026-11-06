# Writing a case

A case is one JavaScript file in this folder that calls `CEA.registerCase({...})`. The page lists every case it loads. [`cage-free-pledges.js`](cage-free-pledges.js) is the worked example.

## Adding one

1. Copy `cage-free-pledges.js` to `cases/<your-id>.js`. The file name must match the `id`.
2. Add a line for it to `index.html`, next to the existing one:
   ```html
   <script src="cases/your-id.js"></script>
   ```
3. Run `npm run check`. It catches missing fields, misnumbered items, unknown dimensions, references to data items that don't exist, and a case file `index.html` doesn't load.
4. Solve the case blind, or have someone else do it, before you trust the reference model. See [What makes a good case](#what-makes-a-good-case).
5. Open a pull request.

## The fields

| Field | What it holds |
|---|---|
| `id` | Lowercase words joined by hyphens, e.g. `lead-paint-advocacy`. Also the file name |
| `version` | A whole number from 1. Raise it when the numbers change, so saved attempts on the old version don't mix with new ones |
| `title`, `lede`, `area` | The case card: a title, one sentence, and a cause area such as "Global health" |
| `minutes` | The time cap |
| `metric` | The headline unit, in words: `"DALYs averted per $1,000"` |
| `bar` | The funder's bar, in the headline unit |
| `author` | Who wrote it |
| `brief` | The task, as a list of paragraphs: the role, the decision the model serves, the metric and the bar, what the sheet must show, and the polish level |
| `data` | The data pack: `{ id, name, text }` items numbered `D1`, `D2`, … in order |
| `reference` | The author's model: `headline` (a number), `band` (`[low, high]`, the full-credit range), `steps` (`{ step, working, value, source }` rows ending in the headline), and `reasoning` (paragraphs: the crux and its break-even value, the next drivers, why the traps are traps, and the accepted alternatives) |
| `considerations` | What the case plants: `{ id, name, handling, dimensions }` items numbered `T1`, `T2`, …. `handling` says what correct handling looks like. `dimensions` lists the rubric dimensions it bears on: `counterfactual`, `mechanics`, `headline`, `uncertainty` (legibility is judged on the sheet as a whole) |

Text fields are plain text, plus `**bold**`. HTML is escaped, so tags would show up literally.

## What makes a good case

- **The data pack is messy on purpose.** Conflicting sources, a distractor statistic, mixed units or currencies, and at least one value it doesn't give, which forces a flagged assumption.
- **The decision turns on something.** Put the bar where a careful model's answer depends on the withheld value or a judgement call, and give the break-even value in `reasoning`.
- **The band is wide enough for defensible disagreement.** Cage-free's band runs from a 0.33 to a 0.75 share. A band that only the author's exact choices hit rewards agreement with the author, not skill.
- **Not every case plants every trap.** The anchors already penalise adjustments the data doesn't support. A case that leaves out double counting, say, tests whether people apply discounts by checklist.
- **Accepted alternatives are written down.** If there's a reasonable different structure, say so in the last `reasoning` paragraph. The grader is told to accept it.
- **It's fictional, or it uses public data only.** Never put a real organisation's confidential work-test material in a case. Invented names (Open Barn, Country A) avoid implying claims about real groups.
- **Someone has solved it blind.** Before a case is merged, a second person builds the model without seeing the reference. If their headline falls outside the band for a defensible reason, widen the band or add the alternative.
