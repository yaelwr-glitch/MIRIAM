/* מחולל הצעת מחיר */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const DRAFT_KEY = "mirel_quote_draft_v1";

  const DEFAULT_TERMS = [
    "• ההזמנה נכנסת ליומן לאחר תשלום המקדמה.",
    "• יתרת התשלום — עד יום המסירה (מזומן / העברה / ביט).",
    "• ביטול עד 7 ימים לפני האירוע — המקדמה מוחזרת. פחות מ־7 ימים — המקדמה אינה מוחזרת.",
    "• שינויים בהזמנה — עד 5 ימים לפני מועד המסירה.",
    "• המוצרים מכילים או עלולים להכיל: גלוטן, חלב, ביצים, אגוזים ובוטנים. נא לעדכן על אלרגיות.",
    "• יש לשמור את הקינוחים בקירור עד ההגשה.",
  ].join("\n");

  let profile = M.getProfile();
  let quotes = M.load(M.KEYS.quotes, []);
  let q = M.load(DRAFT_KEY, null) || blank();

  function nextNumber() {
    const n = quotes.reduce((m, x) => Math.max(m, parseInt(String(x.number).replace(/\D/g, ""), 10) || 0), 1000);
    return String(n + 1);
  }
  function blank() {
    return { id: null, number: "", customer: "", phone: "", event: "", date: "", valid: 14, created: new Date().toISOString().slice(0, 10),
      items: [{ desc: "", qty: 1, price: "" }], discount: "", deposit: 30, vat: false, terms: DEFAULT_TERMS, notes: "תודה שבחרת בנו! נשמח להכין לך משהו מיוחד 💗" };
  }
  if (!q.number) q.number = nextNumber();

  // import from dessert bar
  if (new URLSearchParams(location.search).get("from") === "bar") {
    const imp = M.load("mirel_quote_import_v1", null);
    if (imp && imp.items) {
      q = blank(); q.number = nextNumber(); q.event = imp.title; q.items = imp.items;
      try { localStorage.removeItem("mirel_quote_import_v1"); } catch (e) { /* ignore */ }
      history.replaceState(null, "", "quote.html");
      setTimeout(() => M.toast("הפריטים מבר הקינוחים נטענו ✓"), 300);
    }
  }

  function totals() {
    const sub = q.items.reduce((s, it) => s + M.parseNum(it.qty) * M.parseNum(it.price), 0);
    const disc = Math.min(sub, M.parseNum(q.discount));
    const net = sub - disc;
    const vat = q.vat ? net * 0.18 : 0;
    const total = net + vat;
    const deposit = Math.round(total * (M.parseNum(q.deposit) / 100));
    return { sub, disc, vat, total, deposit, rest: total - deposit };
  }
  const heDate = (s) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL") : "");
  function validUntil() { const d = new Date(q.created + "T12:00:00"); d.setDate(d.getDate() + (M.parseNum(q.valid) || 14)); return d.toLocaleDateString("he-IL"); }

  /* ---------- Editor ---------- */
  function renderItems() {
    $("items").innerHTML = q.items.map((it, i) => `
      <div class="qi-row" data-i="${i}">
        <div class="qi-d"><label for="qi-d-${i}">תיאור</label><input id="qi-d-${i}" type="text" data-f="desc" value="${M.esc(it.desc)}"></div>
        <div><label for="qi-q-${i}">כמות</label><input id="qi-q-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="qty" value="${M.esc(it.qty)}"></div>
        <div><label for="qi-p-${i}">מחיר ליח׳ ₪</label><input id="qi-p-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="price" value="${M.esc(it.price)}"></div>
        <button type="button" class="icon-btn" data-del="${i}" aria-label="מחיקה">✕</button>
      </div>`).join("");
  }
  function fill() {
    $("p-business").value = profile.business; $("p-phone").value = profile.phone;
    ["customer", "phone", "event", "date", "number", "valid", "discount", "deposit", "terms", "notes"].forEach((k) => ($("q-" + k).value = q[k] == null ? "" : q[k]));
    $("q-vat").checked = !!q.vat;
    renderItems();
    render();
  }

  /* ---------- Preview ---------- */
  function render() {
    const t = totals();
    $("sheet").innerHTML = `
      <div class="q-top">
        <div class="q-brand">${profile.logo ? `<img src="${profile.logo}" alt="לוגו">` : ""}
          <div><h2>${M.esc(profile.business || "שם העסק שלך")}</h2><div class="small">${[profile.phone, profile.instagram].filter(Boolean).map(M.esc).join(" · ")}</div></div></div>
        <div class="q-meta"><div class="q-title">הצעת מחיר</div>מס׳ ${M.esc(q.number)}<br>תאריך: ${heDate(q.created)}<br>בתוקף עד: ${validUntil()}</div>
      </div>
      <div class="q-to"><strong>לכבוד:</strong> ${M.esc(q.customer || "שם הלקוחה")}${q.phone ? " · " + M.esc(q.phone) : ""}
        ${q.event ? `<br><strong>עבור:</strong> ${M.esc(q.event)}` : ""}${q.date ? `<br><strong>תאריך האירוע:</strong> ${heDate(q.date)}` : ""}</div>
      <table><thead><tr><th>פריט</th><th class="num">כמות</th><th class="num">מחיר</th><th class="num">סה״כ</th></tr></thead><tbody>
        ${q.items.filter((it) => it.desc).map((it) => `<tr><td>${M.esc(it.desc)}</td><td class="num">${M.num(M.parseNum(it.qty))}</td><td class="num">${M.money(M.parseNum(it.price))}</td><td class="num">${M.money(M.parseNum(it.qty) * M.parseNum(it.price))}</td></tr>`).join("")}
      </tbody></table>
      <div class="q-totals">
        <div><span>סכום ביניים</span><span>${M.money(t.sub)}</span></div>
        ${t.disc ? `<div><span>הנחה</span><span>−${M.money(t.disc)}</span></div>` : ""}
        ${q.vat ? `<div><span>מע״מ 18%</span><span>${M.money(t.vat)}</span></div>` : ""}
        <div class="grand"><span>סה״כ לתשלום</span><span>${M.money(t.total)}</span></div>
        ${M.parseNum(q.deposit) ? `<div><span>מקדמה (${M.num(M.parseNum(q.deposit))}%)</span><span>${M.money(t.deposit)}</span></div><div><span>יתרה ביום המסירה</span><span>${M.money(t.rest)}</span></div>` : ""}
      </div>
      ${q.notes ? `<p style="margin-top:14px">${M.esc(q.notes)}</p>` : ""}
      ${q.terms ? `<div class="q-terms"><strong>תנאים</strong>\n${M.esc(q.terms)}</div>` : ""}
      <div class="q-sign"><span>חתימת העסק</span><span>אישור הלקוחה</span></div>`;
    $("wa-btn").href = M.waLink(waText(t), q.phone);
    M.save(DRAFT_KEY, q);
  }
  function waText(t) {
    const lines = [`היי ${q.customer || ""}, מצרפת הצעת מחיר${q.event ? " עבור " + q.event : ""} 🎂`, ""];
    q.items.filter((it) => it.desc).forEach((it) => lines.push(`• ${it.desc} × ${M.num(M.parseNum(it.qty))} — ${M.money(M.parseNum(it.qty) * M.parseNum(it.price))}`));
    lines.push("", `סה״כ: ${M.money(t.total)}${q.vat ? " (כולל מע״מ)" : ""}`);
    if (M.parseNum(q.deposit)) lines.push(`מקדמה לשריון התאריך: ${M.money(t.deposit)}`);
    lines.push(`ההצעה בתוקף עד ${validUntil()}.`, "", "לאישור — פשוט עני לי כאן 🙂", profile.business || "");
    return lines.join("\n");
  }

  /* ---------- Events ---------- */
  $("p-business").addEventListener("input", (e) => { profile.business = e.target.value; M.setProfile(profile); render(); });
  $("p-phone").addEventListener("input", (e) => { profile.phone = e.target.value; M.setProfile(profile); render(); });
  $("p-logo").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { profile.logo = await M.fileToDataURL(f, 300, 0.85); M.setProfile(profile); render(); } catch (err) { M.toast("לא הצלחנו לקרוא את התמונה"); }
  });
  ["customer", "phone", "event", "date", "number", "valid", "discount", "deposit", "terms", "notes"].forEach((k) =>
    $("q-" + k).addEventListener("input", (e) => { q[k] = e.target.value; render(); }));
  $("q-vat").addEventListener("change", (e) => { q.vat = e.target.checked; render(); });

  $("items").addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row || !e.target.dataset.f) return;
    q.items[+row.dataset.i][e.target.dataset.f] = e.target.value; render();
  });
  $("items").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    q.items.splice(+b.dataset.del, 1); if (!q.items.length) q.items.push({ desc: "", qty: 1, price: "" });
    renderItems(); render();
  });
  $("add-item").addEventListener("click", () => { q.items.push({ desc: "", qty: 1, price: "" }); renderItems(); render(); });

  const recipes = M.getRecipes();
  $("from-recipe").innerHTML = recipes.length ? recipes.map((r) => `<option value="${r.id}">${M.esc(r.name)}</option>`).join("") : `<option value="">אין מתכונים שמורים</option>`;
  $("add-recipe").disabled = !recipes.length;
  $("add-recipe").addEventListener("click", () => {
    const r = recipes.find((x) => x.id === $("from-recipe").value); if (!r) return;
    q.items = q.items.filter((it) => it.desc || it.price);
    q.items.push({ desc: r.name, qty: 1, price: M.calcRecipe(r).rounded }); renderItems(); render();
  });

  /* ---------- Save / list ---------- */
  function renderSaved() {
    $("saved").innerHTML = quotes.length ? quotes.map((x) => `<li class="saved-item"><div><strong>#${M.esc(x.number)} · ${M.esc(x.customer || "ללא שם")}</strong><span class="meta">${M.esc(x.event || "")} ${heDate(x.created)}</span></div>
      <div class="btn-row"><button class="btn btn-sm btn-ghost" data-open="${x.id}" type="button">פתיחה</button><button class="btn btn-sm btn-ghost" data-dup="${x.id}" type="button">שכפול</button><button class="btn btn-sm btn-danger" data-rm="${x.id}" type="button">מחיקה</button></div></li>`).join("")
      : `<li class="empty">אין הצעות שמורות</li>`;
  }
  $("saved").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const x = quotes.find((y) => y.id === (b.dataset.open || b.dataset.dup || b.dataset.rm)); if (!x) return;
    if (b.dataset.open) { q = JSON.parse(JSON.stringify(x)); fill(); window.scrollTo({ top: 0 }); }
    else if (b.dataset.dup) { q = JSON.parse(JSON.stringify(x)); q.id = null; q.number = nextNumber(); q.created = new Date().toISOString().slice(0, 10); fill(); M.toast("נוצר עותק — זכרי לשמור"); }
    else if (b.dataset.rm && confirm("למחוק את ההצעה?")) { quotes = quotes.filter((y) => y !== x); M.save(M.KEYS.quotes, quotes); renderSaved(); }
  });
  $("save-btn").addEventListener("click", () => {
    if (!q.id) q.id = M.uid();
    const i = quotes.findIndex((x) => x.id === q.id);
    const copy = JSON.parse(JSON.stringify(q));
    if (i >= 0) quotes[i] = copy; else quotes.unshift(copy);
    if (M.save(M.KEYS.quotes, quotes)) { M.toast("ההצעה נשמרה ✓"); renderSaved(); render(); }
  });
  $("new-quote").addEventListener("click", () => { q = blank(); q.number = nextNumber(); fill(); });
  $("pdf-btn").addEventListener("click", () => window.print());
  $("png-btn").addEventListener("click", () => M.saveAsPNG($("sheet"), `quote-${q.number}.png`));

  M.mountBackup("backup", [M.KEYS.quotes, M.KEYS.profile, DRAFT_KEY], "quotes");
  fill();
  renderSaved();
})();
