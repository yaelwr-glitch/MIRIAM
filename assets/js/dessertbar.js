/* מחשבון בר קינוחים לאירוע */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  const EVENTS = {
    wedding: { name: "חתונה", base: 3 },
    barmitzva: { name: "בר / בת מצווה", base: 3.5 },
    brit: { name: "ברית / בריתה", base: 3 },
    birthday: { name: "יום הולדת", base: 4 },
    engagement: { name: "אירוסין / שבת חתן", base: 4 },
    corporate: { name: "אירוע חברה / כנס", base: 3 },
    holiday: { name: "מפגש חג / משפחתי", base: 4 },
  };
  const MEAL_ADJ = { full: 0, light: 1, none: 2 };

  const DEFAULT_TYPES = [
    { on: true, name: M.t("מיני טארטים"), w: 2, cost: 2.5, price: 8 },
    { on: true, name: M.t("כוסות מוס"), w: 2, cost: 3, price: 9 },
    { on: true, name: M.t("מקרונים"), w: 1.5, cost: 1.8, price: 6 },
    { on: true, name: M.t("פרלינים / טראפלס"), w: 1.5, cost: 1.5, price: 5 },
    { on: true, name: M.t("מיני עוגות / קאפקייקס"), w: 1, cost: 3, price: 10 },
    { on: false, name: M.t("עוגיות מעוצבות"), w: 1, cost: 2, price: 7 },
    { on: false, name: M.t("פירות בשוקולד"), w: 1, cost: 2, price: 6 },
  ];

  let st = Object.assign({
    guests: 120, event: "wedding", meal: "full", ppg: "", buffer: true,
    types: DEFAULT_TYPES, setup: 350, delivery: 150, hours: 10, rate: 60,
  }, M.load(M.KEYS.dessertBar, {}));

  function save() { M.save(M.KEYS.dessertBar, st); }
  const suggestedPpg = () => EVENTS[st.event].base + MEAL_ADJ[st.meal];
  const ppg = () => M.parseNum(st.ppg) || suggestedPpg();

  function renderTypes() {
    $("types").innerHTML = st.types.map((t, i) => `
      <div class="db-type${t.on ? "" : " off"}" data-i="${i}">
        <input type="checkbox" class="tgl" data-f="on" ${t.on ? "checked" : ""} aria-label="לכלול ${M.esc(t.name)}">
        <div class="dbn"><label for="dt-n-${i}">סוג</label><input id="dt-n-${i}" type="text" data-f="name" value="${M.esc(t.name)}"></div>
        <div class="dbw"><label for="dt-w-${i}">משקל</label><input id="dt-w-${i}" type="number" min="0" step="0.5" inputmode="decimal" data-f="w" value="${t.w}"></div>
        <div><label for="dt-c-${i}">עלות ₪</label><input id="dt-c-${i}" type="number" min="0" step="0.1" inputmode="decimal" data-f="cost" value="${t.cost}"></div>
        <div><label for="dt-p-${i}">מחיר ₪</label><input id="dt-p-${i}" type="number" min="0" step="0.5" inputmode="decimal" data-f="price" value="${t.price}"></div>
      </div>`).join("");
  }
  $("types").addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row) return;
    const t = st.types[+row.dataset.i];
    const f = e.target.dataset.f;
    t[f] = f === "on" ? e.target.checked : f === "name" ? e.target.value : e.target.value;
    if (f === "on") row.classList.toggle("off", !t.on);
    update();
  });
  $("add-type").addEventListener("click", () => { st.types.push({ on: true, name: "", w: 1, cost: 2, price: 7 }); renderTypes(); update(); });

  function compute() {
    const guests = Math.max(0, M.parseNum(st.guests));
    let total = guests * ppg();
    if (st.buffer) total *= 1.1;
    const active = st.types.filter((t) => t.on && t.name && M.parseNum(t.w) > 0);
    const wsum = active.reduce((s, t) => s + M.parseNum(t.w), 0) || 1;
    const rows = active.map((t) => {
      const raw = (total * M.parseNum(t.w)) / wsum;
      const units = Math.ceil(raw / 6) * 6; // trays of 6
      return { name: t.name, units, cost: units * M.parseNum(t.cost), price: units * M.parseNum(t.price), unitPrice: M.parseNum(t.price) };
    });
    const units = rows.reduce((s, r) => s + r.units, 0);
    const ingCost = rows.reduce((s, r) => s + r.cost, 0);
    const labor = M.parseNum(st.hours) * M.parseNum(st.rate);
    const setup = M.parseNum(st.setup), delivery = M.parseNum(st.delivery);
    const priceItems = rows.reduce((s, r) => s + r.price, 0);
    const quote = priceItems + setup + delivery;
    const profit = quote - ingCost - labor;
    return { guests, rows, units, ingCost, labor, setup, delivery, quote, profit, perGuest: guests ? quote / guests : 0 };
  }

  function update() {
    $("ppg-hint").textContent = `מומלץ: ${M.num(suggestedPpg())} ל${EVENTS[st.event].name}`;
    $("d-ppg").placeholder = String(suggestedPpg());
    const c = compute();
    $("out-table").innerHTML = `<thead><tr><th>סוג</th><th class="num">יחידות</th><th class="num">עלות</th><th class="num">מחיר</th></tr></thead><tbody>` +
      c.rows.map((r) => `<tr><td>${M.esc(r.name)}</td><td class="num"><strong>${r.units}</strong></td><td class="num">${M.money(r.cost)}</td><td class="num">${M.money(r.price)}</td></tr>`).join("") +
      `<tr><td>עיצוב והקמה</td><td></td><td></td><td class="num">${M.money(c.setup)}</td></tr><tr><td>משלוח</td><td></td><td></td><td class="num">${M.money(c.delivery)}</td></tr>` +
      `<tr><th>סה״כ</th><th class="num">${c.units}</th><th class="num">${M.money(c.ingCost)}</th><th class="num">${M.money(c.quote)}</th></tr></tbody>`;
    $("out-stats").innerHTML = `
      <div class="stat hl"><div class="k">הצעת מחיר ללקוחה</div><div class="v">${M.money(c.quote)}</div></div>
      <div class="stat"><div class="k">לאורח</div><div class="v">${M.money(c.perGuest)}</div></div>
      <div class="stat"><div class="k">עלות חומרים + עבודה</div><div class="v">${M.money(c.ingCost + c.labor)}</div></div>
      <div class="stat"><div class="k">רווח משוער</div><div class="v" style="color:${c.profit < 0 ? "var(--danger)" : "inherit"}">${M.money(c.profit)}</div></div>`;
    save();
  }

  function bind(id, key, isCheck) {
    $(id).addEventListener(isCheck ? "change" : "input", (e) => { st[key] = isCheck ? e.target.checked : e.target.value; update(); });
  }
  $("d-event").innerHTML = Object.keys(EVENTS).map((k) => `<option value="${k}">${EVENTS[k].name}</option>`).join("");
  [["d-guests", "guests"], ["d-event", "event"], ["d-meal", "meal"], ["d-ppg", "ppg"], ["d-setup", "setup"], ["d-delivery", "delivery"], ["d-hours", "hours"], ["d-rate", "rate"]].forEach(([id, k]) => { $(id).value = st[k]; bind(id, k); });
  $("d-event").addEventListener("change", (e) => { st.event = e.target.value; update(); });
  $("d-meal").addEventListener("change", (e) => { st.meal = e.target.value; update(); });
  $("d-buffer").checked = st.buffer; bind("d-buffer", "buffer", true);

  function summaryText(c) {
    return [`בר קינוחים — ${EVENTS[st.event].name}, ${c.guests} אורחים`]
      .concat(c.rows.map((r) => `• ${r.units} ${r.name}`))
      .concat([`סה״כ ${c.units} יחידות`, `מחיר: ${M.money(c.quote)} (${M.money(c.perGuest)} לאורח)`]).join("\n");
  }
  $("copy-btn").addEventListener("click", () => M.copyText(summaryText(compute())));
  $("print-btn").addEventListener("click", () => window.print());
  $("to-quote").addEventListener("click", () => {
    const c = compute();
    const items = c.rows.map((r) => ({ desc: r.name, qty: r.units, price: r.unitPrice }));
    if (c.setup) items.push({ desc: M.t("עיצוב והקמת שולחן קינוחים"), qty: 1, price: c.setup });
    if (c.delivery) items.push({ desc: M.t("משלוח"), qty: 1, price: c.delivery });
    M.save("mirel_quote_import_v1", { title: M.t("בר קינוחים ל{0} — {1} אורחים", M.t(EVENTS[st.event].name), c.guests), items });
    location.href = "quote.html?from=bar";
  });

  M.mountBackup("backup", [M.KEYS.dessertBar], "dessert-bar");
  renderTypes();
  update();
})();
