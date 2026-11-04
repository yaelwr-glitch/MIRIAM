/* דף הנחיתה — מחשבון חי, טלפון מתחלף, מסלול הקורס */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Live mini price calculator ---------- */
  const RATE = 60, OVERHEAD = 0.10, MARGIN = 0.30, PER_WEEK = 4;
  let shown = 0, raf = 0;
  function tween(el, to) {
    cancelAnimationFrame(raf);
    if (reduce) { el.textContent = M.money(to); shown = to; return; }
    const from = shown, t0 = performance.now(), dur = 450;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      el.textContent = M.money(Math.round(v)); shown = v;
      if (k < 1) raf = requestAnimationFrame(step);
    })(t0);
  }
  function fillRange(r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%"); }
  function calc() {
    const ing = +$("t-ing").value, hours = +$("t-hours").value, now = +$("t-now").value;
    ["t-ing", "t-hours", "t-now"].forEach((id) => fillRange($(id)));
    $("o-ing").textContent = M.money(ing);
    $("o-hours").textContent = M.num(hours, 1) + " ש׳";
    $("o-now").textContent = M.money(now);
    const cost = (ing + hours * RATE) * (1 + OVERHEAD);
    const right = M.roundNice(cost / (1 - MARGIN));
    tween($("t-price"), right);
    const max = Math.max(right, now) * 1.08;
    $("b-now").style.width = (now / max) * 100 + "%";
    $("b-right").style.width = (right / max) * 100 + "%";
    $("v-now").textContent = M.money(now);
    $("v-right").textContent = M.money(right);
    const perHour = (now - ing * (1 + OVERHEAD)) / hours;
    const gap = right - now;
    let html;
    if (now < ing * (1 + OVERHEAD)) html = `😮 במחיר הזה <strong>את מפסידה כסף</strong> על כל עוגה — עוד לפני שספרנו את הזמן שלך.`;
    else if (gap > right * 0.05) html = `על כל עוגה את משאירה על השולחן <strong>${M.money(gap)}</strong>. ב־${PER_WEEK} עוגות בשבוע זה <strong>${M.money(gap * PER_WEEK * 52)} בשנה</strong>.<br>כרגע את מרוויחה כ־${M.money(Math.max(0, perHour))} לשעה.`;
    else html = `👏 המחיר שלך בריא! את מרוויחה כ־<strong>${M.money(perHour)} לשעה</strong>. בתכנית נדאג שיהיו מספיק הזמנות.`;
    $("t-verdict").innerHTML = html;
  }
  if ($("t-ing")) {
    ["t-ing", "t-hours", "t-now"].forEach((id) => $(id).addEventListener("input", calc));
    calc();
  }

  /* ---------- 2. Phone showcase ---------- */
  const show = $("showcase");
  if (show) {
    const tabs = Array.from(show.querySelectorAll(".tool-tab"));
    const imgs = Array.from(show.querySelectorAll(".screen img"));
    const DUR = 4200;
    let cur = 0, timer = null, paused = false;
    show.style.setProperty("--dur", DUR + "ms");
    function select(i, user) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", String(k === cur));
        const tm = t.querySelector(".timer"); if (tm) { tm.style.animation = "none"; void tm.offsetWidth; tm.style.animation = ""; }
      });
      imgs.forEach((im, k) => im.classList.toggle("on", k === cur));
      if (user) { paused = true; show.classList.add("paused"); clearInterval(timer); timer = null; }
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", (e) => { if (!e.target.closest("a")) select(i, true); });
      t.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i, true); }
        if (e.key === "ArrowDown") { e.preventDefault(); select(i + 1, true); tabs[cur].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); select(i - 1, true); tabs[cur].focus(); }
      });
    });
    function start() { if (!timer && !paused && !reduce) timer = setInterval(() => select(cur + 1), DUR); }
    function stop() { clearInterval(timer); timer = null; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((en) => en.forEach((x) => (x.isIntersecting ? start() : stop())), { threshold: 0.3 }).observe(show);
    } else start();
    if (reduce) show.classList.add("paused");
  }

  /* ---------- 3. Journey path fills while scrolling ---------- */
  const j = $("journey");
  if (j) {
    const line = j.querySelector(".fill-line");
    const items = Array.from(j.querySelectorAll(".journey-item"));
    let ticking = false;
    function update() {
      ticking = false;
      const r = j.getBoundingClientRect();
      const mark = window.innerHeight * 0.62;
      const h = Math.max(0, Math.min(r.height, mark - r.top));
      line.style.height = h + "px";
      items.forEach((it) => { const d = it.querySelector(".dot").getBoundingClientRect(); it.classList.toggle("lit", d.top + d.height / 2 < mark); });
    }
    if (reduce) { line.style.height = "100%"; items.forEach((it) => it.classList.add("lit")); }
    else { window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true }); window.addEventListener("resize", update); update(); }
  }
})();

