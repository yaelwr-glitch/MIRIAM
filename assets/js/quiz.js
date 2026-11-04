/* שאלון "האם אני מוכנה לפתוח עסק קינוחים?" — מגנט לידים */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const CFG = window.MIREL_CONFIG || {};

  const AREAS = { skill: "מיומנות ומוצר", price: "תמחור וכסף", market: "לקוחות ושיווק", ops: "זמן וסדר", mind: "ביטחון ונחישות" };
  const Q = [
    { a: "skill", q: "כמה פעמים אמרו לך \"את חייבת למכור את זה\"?", o: ["אף פעם", "פעם־פעמיים", "די הרבה", "כל הזמן! 😄"] },
    { a: "skill", q: "כמה מוצרים את יודעת להכין ברמה שתמיד מצליחה?", o: ["עוד לא בטוחה", "1–2", "3–5", "יותר מ־5"] },
    { a: "price", q: "את יודעת כמה עולה לך עוגה, כולל הזמן שלך?", o: ["אין לי מושג", "רק את חומרי הגלם, בערך", "חישבתי פעם", "כן, יש לי חישוב מסודר"] },
    { a: "price", q: "כשמישהי שואלת \"כמה זה עולה?\" — מה קורה?", o: ["אני נבוכה ואומרת מחיר נמוך", "מנחשת", "יש לי מחיר, אבל לא בטוחה בו", "עונה בביטחון"] },
    { a: "market", q: "כבר מכרת עוגות או קינוחים בתשלום?", o: ["עוד לא", "פעם או פעמיים", "כמה פעמים", "יש לי לקוחות חוזרות"] },
    { a: "market", q: "יש לך עמוד אינסטגרם או וואטסאפ ביזנס לעסק?", o: ["לא", "יש, אבל לא פעיל", "יש ואני מעלה לפעמים", "כן, ואני מעלה באופן קבוע"] },
    { a: "ops", q: "כמה זמן בשבוע תוכלי להקדיש לעסק?", o: ["פחות משעתיים", "2–5 שעות", "5–10 שעות", "יותר מ־10 שעות"] },
    { a: "ops", q: "איך את מנהלת הזמנות היום?", o: ["אין לי הזמנות עדיין", "בראש / בשיחות בוואטסאפ", "על פתקים או ביומן", "במערכת מסודרת"] },
    { a: "mind", q: "מה הכי עוצר אותך?", o: ["לא בטוחה שזה בשבילי", "פחד שלא יזמינו", "לא יודעת מאיפה להתחיל", "כלום — אני רוצה להתחיל!"] },
    { a: "mind", q: "אם היית יודעת בדיוק מה לעשות — מתי היית מתחילה?", o: ["אולי בעתיד", "בעוד כמה חודשים", "בחודש הקרוב", "מחר בבוקר"] },
  ];
  const TIPS = {
    skill: "התמקדי ב־3 מוצרי דגל שאת עושה מצוין. עדיף תפריט קטן ומושלם מאשר גדול ולא אחיד — ככה גם קונים פחות חומרי גלם.",
    price: "התחילי מחישוב אמיתי של מוצר אחד, כולל שעות העבודה שלך. רוב האופות הביתיות מגלות שהן מוכרות מתחת לעלות. נסי את מחשבון המחירים החינמי שלנו.",
    market: "ההזמנות הראשונות מגיעות כמעט תמיד מהמעגל הקרוב. הכיני רשימה של 30 אנשים ושלחי להם הודעה אישית עם תפריט — זה עובד יותר מכל פרסום.",
    ops: "כבר מההתחלה רשמי כל הזמנה במקום אחד וגבי מקדמה. זה חוסך שכחות, לילות לבנים וביטולים של הרגע האחרון.",
    mind: "הפחד הוא סימן שזה חשוב לך. במקום לחכות ל\"מוכנה לגמרי\" — קבעי צעד קטן אחד לשבוע הקרוב. ביטחון בא מעשייה.",
  };
  const TIERS = [
    { min: 0, title: "בתחילת הדרך 🌱", text: "יש לך אהבה לאפייה — וזו נקודת פתיחה מצוינת. כדי להפוך אותה לעסק חסרים עוד כמה יסודות, והחדשות הטובות: את כולם אפשר ללמוד, צעד אחרי צעד." },
    { min: 12, title: "כמעט שם ✨", text: "יש לך בסיס מצוין: מוצר טוב ורצון אמיתי. מה שחסר עכשיו הוא בעיקר סדר — מחיר נכון, דרך קבועה להביא לקוחות, וניהול הזמנות. בדיוק השלב שבו ליווי עושה את ההבדל." },
    { min: 21, title: "מוכנה — הגיע הזמן! 🚀", text: "את כבר שם: מוכרת, יודעת להכין, ויש לך מוטיבציה. עכשיו הזמן להפוך את זה לעסק מסודר ורווחי — עם מחירים שמשאירים רווח, תפריט שמוכר ולקוחות קבועות." },
  ];

  let st = Object.assign({ answers: [], step: 0, lead: null, leads: [] }, M.load(M.KEYS.quiz, {}));
  const save = () => M.save(M.KEYS.quiz, st);
  const box = $("quiz-box");

  function score() { return st.answers.reduce((s, v) => s + (v || 0), 0); }
  function areaScores() {
    const r = {};
    Q.forEach((q, i) => { r[q.a] = (r[q.a] || 0) + (st.answers[i] || 0); });
    return r;
  }
  function tier() { const s = score(); return TIERS.filter((t) => s >= t.min).pop(); }

  function renderQuestion() {
    const i = st.step, q = Q[i];
    const pct = Math.round((i / Q.length) * 100);
    box.innerHTML = `
      <div class="progress-label"><span class="q-num">שאלה ${i + 1} מתוך ${Q.length}</span><span>${AREAS[q.a]}</span></div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <h2 style="margin-top:18px">${M.esc(q.q)}</h2>
      <div class="q-opts">${q.o.map((o, k) => `<button type="button" class="q-opt" data-v="${k}" aria-pressed="${st.answers[i] === k}">${M.esc(o)}</button>`).join("")}</div>
      ${i > 0 ? `<button type="button" class="btn btn-ghost btn-sm" id="back" style="margin-top:14px">→ חזרה</button>` : ""}`;
    box.querySelectorAll(".q-opt").forEach((b) => b.addEventListener("click", () => {
      st.answers[i] = +b.dataset.v; st.step = i + 1; save();
      st.step >= Q.length ? renderResult() : renderQuestion();
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    const back = $("back");
    if (back) back.addEventListener("click", () => { st.step--; save(); renderQuestion(); });
  }

  function renderResult() {
    const t = tier(), s = score(), max = Q.length * 3;
    const unlocked = !!st.lead;
    box.innerHTML = `
      <div class="center">
        <div class="result-score">${s}<span style="font-size:1.4rem">/${max}</span></div>
        <h2>${t.title}</h2>
        <p>${t.text}</p>
      </div>
      <div id="details"></div>
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button type="button" class="btn btn-ghost btn-sm" id="restart">לענות שוב</button>
      </div>`;
    $("restart").addEventListener("click", () => { st.answers = []; st.step = 0; save(); renderQuestion(); });
    unlocked ? renderDetails() : renderLeadForm();
  }

  function renderLeadForm() {
    $("details").innerHTML = `
      <form class="info-box" id="lead-form" style="margin-top:16px" novalidate>
        <h3 style="margin-bottom:6px">רוצה לקבל את הניתוח האישי המלא?</h3>
        <p class="small">נשלח לך את החוזקות שלך, את מה שכדאי לחזק — ו־3 צעדים לשבוע הקרוב.</p>
        <div class="field"><label for="l-name">שם פרטי</label><input id="l-name" type="text" autocomplete="given-name" required></div>
        <div class="field"><label for="l-email">אימייל</label><input id="l-email" type="email" autocomplete="email" inputmode="email" dir="ltr" required></div>
        <div class="field"><label for="l-phone">טלפון (לא חובה)</label><input id="l-phone" type="tel" autocomplete="tel" inputmode="tel"></div>
        <label class="check small" style="margin-bottom:12px"><input type="checkbox" id="l-consent" required> אני מאשרת לקבל ממירל מיילים עם טיפים, תכנים ועדכונים על הקורס. אפשר להסיר בכל עת.</label>
        <div id="l-err" class="warn-box hidden" style="margin-bottom:10px"></div>
        <button class="btn" type="submit" id="l-submit">לקבלת התוצאה המלאה</button>
      </form>`;
    $("lead-form").addEventListener("submit", submitLead);
  }

  async function submitLead(e) {
    e.preventDefault();
    const name = $("l-name").value.trim(), email = $("l-email").value.trim(), phone = $("l-phone").value.trim();
    const err = $("l-err");
    const problems = [];
    if (!name) problems.push("נא למלא שם");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("נא למלא אימייל תקין");
    if (!$("l-consent").checked) problems.push("נא לאשר קבלת מיילים");
    if (problems.length) { err.textContent = problems.join(" · "); err.classList.remove("hidden"); return; }
    err.classList.add("hidden");

    const lead = { name, email, phone, score: score(), tier: tier().title, areas: areaScores(), source: "quiz", at: new Date().toISOString() };
    const btn = $("l-submit"); btn.disabled = true; btn.textContent = "שולחת...";
    const endpoint = (CFG.newsletterEndpoint || "").trim();
    // TODO: newsletterEndpoint ב-tools/config.js — לחבר לרשימת התפוצה של מרים (Mailchimp / ActiveTrail / Make / Zapier / Google Apps Script)
    if (endpoint) {
      try {
        await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead), mode: "cors" /* text/plain avoids a CORS preflight, so Google Apps Script / Make / Zapier hooks accept it */ });
      } catch (x) { /* even if sending fails, show the result */ }
    }
    st.lead = { name, email, at: lead.at };
    st.leads = (st.leads || []).concat([lead]).slice(-5);
    save();
    renderDetails();
    M.confetti({ big: true });
  }

  function renderDetails() {
    const a = areaScores();
    const sorted = Object.keys(a).sort((x, y) => a[x] - a[y]);
    const weak = sorted.slice(0, 2), strong = sorted.slice(-2).reverse();
    const wa = CFG.whatsappNumber ? M.waLink(`היי מרים, עשיתי את השאלון ויצא לי "${tier().title}". אשמח לשמוע על הקורס`, CFG.whatsappNumber) : "";
    $("details").innerHTML = `
      <div style="margin-top:18px">
        <h3>${st.lead && st.lead.name ? M.esc(st.lead.name) + ", " : ""}ככה זה נראה אצלך:</h3>
        <div class="rows">${Object.keys(AREAS).map((k) => {
          const pct = Math.round((a[k] / 6) * 100);
          return `<div><div class="progress-label"><span>${AREAS[k]}</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></div>`;
        }).join("")}</div>
        <h3 style="margin-top:18px">💪 החוזקות שלך</h3>
        <p>${strong.map((k) => AREAS[k]).join(" · ")} — על זה בונים.</p>
        <h3>🎯 מה כדאי לחזק עכשיו</h3>
        ${weak.map((k) => `<div class="msg-card" style="margin-bottom:10px"><strong>${AREAS[k]}</strong><p style="margin:4px 0 0">${TIPS[k]}</p></div>`).join("")}
        <div class="cta-box" style="margin-top:18px">
          <h2 style="font-size:1.5rem">מוכנה לצעד הבא?</h2>
          <p>בתכנית "מהמטבח לעסק משלי" נבנה יחד את כל מה שחסר — עם 4 כלים חכמים וליווי עד ההזמנות הראשונות.</p>
          <div class="btn-row" style="justify-content:center">
            <a class="btn" href="../#learn">לפרטים על התכנית</a>
            ${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">לשיחה עם מרים</a>` : ""}
          </div>
        </div>
      </div>`;
  }

  st.step >= Q.length ? renderResult() : renderQuestion();
})();
