/* The page: routing between stages, the clock, hand-in, scoring and the result. */
(() => {
  const { esc, markup, RUBRIC, BANDS, bandFor, anchorText, drawsOn, cases, getCase, workbook, grader } = CEA;
  const $ = (id) => document.getElementById(id);

  /* ---------- Storage: every access can throw (private windows, blocked site data) ---------- */
  const HKEY = "cea-trainer:history";
  const APIKEY = "cea-trainer:api-key";
  const stateKey = (c) => `cea-trainer:case:${c.id}:v${c.version || 1}`;
  const area = (name) => { try { return window[name]; } catch { return null; } };
  function load(k, d, where = "localStorage") { try { const v = area(where)?.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
  function save(k, v, where = "localStorage") { try { area(where)?.setItem(k, JSON.stringify(v)); } catch {} }
  function drop(k, where = "localStorage") { try { area(where)?.removeItem(k); } catch {} }

  const blank = () => ({ startedAt: null, handedInAt: null, result: null, meta: null });
  let current = null;     // the open case
  let state = blank();    // its attempt: clock, result
  let sheet = null;       // the uploaded workbook, as read
  let controller = null;  // aborts a grading in flight

  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const minutesUsed = () => (state.startedAt ? Math.round(((state.handedInAt || Date.now()) - state.startedAt) / 60000) : null);

  /* ---------- Stages and routing ---------- */
  function show(stage) {
    for (const s of ["Library", "Intro", "Work", "Result"]) $("stage" + s).hidden = s.toLowerCase() !== stage;
    $("clock").hidden = stage === "library";
    window.scrollTo({ top: 0 });
  }

  function route() {
    const m = location.hash.match(/^#\/case\/([\w-]+)/);
    const c = m && getCase(m[1]);
    if (c) openCase(c); else openLibrary();
  }
  window.addEventListener("hashchange", route);

  function openLibrary() {
    current = null;
    $("caseShort").textContent = "";
    document.title = "CEA Work Test Trainer";
    $("caseList").innerHTML = cases.map((c) => `
      <a class="case" href="#/case/${esc(c.id)}">
        <h2>${esc(c.title)}</h2>
        <p>${esc(c.lede)}</p>
        <div class="meta">${chips(c)}</div>
      </a>`).join("") || `<p class="note">No cases are loaded.</p>`;
    $("rubricLibrary").innerHTML = rubricHTML(null);
    renderHistory();
    show("library");
  }

  function openCase(c) {
    if (current !== c) { current = c; sheet = null; resetHandIn(); }
    state = load(stateKey(c), blank());
    $("caseShort").textContent = c.area;
    document.title = `${c.title} · CEA Work Test Trainer`;
    renderCase(c);
    tick();
    if (state.result) { renderResult(c, state.result, state.meta); show("result"); }
    else { updateStartButton(); show("intro"); }
  }

  const chips = (c) => [c.area, c.minutes + " minutes", "Headline: " + c.metric, "Hand in: one spreadsheet"].map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  /* ---------- The case and its rubric ---------- */
  function rubricHTML(c) {
    const dims = RUBRIC.map((d) => {
      const on = c ? drawsOn(c, d.key) : "";
      const rows = d.anchors.map(([pts, text]) => `<tr><td>${pts}</td><td>${esc(c ? anchorText(c, text) : text.replace("{band}", "the case's full-credit band"))}</td></tr>`).join("");
      return `<div><h3>${esc(d.name)} · ${d.max} points</h3>
        <div class="tablebox"><table><tbody>${rows}</tbody></table></div>
        <p class="note">Scores between anchors are allowed.${on ? " Draws on " + esc(on) + "." : ""}</p></div>`;
    }).join("");
    const bands = BANDS.map(([min, name, text], i) => {
      const hi = i === 0 ? 100 : BANDS[i - 1][0] - 1;
      return `<tr><td>${min}–${hi}</td><td><b>${esc(name)}.</b> ${esc(text)}</td></tr>`;
    }).join("");
    return dims + `<div><h3>What the total means</h3><div class="tablebox"><table><tbody>${bands}</tbody></table></div>
      <p class="note">The total is the sum of the five dimensions, with a floor of 1. Time is reported next to the score and never folded into it.</p></div>`;
  }

  function renderCase(c) {
    $("caseTitle").textContent = c.title;
    $("caseTitle2").textContent = c.title;
    $("caseLede").textContent = c.lede;
    $("caseMeta").innerHTML = chips(c);
    $("briefPanel").innerHTML = c.brief.map((p) => `<p>${markup(p)}</p>`).join("");
    $("dataItems").innerHTML = c.data.map((d) => `<li><span class="id">${esc(d.id)}</span><div><b>${esc(d.name)}.</b> ${markup(d.text)}</div></li>`).join("");
    $("rubricIntro").innerHTML = rubricHTML(c);
    $("rubricResult").innerHTML = rubricHTML(c);
    $("modelName").textContent = grader.MODEL_NAME;
  }

  function renderHistory() {
    const h = load(HKEY, []);
    $("historyPanel").hidden = h.length === 0;
    if (!h.length) return;
    $("historyTable").innerHTML = `<thead><tr><th>When</th><th>Case</th><th>Score</th><th>Time</th><th>Graded by</th></tr></thead><tbody>${h.slice().reverse().map((a) =>
      `<tr><td>${esc(new Date(a.when).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }))}</td><td>${esc(a.title)}</td><td class="num">${esc(a.total)}</td><td class="num">${esc(a.time)}</td><td>${esc(a.via || "")}</td></tr>`).join("")}</tbody>`;
  }

  /* ---------- Clock ---------- */
  function tick() {
    const el = $("clock");
    if (!current) return;
    const cap = current.minutes * 60000;
    if (!state.startedAt) { el.textContent = mmss(cap); el.className = "clock"; return; }
    const used = (state.handedInAt || Date.now()) - state.startedAt;
    if (used <= cap) {
      el.textContent = mmss(cap - used) + (state.handedInAt ? " left at hand-in" : " left");
      el.className = "clock " + (state.handedInAt ? "" : used > cap * 0.8 ? "late" : "running");
    } else {
      el.textContent = "+" + mmss(used - cap) + " over";
      el.className = "clock over";
    }
  }
  setInterval(tick, 1000);

  function timeLine(c, s) {
    if (!s.startedAt || !s.handedInAt) return "";
    const used = s.handedInAt - s.startedAt;
    const min = Math.round(used / 60000);
    const over = used - c.minutes * 60000;
    return over > 0 ? `Took ${min} min, ${Math.round(over / 60000)} over the ${c.minutes}-minute cap.` : `Took ${min} of ${c.minutes} minutes.`;
  }

  function updateStartButton() {
    const resuming = state.startedAt && !state.result;
    $("startBtn").textContent = resuming ? "Resume (the clock kept running)" : `Start the ${current.minutes}-minute clock`;
    $("resumeNote").hidden = !resuming;
    if (resuming) $("resumeNote").textContent = "Started " + new Date(state.startedAt).toLocaleTimeString([], { timeStyle: "short" }) + ".";
  }

  $("startBtn").onclick = () => {
    if (!state.startedAt || state.result) state = { ...blank(), startedAt: Date.now() };
    save(stateKey(current), state);
    show("work");
    tick();
  };
  $("againBtn").onclick = () => {
    state = blank();
    save(stateKey(current), state);
    sheet = null;
    resetHandIn();
    updateStartButton();
    show("intro");
    tick();
  };
  function handIn() {
    if (!state.handedInAt) { state.handedInAt = Date.now(); save(stateKey(current), state); tick(); }
  }

  /* ---------- Data pack ---------- */
  $("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(workbook.dataTSV(current)); $("dlNote").textContent = "Copied. Paste it into cell A1 of a new sheet."; }
    catch { $("dlNote").textContent = "Copying was blocked here. Select the items on the page and copy them by hand."; }
  };
  $("dlBtn").onclick = () => {
    try { workbook.downloadDataPack(current); $("dlNote").textContent = "Downloaded. The Model tab is a blank layout you can use or ignore."; }
    catch { $("dlNote").textContent = "The spreadsheet library didn't load. Use Copy as table instead."; }
  };

  /* ---------- Reading the hand-in ---------- */
  function resetHandIn() {
    $("fileInfo").hidden = true;
    $("fileInput").value = "";
    $("scoreBtn").disabled = true;
    $("copyPromptBtn").disabled = true;
    $("copyPromptBtn").textContent = "Copy the grading prompt";
    $("scoreStatus").hidden = true;
    $("pasteBack").value = "";
    $("pasteErr").hidden = true;
  }
  async function readFile(file) {
    $("fileInfo").hidden = false;
    try {
      const d = await workbook.read(file);
      sheet = d;
      const n = (k, word) => `${k} ${word}${k === 1 ? "" : "s"}`;
      $("fileInfo").textContent = `${file.name}: ${n(d.sheets, "sheet")}, ${n(d.cells, "filled cell")}, ${n(d.formulas, "formula")}, ${n(d.comments, "comment")}.${d.truncated ? " It is very large, so only the first part will be graded." : ""}`;
      $("scoreBtn").disabled = false;
      $("copyPromptBtn").disabled = false;
    } catch (e) {
      sheet = null;
      $("scoreBtn").disabled = true;
      $("copyPromptBtn").disabled = true;
      $("fileInfo").innerHTML = `<span class="err">${esc(
        e.message === "empty" ? "That file has no filled cells." :
        e.message === "no_library" ? "The spreadsheet library didn't load, so the file can't be read. Reload the page and try again." :
        "That file couldn't be read as a spreadsheet. Save it as .xlsx and try again.")}</span>`;
    }
  }
  const dropZone = $("drop");
  $("fileInput").onchange = (e) => e.target.files[0] && readFile(e.target.files[0]);
  dropZone.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("fileInput").click(); } };
  dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("over"); };
  dropZone.ondragleave = () => dropZone.classList.remove("over");
  dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) readFile(f); };

  /* ---------- The API key: session storage by default, local storage only if asked ---------- */
  function loadKey() {
    const remembered = load(APIKEY, "");
    $("rememberKey").checked = Boolean(remembered);
    $("apiKey").value = remembered || load(APIKEY, "", "sessionStorage");
  }
  function storeKey() {
    const key = $("apiKey").value.trim();
    drop(APIKEY); drop(APIKEY, "sessionStorage");
    if (!key) return;
    if ($("rememberKey").checked) save(APIKEY, key); else save(APIKEY, key, "sessionStorage");
  }
  $("rememberKey").onchange = storeKey;
  $("apiKey").onchange = storeKey;
  $("forgetKey").onclick = () => { $("apiKey").value = ""; $("rememberKey").checked = false; storeKey(); };

  /* ---------- Scoring with the key ---------- */
  function status(text) { $("scoreStatus").hidden = false; $("scoreStatus").textContent = text; }
  $("scoreBtn").onclick = async () => {
    if (!sheet) return;
    const apiKey = $("apiKey").value.trim();
    if (!apiKey) { status("Paste your Anthropic API key above first, or score it in a Claude chat below."); $("apiKey").focus(); return; }
    storeKey();
    handIn();
    controller = new AbortController();
    $("scoreBtn").disabled = true;
    $("stopBtn").hidden = false;
    const c = current;
    try {
      const out = await grader.grade({
        apiKey, c, sheet: sheet.text, minutes: minutesUsed(), signal: controller.signal,
        onProgress: (phase, chars) => status(
          phase === "sent" ? "Handed in. Claude is reading your sheet." :
          phase === "thinking" ? "Claude is working through the rubric. This usually takes one to three minutes." :
          `Writing your feedback (${chars.toLocaleString()} characters so far).`)
      });
      if (current !== c) return;
      finish(c, grader.normalise(c, out.reply), { via: "api", model: out.model, usage: out.usage, cost: out.cost });
    } catch (e) {
      status(e.message || "Scoring failed.");
      if (e.code !== "cancelled" && e.code !== "auth") $("fallback").open = true;
    } finally {
      $("scoreBtn").disabled = !sheet;
      $("stopBtn").hidden = true;
      controller = null;
    }
  };
  $("stopBtn").onclick = () => controller?.abort();

  /* ---------- Scoring in a Claude chat ---------- */
  $("copyPromptBtn").onclick = async () => {
    if (!sheet) return;
    handIn();
    const prompt = grader.chatPrompt(current, sheet.text, minutesUsed());
    try { await navigator.clipboard.writeText(prompt); $("copyPromptBtn").textContent = "Copied"; }
    catch { $("pasteBack").value = prompt; $("pasteBack").select(); $("copyPromptBtn").textContent = "Selected below. Copy it by hand"; }
  };
  $("pasteBtn").onclick = () => {
    const raw = $("pasteBack").value;
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    let reply;
    try { reply = JSON.parse(raw.slice(s, e + 1)); } catch { reply = null; }
    if (!reply || !Array.isArray(reply.dimensions)) {
      $("pasteErr").hidden = false;
      $("pasteErr").textContent = "That isn't the JSON reply. Paste only Claude's answer, starting with {.";
      return;
    }
    $("pasteErr").hidden = true;
    handIn();
    finish(current, grader.normalise(current, reply), { via: "chat" });
  };

  /* ---------- The result ---------- */
  function finish(c, result, meta) {
    state.result = result;
    state.meta = meta;
    save(stateKey(c), state);
    const h = load(HKEY, []);
    h.push({
      when: Date.now(), caseId: c.id, title: c.title, total: result.total,
      time: timeLine(c, state).replace(/^Took /, "").replace(/\.$/, "") || "unknown",
      via: meta.via === "api" ? meta.model : "Claude chat"
    });
    save(HKEY, h.slice(-100));
    renderResult(c, result, meta);
    show("result");
  }

  function renderResult(c, r, meta) {
    const band = bandFor(r.total);
    const ref = c.reference.headline;
    $("resultCase").textContent = c.title;
    $("total").innerHTML = `${esc(r.total)}<small>/100</small>`;
    $("bandName").textContent = band[1];
    $("bandText").textContent = band[2];
    $("timeLine").textContent = timeLine(c, state);
    $("summary").textContent = r.summary;

    const hv = r.headline?.value;
    const dec = { clears: "says it clears the bar", fails: "says it fails the bar", conditional: "says it depends", none: "states no decision" }[r.decision] || "states no decision";
    if (typeof hv === "number" && hv > 0) {
      const ratio = Math.max(hv / ref, ref / hv);
      $("headlineLine").textContent = `Your headline: ${+hv.toPrecision(3)} ${c.metric}${r.headline.cell ? " (" + r.headline.cell + ")" : ""}, ${ratio < 1.05 ? "matching" : ratio.toFixed(1) + "× " + (hv > ref ? "above" : "below")} the reference of ${ref}. Your sheet ${dec}.`;
    } else {
      $("headlineLine").textContent = `No positive headline was found in your sheet. Your sheet ${dec}.`;
    }

    if (meta?.via === "api") {
      const u = meta.usage || {};
      const tokens = u.input_tokens != null ? ` · ${u.input_tokens.toLocaleString()} input and ${u.output_tokens.toLocaleString()} output tokens` : "";
      const usd = meta.cost != null ? ` · about $${meta.cost.toFixed(2)}` : "";
      $("gradedBy").textContent = `Graded by ${meta.model}${tokens}${usd}. A second grading of the same sheet can differ by a few points.`;
    } else {
      $("gradedBy").textContent = "Graded in a Claude chat. A second grading of the same sheet can differ by a few points.";
    }

    $("fix").textContent = r.priority_fix;
    $("fixBox").hidden = !r.priority_fix;

    $("dims").innerHTML = r.dims.map((d) => {
      const def = RUBRIC.find((x) => x.key === d.key);
      const [lvl, text] = def.anchors.find(([p]) => p <= d.score) || def.anchors[def.anchors.length - 1];
      return `<div class="dim">
        <div class="dimtop"><h3>${esc(d.name)}</h3><span class="pts">${d.score} / ${d.max}</span></div>
        <div class="meter"><i data-w="${(100 * d.score) / d.max}"></i></div>
        <p>${esc(d.why)}</p>
        <p class="anchor">Anchor ${lvl}: ${esc(anchorText(c, text))}</p>
        ${d.evidence.length ? `<div class="cells">${d.evidence.map((x) => `<span class="cell">${esc(x)}</span>`).join("")}</div>` : ""}
      </div>`;
    }).join("");
    // Widths are set through the CSSOM: the page's Content-Security-Policy blocks inline style attributes.
    $("dims").querySelectorAll(".meter i").forEach((el) => { el.style.width = el.dataset.w + "%"; });

    $("considerations").innerHTML = r.considerations.map((t) =>
      `<div class="trap"><strong>${esc(t.id)} · ${esc(t.name)}</strong><span class="pill ${t.verdict}">${t.verdict}</span><p>${esc(t.note)}${t.cells.length ? " " + t.cells.map((x) => `<span class="cell">${esc(x)}</span>`).join(" ") : ""}</p></div>`).join("");

    $("strengthsPanel").hidden = !r.strengths.length;
    $("strengths").innerHTML = r.strengths.map((s) => `<li>${esc(s)}</li>`).join("");

    $("reference").innerHTML = `<div class="tablebox"><table><thead><tr><th>Step</th><th>Working</th><th>Value</th><th>Source</th></tr></thead><tbody>${
      c.reference.steps.map((s, i, a) => `<tr${i === a.length - 1 ? ' class="total"' : ""}><td>${esc(s.step)}</td><td>${esc(s.working)}</td><td class="num">${esc(s.value)}</td><td>${esc(s.source)}</td></tr>`).join("")
    }</tbody></table></div>${c.reference.reasoning.map((p) => `<p>${esc(p)}</p>`).join("")}`;
  }

  /* ---------- Boot ---------- */
  loadKey();
  route();
})();
