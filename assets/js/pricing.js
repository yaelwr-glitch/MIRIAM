/* מחשבון מחירים */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  const SAMPLE = {
    name: "עוגת שוקולד-פטל 24 ס״מ",
    servings: 14,
    category: "עוגות",
    ingredients: [
      { name: "שוקולד מריר 60%", pkgSize: 1, pkgUnit: "kg", pkgPrice: 75, qty: 250, unit: "g" },
      { name: "חמאה", pkgSize: 200, pkgUnit: "g", pkgPrice: 9.9, qty: 200, unit: "g" },
      { name: "ביצים", pkgSize: 12, pkgUnit: "unit", pkgPrice: 14, qty: 5, unit: "unit" },
      { name: "סוכר", pkgSize: 1, pkgUnit: "kg", pkgPrice: 6.5, qty: 180, unit: "g" },
      { name: "שמנת מתוקה 38%", pkgSize: 250, pkgUnit: "ml", pkgPrice: 7.9, qty: 500, unit: "ml" },
      { name: "פטל קפוא", pkgSize: 400, pkgUnit: "g", pkgPrice: 22, qty: 200, unit: "g" },
    ],
    extras: [
      { name: "קופסת עוגה + תחתית", cost: 6 },
      { name: "קישוטים ופרחים", cost: 8 },
    ],
    hours: 2.5, rate: 60, overhead: 10, margin: 30, vat: false, vatRate: 18,
  };

  let state = null;   // current recipe being edited
  let editingId = null;

  function blankIng() { return { name: "", pkgSize: "", pkgUnit: "g", pkgPrice: "", qty: "", unit: "g" }; }

  /* ---------- Render editable rows ---------- */
  function renderIngredients() {
    const wrap = $("ing-rows");
    wrap.innerHTML = state.ingredients.map((ing, i) => `
      <div class="row-item ing-row" data-i="${i}">
        <div class="span-2"><label for="ing-name-${i}">רכיב</label><input id="ing-name-${i}" type="text" data-f="name" value="${M.esc(ing.name)}" placeholder="קמח, חמאה..."></div>
        <div><label for="ing-ps-${i}">גודל אריזה</label><input id="ing-ps-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="pkgSize" value="${M.esc(ing.pkgSize)}"></div>
        <div><label for="ing-pu-${i}">יחידה (אריזה)</label><select id="ing-pu-${i}" data-f="pkgUnit">${M.unitOptions(ing.pkgUnit)}</select></div>
        <div><label for="ing-q-${i}">כמה השתמשתי</label><input id="ing-q-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="qty" value="${M.esc(ing.qty)}"></div>
        <div><label for="ing-u-${i}">יחידה (שימוש)</label><select id="ing-u-${i}" data-f="unit">${M.unitOptions(ing.unit)}</select></div>
        <div><label for="ing-pp-${i}">מחיר אריזה ₪</label><input id="ing-pp-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="pkgPrice" value="${M.esc(ing.pkgPrice)}"></div>
        <div class="row-cost" data-cost></div>
        <button type="button" class="icon-btn row-del" data-del="${i}" aria-label="מחיקת רכיב">✕</button>
      </div>`).join("") || `<div class="empty">עדיין אין רכיבים. לחצי על "+ רכיב".</div>`;
  }
  function renderExtras() {
    const wrap = $("extra-rows");
    wrap.innerHTML = state.extras.map((x, i) => `
      <div class="row-item extra-row" data-i="${i}">
        <div><label for="ex-name-${i}">תיאור</label><input id="ex-name-${i}" type="text" data-f="name" value="${M.esc(x.name)}" placeholder="קופסה, סרט, טופר..."></div>
        <div><label for="ex-cost-${i}">עלות ₪</label><input id="ex-cost-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="cost" value="${M.esc(x.cost)}"></div>
        <button type="button" class="icon-btn row-del" data-del="${i}" aria-label="מחיקת תוספת">✕</button>
      </div>`).join("") || `<div class="empty">אין תוספות.</div>`;
  }

  function fillForm() {
    $("r-name").value = state.name || "";
    $("r-servings").value = state.servings || 1;
    $("r-category").value = state.category || "";
    $("r-hours").value = state.hours;
    $("r-rate").value = state.rate;
    $("r-overhead").value = state.overhead;
    $("r-margin").value = state.margin;
    $("r-vat").checked = !!state.vat;
    $("r-vat-rate").value = state.vatRate || 18;
    renderIngredients();
    renderExtras();
    update();
  }

  function readTop() {
    state.name = $("r-name").value.trim();
    state.servings = M.parseNum($("r-servings").value) || 1;
    state.category = $("r-category").value.trim();
    state.hours = $("r-hours").value;
    state.rate = $("r-rate").value;
    state.overhead = $("r-overhead").value;
    state.margin = $("r-margin").value;
    state.vat = $("r-vat").checked;
    state.vatRate = $("r-vat-rate").value;
  }

  /* ---------- Calculate & show ---------- */
  function update() {
    const c = M.calcRecipe(state);
    $("vat-rate-wrap").classList.toggle("hidden", !state.vat);

    // per-row costs
    document.querySelectorAll("#ing-rows .row-item").forEach((row) => {
      const i = +row.dataset.i;
      const line = c.lines[i];
      const el = row.querySelector("[data-cost]");
      if (el && line) el.textContent = line.cost ? M.money(line.cost) : "";
    });

    const lines = [
      ["חומרי גלם", M.money(c.ingCost)],
      ["אריזה ותוספות", M.money(c.extrasCost)],
      ["עבודה (" + M.num(M.parseNum(state.hours), 2) + " ש׳ × " + M.money(M.parseNum(state.rate)) + ")", M.money(c.labor)],
      ["הוצאות נלוות (" + M.num(M.parseNum(state.overhead)) + "%)", M.money(c.overhead)],
      ["<strong>עלות כוללת</strong>", "<strong>" + M.money(c.totalCost) + "</strong>"],
      ["עלות למנה", M.money(c.costPerServing)],
      ["מחיר מחושב" + (state.vat ? " (כולל מע״מ)" : ""), M.money(c.price)],
      ["רווח נקי במחיר המומלץ", M.money(c.profit)],
    ];
    $("summary").innerHTML = lines.map(([a, b]) => `<div class="summary-line"><span>${a}</span><span>${b}</span></div>`).join("");
    $("price-big").textContent = M.money(c.rounded);
    $("price-sub").textContent = c.rounded ? `${M.money(c.perServing)} למנה · ${c.servings} מנות` : "הזיני רכיבים כדי לראות מחיר";

    const warns = [...new Set(c.lines.map((l) => l.warn).filter(Boolean))];
    if (M.parseNum(state.margin) > 90) warns.push("רווח מעל 90% לא נתמך — חישבנו לפי 90%");
    if (!M.parseNum(state.rate)) warns.push("לא הזנת שכר לשעה — העבודה שלך שווה כסף!");
    const w = $("calc-warn");
    w.innerHTML = warns.map(M.esc).join("<br>");
    w.classList.toggle("hidden", !warns.length);

    M.save(M.KEYS.pricingDraft, { state, editingId });
    renderPrint(c);
  }

  function renderPrint(c) {
    const rows = state.ingredients.filter((i) => i.name || i.qty).map((ing, idx) => {
      const unit = (M.UNITS[ing.unit] || M.UNITS.g).label;
      return `<tr><td>${M.esc(ing.name)}</td><td>${M.esc(ing.qty)} ${unit}</td><td>${M.money(c.lines[state.ingredients.indexOf(ing)].cost)}</td></tr>`;
    }).join("");
    const extras = state.extras.filter((x) => x.name || x.cost).map((x) => `<tr><td>${M.esc(x.name)}</td><td></td><td>${M.money(M.parseNum(x.cost))}</td></tr>`).join("");
    $("print-sheet").innerHTML = `
      <h2>${M.esc(state.name || "מתכון")}</h2>
      <p>${c.servings} מנות · הודפס ב־${new Date().toLocaleDateString("he-IL")}</p>
      <table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">
        <thead><tr><th>רכיב</th><th>כמות</th><th>עלות</th></tr></thead>
        <tbody>${rows}${extras}</tbody>
      </table>`;
  }

  /* ---------- Events ---------- */
  function onRowsInput(listName) {
    return (e) => {
      const row = e.target.closest(".row-item");
      const f = e.target.dataset.f;
      if (!row || !f) return;
      state[listName][+row.dataset.i][f] = e.target.value;
      update();
    };
  }
  function onRowsClick(listName, rerender) {
    return (e) => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      state[listName].splice(+btn.dataset.del, 1);
      rerender();
      update();
    };
  }

  $("ing-rows").addEventListener("input", onRowsInput("ingredients"));
  $("ing-rows").addEventListener("change", onRowsInput("ingredients"));
  $("ing-rows").addEventListener("click", onRowsClick("ingredients", renderIngredients));
  $("extra-rows").addEventListener("input", onRowsInput("extras"));
  $("extra-rows").addEventListener("click", onRowsClick("extras", renderExtras));

  $("add-ing").addEventListener("click", () => {
    state.ingredients.push(blankIng());
    renderIngredients();
    const last = $("ing-rows").querySelector(".row-item:last-child input");
    if (last) last.focus();
  });
  $("add-extra").addEventListener("click", () => {
    state.extras.push({ name: "", cost: "" });
    renderExtras();
    const last = $("extra-rows").querySelector(".row-item:last-child input");
    if (last) last.focus();
  });

  ["r-name", "r-servings", "r-category", "r-hours", "r-rate", "r-overhead", "r-margin", "r-vat", "r-vat-rate"].forEach((id) => {
    $(id).addEventListener("input", () => { readTop(); update(); });
    $(id).addEventListener("change", () => { readTop(); update(); });
  });

  $("save-btn").addEventListener("click", () => {
    readTop();
    if (!state.name) { M.toast("תני שם למתכון לפני השמירה"); $("r-name").focus(); return; }
    const list = M.getRecipes();
    const c = M.calcRecipe(state);
    const rec = Object.assign({}, JSON.parse(JSON.stringify(state)), {
      id: editingId || M.uid(),
      updated: Date.now(),
      suggestedPrice: c.rounded,
      totalCost: Math.round(c.totalCost * 100) / 100,
    });
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) list[idx] = rec; else list.unshift(rec);
    if (M.setRecipes(list)) {
      editingId = rec.id;
      M.toast("המתכון נשמר ✓");
      if (M.getRecipes().length === 1) M.confetti();
      renderSaved();
      update();
    }
  });

  $("new-btn").addEventListener("click", () => {
    if (!confirm("להתחיל מתכון חדש? שינויים שלא נשמרו יימחקו.")) return;
    editingId = null;
    state = { name: "", servings: 12, category: "", ingredients: [blankIng(), blankIng(), blankIng()], extras: [{ name: "אריזה", cost: "" }], hours: 1, rate: state.rate || 60, overhead: state.overhead || 10, margin: state.margin || 30, vat: state.vat, vatRate: state.vatRate || 18 };
    fillForm();
    $("r-name").focus();
  });

  $("print-btn").addEventListener("click", () => window.print());

  /* ---------- Saved list ---------- */
  function renderSaved() {
    const list = M.getRecipes();
    const ul = $("saved-list");
    if (!list.length) { ul.innerHTML = `<li class="empty">עדיין לא שמרת מתכונים</li>`; return; }
    ul.innerHTML = list.map((r) => {
      const c = M.calcRecipe(r);
      return `<li class="saved-item${r.id === editingId ? " is-active" : ""}">
        <div><strong>${M.esc(r.name)}</strong><span class="meta">עלות ${M.money(c.totalCost)} · מחיר ${M.money(c.rounded)}</span></div>
        <div class="btn-row">
          <button class="btn btn-sm btn-ghost" data-open="${r.id}" type="button">פתיחה</button>
          <button class="btn btn-sm btn-ghost" data-dup="${r.id}" type="button" aria-label="שכפול ${M.esc(r.name)}">שכפול</button>
          <button class="btn btn-sm btn-danger" data-rm="${r.id}" type="button" aria-label="מחיקת ${M.esc(r.name)}">מחיקה</button>
        </div></li>`;
    }).join("");
  }
  $("saved-list").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const list = M.getRecipes();
    if (t.dataset.open) {
      const r = list.find((x) => x.id === t.dataset.open);
      if (r) { state = JSON.parse(JSON.stringify(r)); editingId = r.id; fillForm(); renderSaved(); window.scrollTo({ top: 0 }); M.toast("נפתח: " + r.name); }
    } else if (t.dataset.dup) {
      const r = list.find((x) => x.id === t.dataset.dup);
      if (r) { state = JSON.parse(JSON.stringify(r)); state.name = r.name + " (עותק)"; editingId = null; fillForm(); renderSaved(); M.toast("נוצר עותק — זכרי לשמור"); }
    } else if (t.dataset.rm) {
      const r = list.find((x) => x.id === t.dataset.rm);
      if (r && confirm(`למחוק את "${r.name}"?`)) {
        M.setRecipes(list.filter((x) => x.id !== r.id));
        if (editingId === r.id) editingId = null;
        renderSaved();
      }
    }
  });

  M.mountBackup("backup", [M.KEYS.recipes], "recipes");

  /* ---------- Init ---------- */
  const params = new URLSearchParams(location.search);
  const openId = params.get("id");
  const draft = M.load(M.KEYS.pricingDraft, null);
  const saved = M.getRecipes();
  if (openId && saved.find((r) => r.id === openId)) {
    state = JSON.parse(JSON.stringify(saved.find((r) => r.id === openId)));
    editingId = openId;
  } else if (draft && draft.state && Array.isArray(draft.state.ingredients)) {
    state = draft.state;
    editingId = draft.editingId && saved.find((r) => r.id === draft.editingId) ? draft.editingId : null;
  } else {
    state = JSON.parse(JSON.stringify(SAMPLE));
  }
  state.ingredients = state.ingredients || [];
  state.extras = state.extras || [];
  fillForm();
  renderSaved();
})();
