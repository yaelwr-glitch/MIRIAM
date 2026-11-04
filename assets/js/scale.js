/* מחשבון הגדלה והקטנה של מתכון */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  /* grams per 1 cup (240 ml). tbsp = cup/16, tsp = cup/48 */
  const DENSITY = [
    { id: "flour", name: "קמח לבן", g: 140, k: ["קמח"] },
    { id: "sugar", name: "סוכר לבן", g: 200, k: ["סוכר לבן", "סוכר"] },
    { id: "brown", name: "סוכר חום", g: 220, k: ["סוכר חום", "דמררה"] },
    { id: "powder", name: "אבקת סוכר", g: 120, k: ["אבקת סוכר"] },
    { id: "butter", name: "חמאה / מרגרינה", g: 227, k: ["חמאה", "מרגרינה"] },
    { id: "oil", name: "שמן", g: 220, k: ["שמן"] },
    { id: "water", name: "מים / חלב / שמנת", g: 240, k: ["מים", "חלב", "שמנת", "מיץ", "יוגורט", "רוויון"] },
    { id: "cocoa", name: "אבקת קקאו", g: 90, k: ["קקאו"] },
    { id: "almond", name: "קמח שקדים", g: 100, k: ["שקדים טחונים", "קמח שקדים"] },
    { id: "honey", name: "דבש / סילאן", g: 340, k: ["דבש", "סילאן", "גלוקוזה"] },
    { id: "oats", name: "שיבולת שועל", g: 90, k: ["שיבולת", "קוואקר"] },
    { id: "nuts", name: "אגוזים קצוצים", g: 120, k: ["אגוז", "פקאן", "שקדים"] },
    { id: "choc", name: "שוקולד צ׳יפס", g: 170, k: ["צ'יפס", "צ׳יפס", "שוקולד"] },
    { id: "starch", name: "קורנפלור", g: 120, k: ["קורנפלור", "עמילן"] },
    { id: "salt", name: "מלח", g: 290, k: ["מלח"] },
    { id: "bp", name: "אבקת אפייה / סודה", g: 230, k: ["אבקת אפייה", "סודה"] },
  ];
  const UNITS = {
    g: { label: "גרם", kind: "mass", f: 1 }, kg: { label: "ק״ג", kind: "mass", f: 1000 },
    ml: { label: "מ״ל", kind: "vol", f: 1 }, l: { label: "ליטר", kind: "vol", f: 1000 },
    cup: { label: "כוס", kind: "vol", f: 240 }, tbsp: { label: "כף", kind: "vol", f: 15 }, tsp: { label: "כפית", kind: "vol", f: 5 },
    unit: { label: "יח׳", kind: "unit", f: 1 }, egg: { label: "ביצים", kind: "egg", f: 1 },
  };
  const unitOpts = (sel) => Object.keys(UNITS).map((k) => `<option value="${k}"${k === sel ? " selected" : ""}>${UNITS[k].label}</option>`).join("");
  const guessDensity = (name) => {
    const n = name || "";
    let best = null;
    const low = n.toLowerCase();
    DENSITY.forEach((d) => d.k.forEach((k) => {
      [k, M.t(k).toLowerCase()].forEach((kk) => { if (kk && low.includes(kk) && (!best || kk.length > best.len)) best = { d, len: kk.length }; });
    }));
    return best ? best.d : null;
  };

  const SHAPES = { round: "עגולה", square: "מרובעת", rect: "מלבנית" };
  let st = Object.assign({
    mode: "pan",
    from: { shape: "round", a: 24, b: 24, h: 7 },
    to: { shape: "round", a: 18, b: 18, h: 7 },
    useH: false, svFrom: 10, svTo: 40, factor: 1.5, out: "same", title: "",
    rows: [
      { name: M.t("קמח"), qty: 2, unit: "cup" }, { name: M.t("סוכר"), qty: 1, unit: "cup" }, { name: M.t("ביצים"), qty: 4, unit: "egg" },
      { name: M.t("שמן"), qty: 0.5, unit: "cup" }, { name: M.t("אבקת אפייה"), qty: 1, unit: "tbsp" }, { name: M.t("שוקולד מריר"), qty: 200, unit: "g" },
    ],
  }, M.load(M.KEYS.scale, {}));

  function save() { M.save(M.KEYS.scale, st); }

  /* ---------- Pans ---------- */
  function panArea(p) {
    const a = M.parseNum(p.a), b = M.parseNum(p.b);
    if (p.shape === "round") return Math.PI * (a / 2) ** 2;
    if (p.shape === "square") return a * a;
    return a * b;
  }
  function panHtml(key, title) {
    const p = st[key];
    return `<h3>${title}</h3>
      <div><label for="${key}-shape">צורה</label><select id="${key}-shape" data-pan="${key}" data-f="shape">${Object.keys(SHAPES).map((s) => `<option value="${s}"${s === p.shape ? " selected" : ""}>${SHAPES[s]}</option>`).join("")}</select></div>
      <div class="field-row" style="margin:0">
        <div><label for="${key}-a">${p.shape === "round" ? "קוטר (ס״מ)" : p.shape === "square" ? "צלע (ס״מ)" : "אורך (ס״מ)"}</label><input id="${key}-a" type="number" min="1" step="0.5" inputmode="decimal" data-pan="${key}" data-f="a" value="${p.a}"></div>
        ${p.shape === "rect" ? `<div><label for="${key}-b">רוחב (ס״מ)</label><input id="${key}-b" type="number" min="1" step="0.5" inputmode="decimal" data-pan="${key}" data-f="b" value="${p.b}"></div>` : ""}
        ${st.useH ? `<div><label for="${key}-h">גובה (ס״מ)</label><input id="${key}-h" type="number" min="1" step="0.5" inputmode="decimal" data-pan="${key}" data-f="h" value="${p.h}"></div>` : ""}
      </div>
      <div class="hint">שטח: ${M.num(panArea(p), 0)} סמ״ר</div>`;
  }
  function renderPans() {
    $("pan-from").innerHTML = panHtml("from", "התבנית במתכון");
    $("pan-to").innerHTML = panHtml("to", "התבנית שלי");
  }
  document.getElementById("mode-pan").addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "use-height") { st.useH = t.checked; renderPans(); update(); return; }
    if (t.dataset.pan) { st[t.dataset.pan][t.dataset.f] = t.value; if (t.dataset.f === "shape") renderPans(); update(); }
  });
  document.getElementById("mode-pan").addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.pan && t.dataset.f !== "shape") {
      st[t.dataset.pan][t.dataset.f] = t.value;
      update();
      const hint = t.closest(".pan-box").querySelector(".hint");
      if (hint) hint.textContent = "שטח: " + M.num(panArea(st[t.dataset.pan]), 0) + " סמ״ר";
    }
  });

  function factor() {
    if (st.mode === "servings") return (M.parseNum(st.svTo) || 0) / (M.parseNum(st.svFrom) || 1);
    if (st.mode === "factor") return M.parseNum(st.factor) || 0;
    const a1 = panArea(st.from), a2 = panArea(st.to);
    let f = a1 ? a2 / a1 : 0;
    if (st.useH) f *= (M.parseNum(st.to.h) || 1) / (M.parseNum(st.from.h) || 1);
    return f;
  }

  /* ---------- Rows ---------- */
  function renderRows() {
    $("rows").innerHTML = st.rows.map((r, i) => `
      <div class="scale-row" data-i="${i}">
        <div class="sr-name"><label for="sr-n-${i}">רכיב</label><input id="sr-n-${i}" type="text" data-f="name" value="${M.esc(r.name)}"></div>
        <div><label for="sr-q-${i}">כמות</label><input id="sr-q-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="qty" value="${M.esc(r.qty)}"></div>
        <div><label for="sr-u-${i}">יחידה</label><select id="sr-u-${i}" data-f="unit">${unitOpts(r.unit)}</select></div>
        <button type="button" class="icon-btn" data-del="${i}" aria-label="מחיקה">✕</button>
      </div>`).join("") || `<div class="empty">הוסיפי רכיבים</div>`;
  }
  $("rows").addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row || !e.target.dataset.f) return;
    st.rows[+row.dataset.i][e.target.dataset.f] = e.target.value;
    update();
  });
  $("rows").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    st.rows.splice(+b.dataset.del, 1); renderRows(); update();
  });
  $("add-row").addEventListener("click", () => { st.rows.push({ name: "", qty: "", unit: "g" }); renderRows(); update(); const x = $("rows").querySelector(".scale-row:last-child input"); if (x) x.focus(); });

  /* ---------- Formatting of scaled amounts ---------- */
  function niceFraction(x) {
    const whole = Math.floor(x + 1e-9);
    const frac = x - whole;
    const opts = [[0, ""], [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]];
    let best = opts[0];
    opts.forEach((o) => { if (Math.abs(frac - o[0]) < Math.abs(frac - best[0])) best = o; });
    if (Math.abs(frac - best[0]) > 0.07) return M.num(x, 2);
    const w = best[0] === 1 ? whole + 1 : whole;
    return (w ? w + (best[1] ? " " : "") : "") + best[1] || "0";
  }
  function scaledText(r, f) {
    const q = M.parseNum(r.qty) * f;
    const u = UNITS[r.unit] || UNITS.g;
    if (!q) return { text: "—", note: "" };
    if (u.kind === "egg") {
      const whole = Math.round(q);
      const g = q * 50;
      return { text: Math.abs(q - whole) < 0.15 ? `${whole} ביצים` : `${M.num(g, 0)} גרם ביצה טרופה (≈ ${M.num(q, 1)} ביצים)`, note: "" };
    }
    if (st.out === "grams" && u.kind === "vol") {
      const ml = q * u.f;
      const d = guessDensity(r.name);
      if (d) return { text: `${M.num((ml / 240) * d.g, 0)} גרם`, note: M.t("לפי {0}", M.t(d.name)) };
      return { text: `${M.num(ml, 0)} מ״ל`, note: "" };
    }
    if (st.out === "grams" && u.kind === "mass") return { text: `${M.num(q * u.f, 0)} גרם`, note: "" };
    if (u.kind === "vol" && ["cup", "tbsp", "tsp"].includes(r.unit)) {
      // convert small cup amounts to spoons for readability
      const ml = q * u.f;
      if (r.unit === "cup" && ml < 60) return { text: `${niceFraction(ml / 15)} כפות`, note: "" };
      if (r.unit === "tbsp" && ml < 15) return { text: `${niceFraction(ml / 5)} כפיות`, note: "" };
      const PL = { cup: ["כוס", "כוסות"], tbsp: ["כף", "כפות"], tsp: ["כפית", "כפיות"] };
      return { text: `${niceFraction(q)} ${PL[r.unit][q > 1.05 ? 1 : 0]}`, note: "" };
    }
    return { text: `${M.num(q, q < 10 ? 1 : 0)} ${u.label}`, note: "" };
  }

  /* ---------- Update ---------- */
  function update() {
    const f = factor();
    $("factor").textContent = f ? "×" + M.num(f, 2) : "—";
    let sub = "";
    const ARW = M.lang === "he" ? "←" : "→";
    if (st.mode === "pan") sub = `${M.t(SHAPES[st.from.shape])} ${st.from.a}${st.from.shape === "rect" ? "×" + st.from.b : ""} ${ARW} ${M.t(SHAPES[st.to.shape])} ${st.to.a}${st.to.shape === "rect" ? "×" + st.to.b : ""}`;
    if (st.mode === "servings") sub = M.t("{0} מנות ← {1} מנות", st.svFrom, st.svTo);
    $("factor-sub").textContent = sub;

    const rows = st.rows.filter((r) => r.name || r.qty);
    $("result-table").innerHTML = `<thead><tr><th>רכיב</th><th class="num">במקור</th><th class="num">אחרי ההמרה</th></tr></thead><tbody>` +
      rows.map((r) => {
        const s = scaledText(r, f);
        return `<tr><td>${M.esc(r.name)}${s.note ? `<div class="hint">${M.esc(s.note)}</div>` : ""}</td><td class="num">${M.esc(r.qty)} ${(UNITS[r.unit] || UNITS.g).label}</td><td class="num"><strong>${M.esc(s.text)}</strong></td></tr>`;
      }).join("") + `</tbody>`;

    const notes = [];
    if (f > 0 && f < 0.75) notes.push("תבנית קטנה יותר: התחילי לבדוק מוכנות 10–15 דקות לפני הזמן במתכון.");
    if (f > 1.4) notes.push("תבנית גדולה יותר או כמות גדולה: לרוב צריך להאריך את האפייה ולהוריד 10 מעלות כדי שהמרכז ייאפה בלי שהשוליים יתייבשו. בכמויות גדולות מאוד — עדיף לאפות בכמה סבבים.");
    if (rows.some((r) => r.unit === "egg") && Math.abs(f * 2 - Math.round(f * 2)) > 0.01) notes.push("חצאי ביצה: טורפים ביצה ושוקלים — ביצה בינונית בלי קליפה שוקלת כ־50 גרם.");
    if (st.mode === "pan" && st.from.shape !== st.to.shape) notes.push("מעבר בין צורות: חישבנו לפי השטח, כך שגובה העוגה יישאר דומה.");
    if (rows.some((r) => /שמרים|אבקת אפייה|סודה|yeast|baking|levure|bicarbonate/i.test(r.name)) && f > 2) notes.push("בהגדלה של יותר מפי 2, חומרי התפיחה לא תמיד צריכים לגדול באותו יחס — כדאי לנסות קודם סבב ניסיון.");
    $("notes").innerHTML = notes.length ? notes.map((n) => "💡 " + M.esc(n)).join("<br>") : "💡 התוצאה מעוגלת לשברים נוחים. למדידה מדויקת — עברי לתצוגה בגרמים.";
    $("notes").classList.remove("hidden");
    $("print-title").textContent = (st.title || M.t("מתכון")) + " — " + $("factor").textContent + (sub ? " (" + sub + ")" : "");
    save();
  }

  /* ---------- Mode tabs ---------- */
  function setMode(m) {
    st.mode = m;
    document.querySelectorAll("#mode-tabs .tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.mode === m)));
    ["pan", "servings", "factor"].forEach((k) => $("mode-" + k).classList.toggle("hidden", k !== m));
    update();
  }
  $("mode-tabs").addEventListener("click", (e) => { const t = e.target.closest("[data-mode]"); if (t) setMode(t.dataset.mode); });
  $("sv-from").addEventListener("input", (e) => { st.svFrom = e.target.value; update(); });
  $("sv-to").addEventListener("input", (e) => { st.svTo = e.target.value; update(); });
  $("mf").addEventListener("input", (e) => { st.factor = e.target.value; update(); });
  $("out-mode").addEventListener("change", (e) => { st.out = e.target.value; update(); });

  /* ---------- Load saved recipe ---------- */
  const recipes = M.getRecipes();
  $("load-recipe").innerHTML = `<option value="">טעינת מתכון שמור…</option>` + recipes.map((r) => `<option value="${r.id}">${M.esc(r.name)}</option>`).join("");
  $("load-recipe").addEventListener("change", (e) => {
    const r = recipes.find((x) => x.id === e.target.value);
    if (!r) return;
    st.title = r.name;
    st.rows = (r.ingredients || []).filter((i) => i.name).map((i) => ({ name: i.name, qty: i.qty, unit: i.unit === "unit" && /ביצ|egg|œuf|oeuf/i.test(i.name) ? "egg" : i.unit }));
    if (r.servings) { st.svFrom = r.servings; $("sv-from").value = r.servings; }
    renderRows(); update();
    M.toast("נטען: " + r.name);
    e.target.value = "";
  });

  $("copy-btn").addEventListener("click", () => {
    const f = factor();
    const txt = [`${st.title || "מתכון"} — ${$("factor").textContent} ${$("factor-sub").textContent}`]
      .concat(st.rows.filter((r) => r.name).map((r) => `• ${r.name}: ${scaledText(r, f).text}`)).join("\n");
    M.copyText(txt);
  });
  $("print-btn").addEventListener("click", () => window.print());
  $("clear-btn").addEventListener("click", () => { if (confirm("לנקות את כל הרכיבים?")) { st.rows = [{ name: "", qty: "", unit: "g" }]; st.title = ""; renderRows(); update(); } });

  /* ---------- Quick converter ---------- */
  $("cv-unit").innerHTML = ["cup", "tbsp", "tsp", "g", "ml"].map((k) => `<option value="${k}">${UNITS[k].label}</option>`).join("");
  $("cv-ing").innerHTML = DENSITY.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
  function convert() {
    const q = M.parseNum($("cv-qty").value);
    const u = $("cv-unit").value;
    const d = DENSITY.find((x) => x.id === $("cv-ing").value);
    const grams = u === "g" ? q : u === "ml" ? (q / 240) * d.g : ((q * UNITS[u].f) / 240) * d.g;
    const cups = grams / d.g;
    $("cv-out").innerHTML = [
      ["גרם", M.num(grams, 0)], ["כוסות", niceFraction(cups)], ["כפות", M.num(cups * 16, 1)], ["כפיות", M.num(cups * 48, 1)],
    ].map(([a, b]) => `<div class="summary-line"><span>${a}</span><span>${b}</span></div>`).join("");
  }
  ["cv-qty", "cv-unit", "cv-ing"].forEach((id) => $(id).addEventListener("input", convert));

  /* ---------- Init ---------- */
  $("use-height").checked = st.useH;
  $("sv-from").value = st.svFrom; $("sv-to").value = st.svTo; $("mf").value = st.factor; $("out-mode").value = st.out;
  M.mountBackup("backup", [M.KEYS.scale], "scale");
  renderPans(); renderRows(); setMode(st.mode); convert();
})();