/* ---------- v4: per-language phone screens, talk form, floating button ---------- */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const CFG = window.MIREL_CONFIG || {};

  // phone showcase screens in the selected language
  if (M.lang !== "he") {
    document.querySelectorAll(".phone .screen img").forEach((im) => {
      im.src = im.getAttribute("src").replace(/\/(\w+)\.jpg$/, "/$1-" + M.lang + ".jpg");
    });
  }

  // multi-step "talk to Miriam" form
  const form = $("talk-form");
  if (form) {
    const steps = Array.from(form.querySelectorAll(".step"));
    const dots = Array.from(form.querySelectorAll(".step-dots span"));
    const lines = Array.from(form.querySelectorAll(".step-dots i"));
    const err = $("tk-err"), next = $("tk-next"), back = $("tk-back");
    let cur = 0;
    const val = (name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ""; };
    const label = (name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.nextElementSibling.textContent.trim() : ""; };
    function show(i) {
      cur = i;
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      dots.forEach((d, k) => d.classList.toggle("on", k <= i));
      lines.forEach((l, k) => l.classList.toggle("done", k < i));
      back.hidden = i === 0;
      next.textContent = M.t(i === steps.length - 1 ? "אני רוצה לדבר עם מרים" : "הבא");
      err.textContent = "";
      const f = steps[i].querySelector("input:not([type=radio]),textarea"); if (f && i > 0) f.focus({ preventScroll: true });
    }
    function check(i) {
      if (i === 0) {
        if (!$("tk-name").value.trim()) return M.t("נא למלא שם");
        if ($("tk-phone").value.replace(/\D/g, "").length < 9) return M.t("נא למלא מספר טלפון תקין");
      }
      if (i === 1 && !val("tk-stage")) return M.t("נא לבחור איפה את היום");
      if (i === 2 && !$("tk-consent").checked) return M.t("נא לאשר יצירת קשר");
      return "";
    }
    back.addEventListener("click", () => show(Math.max(0, cur - 1)));
    next.addEventListener("click", async () => {
      const problem = check(cur);
      if (problem) { err.textContent = problem; return; }
      if (cur < steps.length - 1) { show(cur + 1); return; }
      // submit
      const lead = {
        name: $("tk-name").value.trim(), phone: $("tk-phone").value.trim(),
        stage: val("tk-stage"), time: val("tk-time"), note: $("tk-note").value.trim(),
        lang: M.lang, source: "landing-talk", at: new Date().toISOString(),
      };
      const endpoint = (CFG.leadEndpoint || "").trim();
      const wa = (CFG.whatsappNumber || "").trim();
      const waText = M.t("היי מרים, אני {0}. אשמח לשיחת התאמה על התכנית. {1}{2}", lead.name, label("tk-stage"), lead.time ? " · " + label("tk-time") : "");
      let sent = false;
      if (endpoint) {
        next.disabled = true; next.textContent = M.t("שולחת...");
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead) });
          sent = r.ok || r.type === "opaque";
        } catch (e) { sent = false; }
        next.disabled = false;
      }
      if (!sent && !wa) {
        err.textContent = endpoint ? M.t("לא הצלחנו לשלוח כרגע. נסי שוב בעוד רגע.") : M.t("הטופס עדיין לא מחובר (טיוטה) — הפרטים לא נשלחו.");
        next.textContent = M.t("אני רוצה לדבר עם מרים");
        return;
      }
      steps.forEach((s) => s.classList.remove("on"));
      $("tk-nav").hidden = true; form.querySelector(".step-dots").hidden = true; err.textContent = "";
      const done = form.querySelector(".talk-done"); done.hidden = false;
      $("tk-done-title").textContent = M.t("תודה {0}! 💗", lead.name);
      $("tk-done-text").textContent = sent ? M.t("מרים תחזור אלייך בהקדם.") : M.t("לחצי על הכפתור כדי לשלוח למרים הודעה בוואטסאפ.");
      if (wa) { const b = $("tk-wa"); b.href = M.waLink(waText, wa); b.classList.remove("hidden"); if (!sent) b.textContent = M.t("שליחה בוואטסאפ"); }
      M.confetti({ big: true });
    });
    show(0);
  }

  // floating "talk to Miriam" button
  const target = $("talk");
  if (target) {
    const wa = ((window.MIREL_CONFIG || {}).whatsappNumber || "").trim();
    const a = document.createElement("a");
    a.className = "float-talk no-print";
    a.href = wa ? M.waLink(M.t("היי מרים, יש לי שאלה על התכנית"), wa) : "#talk";
    if (wa) { a.target = "_blank"; a.rel = "noopener"; }
    a.innerHTML = `<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span><span class="lbl">${M.esc(M.t("שאלה? דברי עם מרים"))}</span>`;
    a.setAttribute("aria-label", M.t("שאלה? דברי עם מרים"));
    document.body.appendChild(a);
    const reg = $("register");
    const near = { talk: false, reg: false };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((en) => { near.talk = en[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(target);
      if (reg) new IntersectionObserver((en) => { near.reg = en[0].isIntersecting; upd(); }, { threshold: 0.3 }).observe(reg);
    }
    function upd() { a.classList.toggle("show", scrollY > 600 && !near.talk && !near.reg); }
    addEventListener("scroll", upd, { passive: true });
    upd();
  }
})();
