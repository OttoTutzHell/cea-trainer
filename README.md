# CEA Work Test Trainer

Timed practice for the cost-effectiveness analysis work tests that effective-altruism research organisations, funders and incubators set candidates. You get a brief and a messy data pack, and a clock starts. You build the model in Excel or Google Sheets and hand in the file. Claude grades it from 1 to 100 against written anchors, says which planted considerations you handled, and names the one fix that would raise your score most.

**Use it:** https://ottotutzhell.github.io/cea-trainer/

It is a single static page with no backend and no build step. Grading uses your own Anthropic API key, sent from your browser straight to the Claude API. Without a key, you can copy the grading prompt into any Claude chat and paste the reply back.

## A session

1. **Pick a case.** The card shows the topic, the time cap and the headline metric, but not the brief.
2. **Start the clock.** The brief and the data pack appear, and reading counts toward the time, as it does in a real test. Download the data pack as an .xlsx, or copy it as a table into Sheets.
3. **Build the model** in your own spreadsheet. Cite data items by their IDs (D1, D2…) and flag every number you had to assume.
4. **Hand in** the .xlsx (in Sheets: File → Download → Microsoft Excel). The page reads every filled cell: values, formulas and cell comments. The clock stops at hand-in.
5. **Read the feedback:** the total and its band, each dimension's score with the anchor it matched and the cells cited as evidence, each planted consideration marked handled, partial or missed, two strengths, the priority fix, and the reference model with its reasoning.

## How the score is built

Five dimensions, each anchored at five levels. The grader finds the highest anchor whose description is fully met, and may score between anchors only when the work is clearly partway. The page adds up the total itself, so the grader's arithmetic can't move it.

| Dimension | Points | What full marks takes |
|---|---|---|
| Counterfactuals and attribution | 25 | The baseline netted out, credit shared with other actors through a flagged assumption, and impact that stops when the counterfactual catches up |
| Model mechanics | 25 | The right base, every cost, consistent units, each supported discount applied once, no double counting |
| Headline and decision | 15 | A headline in the requested unit inside the case's full-credit band, with a decision against the bar |
| Uncertainty and cruxes | 15 | The variable the decision turns on, how the headline moves with it, and the value where the decision flips |
| Assumptions and legibility | 20 | Every assumption flagged with a reason, every input cited, labels and units on every row, and a sheet a teammate could audit in five minutes |

Reasoning outweighs matching the number: counterfactuals and mechanics carry half the score, while closeness to the reference is worth at most 15. Time is reported next to the score and never folded into it. Every anchor is on the page, and in [`src/core.js`](src/core.js).

The rubric targets the mistakes graders name most often in these tests, such as counting gross outcomes as impact, giving one organisation full credit for a shared result, and treating impact as permanent. It draws on the list of common CEA mistakes in [Ambitious Impact](https://www.ambitiousimpact.org/)'s (formerly Charity Entrepreneurship) incubation handbook.

## Your API key

- The key is kept in this browser's session storage, and cleared when you close the tab. Tick "remember" to keep it in local storage instead. **Forget key** removes it from both.
- It is sent only to `api.anthropic.com`. The page's Content-Security-Policy blocks every other destination for data, and the page loads no third-party scripts: SheetJS and the Anthropic SDK are vendored in [`vendor/`](vendor/). The fonts come from Google Fonts.
- Grading runs on Claude Opus 5.5 at high effort. One grading usually costs 10–35 US cents, billed to your Anthropic account, and the result shows the exact token count. Make a key in the [Claude Console](https://platform.claude.com/settings/keys).
- Because the key sits in the page, use one with a spending limit, and don't paste it into a copy of this page hosted somewhere you don't trust.

## How far to trust a score

- **A language model grades it.** The same sheet can score a few points differently on two runs. Treat one total as ±5, and read trends across three or more attempts.
- **Check the grader first.** [`calibration/`](calibration/) has three sheets with hand-worked answer keys (a clean reference model, a full-credit model and a naive one) and a five-minute protocol. If the grader misses the ranges, don't rely on its scores.
- **The reference model ships in the page.** Anyone can read it in the source. That's fine for self-practice, and it means a case is worth one honest attempt.
- **A second attempt at the same case measures memory as well as skill.** More cases are the fix.
- **Cell colours usually aren't readable.** If you colour-code, add a column that says what each row is.

## Cases

| Case | Area | Time | Headline |
|---|---|---|---|
| [Cage-free pledge follow-through](cases/cage-free-pledges.js) | Animal welfare | 60 min | cage-free hen-years per dollar |

New cases are welcome. [`cases/README.md`](cases/README.md) has the format and what makes a good case. All cases are fictional or built from public data. None uses any organisation's real work-test material.

## Running it locally

Any static file server works. With Node installed, from the repo folder:

```bash
node scripts/serve.mjs
```

Then open http://localhost:8080.

## Development

```
index.html          the page
assets/             styles and icon
src/core.js         the rubric, the bands and the case registry
src/workbook.js     reading the hand-in, writing the data pack
src/grader.js       the prompt, the reply schema and the Claude API call
src/app.js          stages, clock, hand-in and results
cases/              one file per case
calibration/        sheets with answer keys for checking the grader
scripts/            the case checker, vendor build, calibration builder and local server
vendor/             SheetJS and the Anthropic SDK, built from package.json's pinned versions
```

```bash
npm install          # only needed for the scripts below
npm run check        # check every case file
npm run vendor       # rebuild vendor/ after changing a pinned version
npm run calibration  # rebuild the calibration sheets
```

CI runs `npm run check` on every push and pull request.

## Licence

MIT, for the code and the cases. The vendored SheetJS Community Edition and Anthropic TypeScript SDK are Apache-2.0; their licences are in [`vendor/`](vendor/).

Built by Otto Tutzauer Hellström. Not affiliated with Anthropic or with any organisation whose work tests it imitates.
