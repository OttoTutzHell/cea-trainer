/* Reading the hand-in, and writing the data pack. Uses SheetJS (vendor/xlsx.full.min.js) as window.XLSX. */
CEA.workbook = (() => {
  const MAX_ROWS = 400;     // rows read per sheet
  const MAX_COLS = 40;      // columns read per row
  const MAX_CHARS = 150000; // the dump sent to the grader

  function fmtCell(c) {
    if (c.v === undefined) return "(no saved value)";
    if (c.t === "n" && typeof c.v === "number") {
      const v = Number.isInteger(c.v) ? String(c.v) : String(+c.v.toPrecision(6));
      return c.w && c.w !== v ? `${v} (shown as ${c.w})` : v;
    }
    if (c.t === "b") return c.v ? "TRUE" : "FALSE";
    if (c.t === "e") return "#ERROR " + (c.w || "");
    return String(c.w ?? c.v ?? "").replace(/\s+/g, " ").slice(0, 400);
  }

  /* One line per row: "B7: =B5*B6 → 2380000 [comment: …]  |  C7: hens". */
  function dump(wb) {
    const out = [];
    let cells = 0, formulas = 0, comments = 0;
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      if (!ws || !ws["!ref"]) continue;
      const r = XLSX.utils.decode_range(ws["!ref"]);
      out.push(`### Sheet "${name}" (${ws["!ref"]})`);
      for (let R = r.s.r; R <= Math.min(r.e.r, r.s.r + MAX_ROWS); R++) {
        const parts = [];
        for (let C = r.s.c; C <= Math.min(r.e.c, r.s.c + MAX_COLS); C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const c = ws[addr];
          if (!c) continue;
          const hasValue = c.v !== undefined && c.v !== "";
          const note = c.c && c.c.length ? c.c.map((x) => x.t).join(" / ").replace(/\s+/g, " ") : "";
          if (!hasValue && !c.f && !note) continue;
          let part = addr + ": " + (c.f ? "=" + c.f + " → " + fmtCell(c) : fmtCell(c));
          if (c.f) formulas++;
          if (note) { part += " [comment: " + note + "]"; comments++; }
          const fill = c.s && c.s.fgColor && c.s.fgColor.rgb;
          if (fill && !/^(FF)?FFFFFF$/i.test(fill)) part += " [fill #" + fill.slice(-6) + "]";
          parts.push(part);
          cells++;
        }
        if (parts.length) out.push(parts.join("  |  "));
      }
    }
    let text = out.join("\n");
    const truncated = text.length > MAX_CHARS;
    if (truncated) text = text.slice(0, MAX_CHARS) + "\n[truncated]";
    return { text, cells, formulas, comments, sheets: wb.SheetNames.length, truncated };
  }

  async function read(file) {
    if (!window.XLSX) throw new Error("no_library");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: true, cellStyles: true });
    const d = dump(wb);
    if (!d.cells) throw new Error("empty");
    return d;
  }

  /* ---------- The data pack ---------- */
  const dataRows = (c) => [["ID", "Item", "Detail"], ...c.data.map((d) => [d.id, d.name, CEA.plain(d.text)])];
  const dataTSV = (c) => dataRows(c).map((r) => r.join("\t")).join("\n");

  function downloadDataPack(c) {
    if (!window.XLSX) throw new Error("no_library");
    const wb = XLSX.utils.book_new();
    const data = XLSX.utils.aoa_to_sheet(dataRows(c));
    data["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(wb, data, "Data");
    const model = XLSX.utils.aoa_to_sheet([["Label", "Value", "Unit", "Type (data / estimate / judgement / calculated)", "Source or note"]]);
    model["!cols"] = [{ wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, model, "Model");
    XLSX.writeFile(wb, `${c.id}-data.xlsx`);
  }

  return { read, dataTSV, downloadDataPack };
})();
