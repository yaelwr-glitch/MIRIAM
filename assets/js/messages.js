/* בנק הודעות ללקוחות */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  const CATS = { inquiry: "פנייה ראשונה", order: "אישור הזמנה", payment: "תשלום", reminder: "תזכורת", after: "אחרי ההזמנה", promo: "מבצעים וחגים", insta: "אינסטגרם" };

  const DEFAULTS = [
    { id: "d1", cat: "inquiry", title: "מענה לפנייה ראשונה", body: "היי {שם}, תודה שפנית! 😊\nאשמח לעזור לך עם {מוצר}.\nכדי שאוכל לתת לך הצעה מדויקת — לאיזה תאריך, לכמה אנשים, והאם יש סגנון או צבעים שאת אוהבת?\nמצרפת את התפריט שלנו: {קישור}\n{עסק}" },
    { id: "d2", cat: "inquiry", title: "שליחת מחירון", body: "היי {שם}, הנה המחירון המעודכן שלנו 🍰\n{קישור}\nכל העוגות מוכנות בהזמנה אישית, מחומרי גלם איכותיים. הזמנות עד 3 ימים מראש.\nמה מתאים לך?" },
    { id: "d3", cat: "order", title: "אישור הזמנה", body: "היי {שם}, ההזמנה שלך אושרה! 🎉\n\n🍰 {מוצר}\n📅 {תאריך} בשעה {שעה}\n💰 סה״כ: {מחיר} ₪\n\nאם יש שינוי או אלרגיה שחשוב לי לדעת — כתבי לי כאן.\nתודה שבחרת ב{עסק} 💗" },
    { id: "d4", cat: "payment", title: "בקשת מקדמה", body: "היי {שם}, כדי לשריין לך את התאריך ({תאריך}) אשמח למקדמה של {מקדמה} ₪.\nאפשר בביט / פייבוקס / העברה לטלפון הזה.\nברגע שהמקדמה מתקבלת — ההזמנה נכנסת ליומן ✔️" },
    { id: "d5", cat: "payment", title: "אישור קבלת תשלום", body: "קיבלתי, תודה רבה {שם}! 🙏\nההזמנה שלך ל{תאריך} משוריינת. אשלח תזכורת יום לפני." },
    { id: "d6", cat: "reminder", title: "תזכורת לאיסוף", body: "היי {שם} 😊 תזכורת קטנה:\nה{מוצר} שלך מוכנה לאיסוף מחר, {תאריך}, בשעה {שעה}.\nיתרה לתשלום: {מחיר} ₪.\nמחכה לך!" },
    { id: "d7", cat: "reminder", title: "יצאה למשלוח", body: "היי {שם}, ההזמנה יצאה לדרך! 🚗\nהשליח יגיע בערך ב־{שעה}.\nחשוב: לשמור במקרר עד ההגשה ולהוציא כ־20 דקות לפני. בתיאבון!" },
    { id: "d8", cat: "after", title: "תודה + בקשת המלצה", body: "היי {שם}, איך היה? 💗\nמקווה שהעוגה שימחה את כולם!\nאם נהניתן — אשמח מאוד לכמה מילים שאוכל לשתף, ואפילו לתמונה מהאירוע 📸\nזה עוזר לעסק קטן כמו שלי יותר ממה שנדמה.\nתודה! {עסק}" },
    { id: "d9", cat: "after", title: "בקשת ביקורת בגוגל", body: "היי {שם}, תודה שוב על ההזמנה!\nאם יש לך דקה — ביקורת קצרה בגוגל תעזור לי מאוד:\n{קישור}\nתודה מכל הלב 🙏" },
    { id: "d10", cat: "after", title: "לקוחה שלא הזמינה מזמן", body: "היי {שם}, מזמן לא דיברנו! 😊\nרציתי לספר שיש לנו מוצרים חדשים בתפריט — {מוצר}.\nללקוחות חוזרות יש השבוע 10% הנחה. שמחה לשמוע ממך!" },
    { id: "d11", cat: "promo", title: "מבצע לחג", body: "✨ {חג} מתקרב! ✨\nמארזי החג של {עסק} כבר כאן — {מוצר}.\nמספר המקומות מוגבל, הזמנות עד {תאריך}.\nלהזמנה — עני להודעה הזו 💗\n{קישור}" },
    { id: "d12", cat: "promo", title: "מארזי משלוח מנות / מתנות", body: "מחפשת מתנה שמרגשת? 🎁\nמארזי {מוצר} מעוצבים, ארוזים ומוכנים לנתינה — עם כרטיס ברכה אישי.\nמחיר: {מחיר} ₪. הזמנות עד {תאריך}.\n{עסק}" },
    { id: "d13", cat: "promo", title: "נשארו מקומות אחרונים", body: "היי {שם}! נשארו רק כמה מקומות אחרונים להזמנות ל{חג} 🍰\nאם רצית להזמין — זה הזמן. אשמח לשריין לך!" },
    { id: "d14", cat: "insta", title: "תגובה ל-DM באינסטגרם", body: "היי {שם}, תודה על ההודעה! 💗\nהכי נוח להמשיך בוואטסאפ — שם אשלח תפריט ומחירים: {קישור}" },
    { id: "d15", cat: "insta", title: "סטורי: נפתחו הזמנות", body: "📣 נפתחו ההזמנות ל{חג}!\n{מוצר}\nהזמנות בהודעה פרטית / בקישור בביו 👆\nמספר מוגבל!" },
    { id: "d16", cat: "order", title: "סירוב מנומס (אין מקום ביומן)", body: "היי {שם}, תודה רבה שפנית! 🙏\nלצערי ב{תאריך} היומן שלי כבר מלא ואני לא אוכל לתת לך את השירות שמגיע לך.\nאשמח מאוד לעזור בתאריך אחר — ואשמור לך מקום בפעם הבאה 💗" },
  ];

  let st = Object.assign({ vars: {}, phone: "", custom: [], cat: "all" }, M.load(M.KEYS.messages, {}));
  const prof = M.getProfile();
  if (!st.vars["עסק"] && prof.business) st.vars["עסק"] = prof.business;
  let editing = null;

  function save() { M.save(M.KEYS.messages, st); }
  const all = () => st.custom.concat(DEFAULTS.filter((d) => !st.custom.some((c) => c.overrides === d.id)));
  const ALIAS = { name: "שם", nom: "שם", product: "מוצר", produit: "מוצר", date: "תאריך", time: "שעה", heure: "שעה", price: "מחיר", prix: "מחיר", deposit: "מקדמה", acompte: "מקדמה", holiday: "חג", fete: "חג", business: "עסק", entreprise: "עסק", link: "קישור", lien: "קישור" };
  function fillText(body) {
    return M.t(body).replace(/\{([^}]+)\}/g, (m, k) => {
      const v = (st.vars[ALIAS[k] || k] || "").trim();
      return v || `[${k}]`;
    });
  }

  function renderCats() {
    $("cats").innerHTML = `<button type="button" class="chip" data-cat="all" aria-pressed="${st.cat === "all"}">הכול</button>` +
      Object.keys(CATS).map((k) => `<button type="button" class="chip" data-cat="${k}" aria-pressed="${st.cat === k}">${CATS[k]}</button>`).join("");
  }
  function renderList() {
    const items = all().filter((t) => st.cat === "all" || t.cat === st.cat);
    $("list").innerHTML = items.map((t) => `
      <article class="msg-card">
        <div class="panel-head"><h3 style="margin:0">${M.esc(t.title)}</h3><span class="pill">${CATS[t.cat] || ""}${t.custom ? " · שלי" : ""}</span></div>
        <div class="msg-box">${M.esc(fillText(t.body))}</div>
        <div class="btn-row" style="margin-top:10px">
          <button type="button" class="btn btn-sm" data-copy="${t.id}">העתקה</button>
          <a class="btn btn-sm btn-ghost" href="${M.waLink(fillText(t.body), st.phone)}" target="_blank" rel="noopener">וואטסאפ</a>
          <button type="button" class="btn btn-sm btn-ghost" data-edit="${t.id}">עריכה</button>
          ${t.custom ? `<button type="button" class="btn btn-sm btn-danger" data-rm="${t.id}">${t.overrides ? "חזרה למקור" : "מחיקה"}</button>` : ""}
        </div>
      </article>`).join("") || `<div class="empty">אין תבניות בנושא הזה</div>`;
  }

  document.querySelectorAll("[data-v]").forEach((el) => {
    el.value = st.vars[el.dataset.v] || "";
    el.addEventListener("input", () => { st.vars[el.dataset.v] = el.value; save(); renderList(); });
  });
  $("v-phone").value = st.phone;
  $("v-phone").addEventListener("input", (e) => { st.phone = e.target.value; save(); renderList(); });

  $("cats").addEventListener("click", (e) => { const c = e.target.closest("[data-cat]"); if (!c) return; st.cat = c.dataset.cat; save(); renderCats(); renderList(); });
  $("list").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const t = all().find((x) => x.id === (b.dataset.copy || b.dataset.edit || b.dataset.rm)); if (!t) return;
    if (b.dataset.copy) M.copyText(fillText(t.body));
    else if (b.dataset.edit) startEdit(t);
    else if (b.dataset.rm && confirm(t.overrides ? "לחזור לנוסח המקורי?" : "למחוק את התבנית?")) { st.custom = st.custom.filter((x) => x.id !== t.id); save(); renderList(); }
  });

  $("t-cat").innerHTML = Object.keys(CATS).map((k) => `<option value="${k}">${CATS[k]}</option>`).join("");
  function startEdit(t) {
    editing = t;
    $("t-title").value = t.title; $("t-cat").value = t.cat; $("t-body").value = t.body;
    $("tpl-form-title").textContent = "עריכת תבנית";
    $("t-cancel").classList.remove("hidden");
    $("tpl-form").scrollIntoView({ behavior: "smooth" });
    $("t-body").focus();
  }
  function resetForm() { editing = null; $("tpl-form").reset(); $("tpl-form-title").textContent = "תבנית משלי"; $("t-cancel").classList.add("hidden"); }
  $("t-cancel").addEventListener("click", resetForm);
  $("tpl-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const rec = { title: $("t-title").value.trim(), cat: $("t-cat").value, body: $("t-body").value, custom: true };
    if (!rec.title || !rec.body.trim()) return;
    if (editing && editing.custom) Object.assign(st.custom.find((x) => x.id === editing.id), rec);
    else if (editing) st.custom.unshift(Object.assign(rec, { id: M.uid(), overrides: editing.id }));
    else st.custom.unshift(Object.assign(rec, { id: M.uid() }));
    save(); resetForm(); renderList(); M.toast("התבנית נשמרה ✓");
  });

  M.mountBackup("backup", [M.KEYS.messages], "messages");
  renderCats();
  renderList();
})();
