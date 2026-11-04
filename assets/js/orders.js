/* יומן הזמנות חכם */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const todayStr = ymd(new Date());
  const heDate = (s) => parseYmd(s).toLocaleDateString(M.locale, { weekday: "long", day: "numeric", month: "long" });

  let orders = M.load(M.KEYS.orders, []);
  let recipes = M.getRecipes();
  let editingId = null;
  let formItems = [];
  let viewMonth = new Date(); viewMonth.setDate(1);
  let selDay = todayStr;

  const recipeById = (id) => recipes.find((r) => r.id === id);
  const itemLabel = (it) => (it.recipeId && recipeById(it.recipeId) ? recipeById(it.recipeId).name : it.name || "פריט");
  function persist() { M.save(M.KEYS.orders, orders); }

  /* ---------- Form ---------- */
  function recipeOptions(sel) {
    return `<option value="">— פריט חופשי —</option>` + recipes.map((r) => `<option value="${r.id}"${r.id === sel ? " selected" : ""}>${M.esc(r.name)}</option>`).join("");
  }
  function renderFormItems() {
    $("o-items").innerHTML = formItems.map((it, i) => `
      <div class="row-item" data-i="${i}" style="grid-template-columns:1fr">
        <div><label for="oi-r-${i}">ממתכון שמור</label><select id="oi-r-${i}" data-f="recipeId">${recipeOptions(it.recipeId)}</select></div>
        <div class="order-item-row">
          <div><label for="oi-n-${i}">${it.recipeId ? "הערה לפריט" : "שם הפריט"}</label><input id="oi-n-${i}" type="text" data-f="name" value="${M.esc(it.name)}"></div>
          <div><label for="oi-q-${i}">כמות</label><input id="oi-q-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="qty" value="${M.esc(it.qty)}"></div>
          <button type="button" class="icon-btn" data-del="${i}" aria-label="מחיקת פריט">✕</button>
        </div>
      </div>`).join("");
    updatePriceHint();
  }
  function suggestedTotal() {
    return formItems.reduce((s, it) => {
      const r = it.recipeId && recipeById(it.recipeId);
      return s + (r ? M.calcRecipe(r).rounded * (M.parseNum(it.qty) || 0) : 0);
    }, 0);
  }
  function updatePriceHint() {
    const s = suggestedTotal();
    $("o-price-hint").textContent = s ? "לפי המחשבון: " + M.money(s) : "";
    $("o-price").placeholder = s ? String(s) : "";
  }
  $("o-items").addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row || !e.target.dataset.f) return;
    formItems[+row.dataset.i][e.target.dataset.f] = e.target.value;
    if (e.target.dataset.f === "recipeId") renderFormItems(); else updatePriceHint();
  });
  $("o-items").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    formItems.splice(+b.dataset.del, 1);
    if (!formItems.length) formItems.push({ recipeId: "", name: "", qty: 1 });
    renderFormItems();
  });
  $("o-add-item").addEventListener("click", () => { formItems.push({ recipeId: "", name: "", qty: 1 }); renderFormItems(); });

  function resetForm(due) {
    editingId = null;
    $("order-form").reset();
    $("o-due").value = due || selDay || todayStr;
    formItems = [{ recipeId: recipes[0] ? recipes[0].id : "", name: "", qty: 1 }];
    $("form-title").textContent = "הזמנה חדשה";
    $("o-cancel").classList.add("hidden");
    renderFormItems();
  }
  function editOrder(o) {
    editingId = o.id;
    $("o-customer").value = o.customer; $("o-phone").value = o.phone || ""; $("o-due").value = o.due;
    $("o-time").value = o.time || ""; $("o-delivery").value = o.delivery || "pickup";
    $("o-price").value = o.price || ""; $("o-deposit").value = o.deposit || ""; $("o-notes").value = o.notes || "";
    formItems = JSON.parse(JSON.stringify(o.items || []));
    if (!formItems.length) formItems.push({ recipeId: "", name: "", qty: 1 });
    $("form-title").textContent = "עריכת הזמנה";
    $("o-cancel").classList.remove("hidden");
    renderFormItems();
    $("order-form").scrollIntoView({ behavior: "smooth", block: "start" });
    $("o-customer").focus();
  }
  $("o-cancel").addEventListener("click", () => resetForm());

  $("order-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const customer = $("o-customer").value.trim();
    const due = $("o-due").value;
    if (!customer || !due) { M.toast("חסר שם לקוחה או תאריך"); return; }
    const items = formItems.filter((it) => it.recipeId || it.name.trim()).map((it) => ({ recipeId: it.recipeId || "", name: it.name.trim(), qty: M.parseNum(it.qty) || 1 }));
    const priceVal = $("o-price").value;
    const o = {
      id: editingId || M.uid(), customer, phone: $("o-phone").value.trim(), due, time: $("o-time").value,
      delivery: $("o-delivery").value, items,
      price: priceVal === "" ? suggestedTotal() : M.parseNum(priceVal),
      deposit: M.parseNum($("o-deposit").value), notes: $("o-notes").value.trim(),
      done: false, created: Date.now(),
    };
    const idx = orders.findIndex((x) => x.id === o.id);
    if (idx >= 0) { o.done = orders[idx].done; o.created = orders[idx].created; orders[idx] = o; } else orders.push(o);
    persist();
    M.toast(idx >= 0 ? "ההזמנה עודכנה ✓" : "ההזמנה נשמרה ✓");
    selDay = due;
    const d = parseYmd(due); viewMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    resetForm(due);
    renderAll();
  });

  /* ---------- Order card ---------- */
  function orderCard(o, showDate) {
    const remaining = (o.price || 0) - (o.deposit || 0);
    const msg = M.t("היי {0}, תזכורת: ההזמנה שלך מוכנה ל{1} ב{2}{3}. נשאר לתשלום: {4}. תודה! 💗", o.customer, M.t(o.delivery === "delivery" ? "משלוח" : "איסוף"), heDate(o.due), o.time ? " " + M.t("בשעה {0}", o.time) : "", M.money(remaining));
    return `<div class="order-card${o.done ? " done" : ""}">
      <div class="oc-top">
        <strong>${M.esc(o.customer)}${o.time ? " · " + M.esc(o.time) : ""}</strong>
        <span>${o.done ? '<span class="pill pill-ok">הושלמה</span>' : remaining > 0 ? `<span class="pill pill-warn">נותר ${M.money(remaining)}</span>` : '<span class="pill pill-ok">שולם</span>'}</span>
      </div>
      ${showDate ? `<div class="small muted">${heDate(o.due)} · ${o.delivery === "delivery" ? "משלוח" : "איסוף עצמי"}</div>` : `<div class="small muted">${o.delivery === "delivery" ? "משלוח" : "איסוף עצמי"}</div>`}
      <ul>${(o.items || []).map((it) => `<li>${M.num(it.qty)} × ${M.esc(itemLabel(it))}${it.recipeId && it.name ? " — " + M.esc(it.name) : ""}</li>`).join("")}</ul>
      ${o.notes ? `<div class="small">📝 ${M.esc(o.notes)}</div>` : ""}
      <div class="small">מחיר: ${M.money(o.price || 0)} · מקדמה: ${M.money(o.deposit || 0)}</div>
      <div class="btn-row no-print">
        <button class="btn btn-sm ${o.done ? "btn-ghost" : ""}" data-done="${o.id}" type="button">${o.done ? "החזרה לפתוחה" : "✓ סיימתי"}</button>
        <button class="btn btn-sm btn-ghost" data-edit="${o.id}" type="button">עריכה</button>
        ${o.phone ? `<a class="btn btn-sm btn-ghost" href="${M.waLink(msg, o.phone)}" target="_blank" rel="noopener">תזכורת בוואטסאפ</a>` : ""}
        <button class="btn btn-sm btn-danger" data-rm="${o.id}" type="button">מחיקה</button>
      </div>
    </div>`;
  }
  function onCardClick(e) {
    const b = e.target.closest("button");
    if (!b) return;
    const o = orders.find((x) => x.id === (b.dataset.done || b.dataset.edit || b.dataset.rm));
    if (!o) return;
    if (b.dataset.done) {
      o.done = !o.done; persist();
      if (o.done) { const r = b.getBoundingClientRect(); M.confetti({ x: r.left + r.width / 2, y: r.top }); M.toast("עוד הזמנה יצאה לדרך 🎉"); }
      renderAll();
    }
    else if (b.dataset.edit) editOrder(o);
    else if (b.dataset.rm && confirm(`למחוק את ההזמנה של ${o.customer}?`)) { orders = orders.filter((x) => x !== o); persist(); renderAll(); }
  }
  $("day-panel").addEventListener("click", onCardClick);
  $("order-list").addEventListener("click", onCardClick);

  /* ---------- Calendar ---------- */
  function renderCal() {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
    $("cal-title").textContent = new Intl.DateTimeFormat(M.locale, { month: "long", year: "numeric" }).format(new Date(y, m, 1));
    const first = new Date(y, m, 1);
    const start = new Date(first); start.setDate(1 - first.getDay()); // Sunday start
    const byDay = {};
    orders.forEach((o) => { (byDay[o.due] = byDay[o.due] || []).push(o); });
    const dow = new Intl.DateTimeFormat(M.locale, { weekday: M.lang === "he" ? "narrow" : "short" });
    let html = [0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="dow" aria-hidden="true" data-no-i18n>${dow.format(new Date(2023, 0, 1 + i))}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const s = ymd(d);
      const list = byDay[s] || [];
      const cls = ["day", d.getMonth() !== m && "other", s === todayStr && "today", s === selDay && "sel", list.length && list.every((o) => o.done) && "alldone"].filter(Boolean).join(" ");
      html += `<button type="button" class="${cls}" data-day="${s}" aria-label="${heDate(s)}${list.length ? ", " + list.length + " הזמנות" : ""}">${d.getDate()}${list.length ? `<span class="cnt">${list.length}</span>` : ""}</button>`;
      if (i === 34 && new Date(start.getTime() + 35 * 864e5).getMonth() !== m) break;
    }
    $("cal").innerHTML = html;
    renderDay();
  }
  $("cal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (!b) return;
    selDay = b.dataset.day;
    if (!editingId) $("o-due").value = selDay;
    renderCal();
  });
  $("cal-prev").addEventListener("click", () => { viewMonth.setMonth(viewMonth.getMonth() - 1); renderCal(); });
  $("cal-next").addEventListener("click", () => { viewMonth.setMonth(viewMonth.getMonth() + 1); renderCal(); });

  function renderDay() {
    const list = orders.filter((o) => o.due === selDay).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const prep = {};
    list.filter((o) => !o.done).forEach((o) => (o.items || []).forEach((it) => { const k = itemLabel(it); prep[k] = (prep[k] || 0) + (M.parseNum(it.qty) || 0); }));
    const prepHtml = Object.keys(prep).length
      ? `<div class="info-box" style="margin-bottom:10px"><strong>מה מכינים היום:</strong> ${Object.entries(prep).map(([k, v]) => `${M.num(v)} × ${M.esc(k)}`).join(" · ")}</div>` : "";
    $("day-panel").innerHTML = `<h3>${heDate(selDay)}</h3>${prepHtml}` +
      (list.length ? `<div class="rows">${list.map((o) => orderCard(o, false)).join("")}</div>` : `<div class="empty">אין הזמנות ביום הזה. <button class="btn btn-sm btn-outline no-print" type="button" id="add-here">+ הזמנה ליום הזה</button></div>`);
    const addHere = $("add-here");
    if (addHere) addHere.addEventListener("click", () => { resetForm(selDay); $("o-customer").focus(); });
  }

  /* ---------- List ---------- */
  function renderList() {
    const showDone = $("show-done").checked;
    const list = orders.filter((o) => showDone || !o.done).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
    $("order-list").innerHTML = list.length ? list.map((o) => orderCard(o, true)).join("") : `<div class="empty">אין הזמנות פתוחות 🎉</div>`;
  }
  $("show-done").addEventListener("change", renderList);

  /* ---------- Shopping list ---------- */
  function shoppingData() {
    const from = $("shop-from").value, to = $("shop-to").value;
    const agg = {}; const missing = new Set();
    orders.filter((o) => !o.done && o.due >= from && o.due <= to).forEach((o) => {
      (o.items || []).forEach((it) => {
        const r = it.recipeId && recipeById(it.recipeId);
        if (!r) { missing.add(it.name || "פריט"); return; }
        const mult = M.parseNum(it.qty) || 0;
        (r.ingredients || []).forEach((ing) => {
          if (!ing.name) return;
          const b = M.toBase(M.parseNum(ing.qty), ing.unit);
          const key = ing.name.trim() + "|" + b.base;
          agg[key] = agg[key] || { name: ing.name.trim(), base: b.base, qty: 0 };
          agg[key].qty += b.qty * mult;
        });
        (r.extras || []).forEach((x) => {
          if (!x.name) return;
          const key = x.name.trim() + "|unit";
          agg[key] = agg[key] || { name: x.name.trim(), base: "unit", qty: 0, extra: true };
          agg[key].qty += mult;
        });
      });
    });
    const items = Object.values(agg).sort((a, b) => a.name.localeCompare(b.name, "he"));
    return { items, missing: [...missing], from, to };
  }
  function renderShop() {
    const d = shoppingData();
    let html = `<h3 class="print-only">רשימת קניות ${d.from} – ${d.to}</h3>`;
    if (!d.items.length) html += `<div class="empty">אין מה לקנות בטווח הזה (או שההזמנות לא מקושרות למתכונים שמורים).</div>`;
    else html += d.items.map((x, i) => `<div class="shop-item"><label><input type="checkbox"><span>${M.esc(x.name)}</span></label><strong>${M.fmtAmount(x.qty, x.base)}</strong></div>`).join("");
    if (d.missing.length) html += `<p class="hint" style="margin-top:10px">פריטים בלי מתכון שמור (לא נכללו ברשימה): ${d.missing.map(M.esc).join(", ")}</p>`;
    $("shop-list").innerHTML = html;
    $("shop-wa").href = M.waLink(shopText(d));
  }
  function shopText(d) {
    return `רשימת קניות (${d.from} – ${d.to}):\n` + d.items.map((x) => `☐ ${x.name} — ${M.fmtAmount(x.qty, x.base)}`).join("\n");
  }
  $("shop-from").addEventListener("change", renderShop);
  $("shop-to").addEventListener("change", renderShop);
  $("shop-copy").addEventListener("click", () => M.copyText(shopText(shoppingData())));
  $("shop-print").addEventListener("click", () => window.print());

  /* ---------- Stats ---------- */
  function renderStats() {
    const ym = todayStr.slice(0, 7);
    const month = orders.filter((o) => o.due.slice(0, 7) === ym);
    const revenue = month.reduce((s, o) => s + (o.price || 0), 0);
    const open = orders.filter((o) => !o.done && o.due >= todayStr);
    const owed = orders.filter((o) => !o.done).reduce((s, o) => s + Math.max(0, (o.price || 0) - (o.deposit || 0)), 0);
    const week = new Date(); week.setDate(week.getDate() + 7);
    const thisWeek = open.filter((o) => o.due <= ymd(week)).length;
    $("stats").innerHTML = `
      <div class="stat hl"><div class="k">הכנסות החודש</div><div class="v">${M.money(revenue)}</div></div>
      <div class="stat"><div class="k">הזמנות החודש</div><div class="v">${month.length}</div></div>
      <div class="stat"><div class="k">ב־7 הימים הקרובים</div><div class="v">${thisWeek}</div></div>
      <div class="stat"><div class="k">יתרה לגבייה</div><div class="v">${M.money(owed)}</div></div>`;
  }

  /* ---------- Tabs ---------- */
  document.querySelectorAll("[data-view]").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    ["cal", "list", "shop"].forEach((v) => $("view-" + v).classList.toggle("hidden", v !== t.dataset.view));
  }));

  function renderAll() { renderStats(); renderCal(); renderList(); renderShop(); }

  /* ---------- Init ---------- */
  const wk = new Date(); wk.setDate(wk.getDate() + 7);
  $("shop-from").value = todayStr;
  $("shop-to").value = ymd(wk);
  M.mountBackup("backup", [M.KEYS.orders, M.KEYS.recipes], "orders");
  resetForm(todayStr);
  if (!recipes.length) $("o-price-hint").textContent = "טיפ: שמרי מתכונים במחשבון המחירים כדי לקבל מחיר ורשימת קניות אוטומטית.";
  renderAll();
})();
