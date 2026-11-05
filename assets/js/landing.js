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

/* ---------- v5: PowerPoint-style entrances + popping dessert stickers ---------- */
(function () {
  "use strict";
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const set = (els, anim, step, start) => els.forEach((el, i) => { el.setAttribute("data-anim", typeof anim === "function" ? anim(i) : anim); el.dataset.delay = (start || 0) + i * (step || 0); });
  const rtl = document.documentElement.dir === "rtl";
  const START = rtl ? "right" : "left", END = rtl ? "left" : "right";

  // headlines appear word by word
  $$("main .section-head h2, #taste h2, #talk h2, .quiz-teaser h2, .about h2, .cta-box h2").forEach((h) => h.setAttribute("data-anim", "words"));
  $$("main .section-head .eyebrow").forEach((e) => e.setAttribute("data-anim", "down"));

  set($$("#who .grid > .card"), (i) => (i ? END : START), 150);
  set($$("#taste .taste > div:first-child .slider-field"), START, 120, 200);
  set($$("#taste .taste-result"), "flip", 0, 150);
  set($$("#journey .journey-item"), (i) => (window.innerWidth > 860 ? (i % 2 ? END : START) : "up"), 0);
  set($$("#journey .journey-cap"), "pop", 0);
  set($$("#showcase .phone-wrap"), "rotate", 0);
  set($$("#showcase .tool-tab"), END, 110, 150);
  set($$("#tools .grid-3 .tool-card"), (i) => ["up", "zoom", "up"][i % 3], 90);
  set($$(".quiz-teaser .blob"), "pop", 0, 250);
  set($$("#result .compare > .card"), (i) => (i ? END : START), 180, 200);
  set($$("#gallery .gallery figure"), "pop", 110);
  set($$("#about .about-photo"), "flip", 0);
  set($$("#about .about > div:last-child > p, #about blockquote"), END, 120, 150);
  set($$("#testimonials .t-card"), "drop", 160);
  set($$("#faq .faq details"), (i) => (i % 2 ? START : END), 80);
  set($$("#talk .talk-points li"), START, 120, 300);
  set($$("#talk .steps-card"), "flip-x", 0, 150);
  set($$("#register .cta-box .price"), "pop", 0, 300);
  set($$(".stats-strip .wrap > div"), "pop", 120);

  // scroll motion (like Elementor motion effects)
  $$("#gallery .gallery figure:nth-child(odd)").forEach((f) => f.setAttribute("data-scroll", "y:-0.06"));
  $$("#gallery .gallery figure:nth-child(even)").forEach((f) => f.setAttribute("data-scroll", "y:0.05"));
  $$("#about .about-photo").forEach((f) => f.setAttribute("data-scroll", "y:-0.08 r:-0.008"));

  // dessert stickers (flat SVG illustrations in MIREL colors)
  const D = "#301816", R = "#dc6e71", B = "#f6c3c4", C = "#fbf5f4", G = "#bb989b";
  const ART = {
    macaron: `<svg viewBox="0 0 100 80"><g class="wob"><ellipse cx="50" cy="56" rx="40" ry="15" fill="${R}"/><path d="M12 56c6 5 70 5 76 0" stroke="#b9484c" stroke-width="2" fill="none" stroke-dasharray="2 3"/><rect x="12" y="38" width="76" height="14" rx="7" fill="${C}"/><path d="M14 44c10 4 62 4 72 0" stroke="#f3dcd9" stroke-width="3" fill="none"/><ellipse cx="50" cy="34" rx="40" ry="17" fill="#e98d90"/><path d="M12 36c6 5 70 5 76 0" stroke="#b9484c" stroke-width="2" fill="none" stroke-dasharray="2 3"/><ellipse cx="38" cy="26" rx="14" ry="5" fill="#fff" opacity=".35"/></g></svg>`,
    cupcake: `<svg viewBox="0 0 100 120"><g class="wob"><path d="M22 62h56l-8 50H30z" fill="${D}"/><path d="M30 62l4 50M42 62l1 50M54 62l-1 50M66 62l-4 50" stroke="#5a3a35" stroke-width="3"/><path d="M16 64c0-12 10-16 18-16-2-12 10-20 18-18 4-10 20-10 24 2 10 0 16 10 10 20 6 2 8 8 6 12z" fill="${B}"/><path d="M24 58c10-6 18 2 28-4s18 4 26-2" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/><circle cx="56" cy="22" r="9" fill="#b9484c"/><path d="M57 13c2-6 8-8 12-8" stroke="${D}" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="53" cy="19" r="2.5" fill="#fff" opacity=".6"/></g></svg>`,
    whisk: `<svg viewBox="0 0 70 130"><g class="wob" fill="none" stroke-linecap="round"><rect x="28" y="84" width="14" height="42" rx="7" fill="${R}" stroke="none"/><path d="M35 84C14 64 12 22 35 6c23 16 21 58 0 78" stroke="${G}" stroke-width="3"/><path d="M35 84C24 62 24 24 35 8c11 16 11 54 0 76" stroke="${G}" stroke-width="3"/><path d="M35 84V8" stroke="${G}" stroke-width="3"/><circle cx="35" cy="120" r="2.5" fill="${D}" stroke="none"/></g></svg>`,
    choc: `<svg viewBox="0 0 110 80"><g class="wob"><path d="M8 18h80l14 14v40H8z" fill="#4a2c25"/><path d="M8 18h80l14 14v40H8z" fill="none" stroke="#2d1c18" stroke-width="2"/><g fill="#5f3a31"><rect x="14" y="24" width="20" height="18" rx="3"/><rect x="40" y="24" width="20" height="18" rx="3"/><rect x="66" y="24" width="20" height="18" rx="3"/><rect x="14" y="48" width="20" height="18" rx="3"/><rect x="40" y="48" width="20" height="18" rx="3"/><rect x="66" y="48" width="20" height="18" rx="3"/></g><path d="M0 40l14-6 6 40H4z" fill="${R}"/><path d="M4 74l10-38" stroke="#fff" stroke-width="1.5" opacity=".4"/></g></svg>`,
    slice: `<svg viewBox="0 0 120 100"><g class="wob"><path d="M10 40l100-22v62L10 92z" fill="#f3e0c8"/><path d="M10 58l100-16v12L10 72z" fill="${R}"/><path d="M10 76l100-12v6L10 84z" fill="#5f3a31"/><path d="M10 40l100-22-6-8L6 32z" fill="${B}"/><path d="M6 32c8 6 14-2 22 3s14-2 22 2 14-3 22 0 14-4 22-1" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><circle cx="70" cy="14" r="8" fill="#b9484c"/><path d="M70 6c2-4 6-5 9-4" stroke="${D}" stroke-width="2" fill="none" stroke-linecap="round"/></g></svg>`,
    heart: `<svg viewBox="0 0 100 90"><g class="wob"><path d="M50 84C20 64 6 46 8 28 10 12 26 4 40 10c5 2 8 6 10 10 2-4 5-8 10-10 14-6 30 2 32 18 2 18-12 36-42 56z" fill="#c98b5a"/><path d="M50 74C26 58 16 44 18 30c2-10 12-15 21-11 5 2 8 7 11 12 3-5 6-10 11-12 9-4 19 1 21 11 2 14-8 28-32 44z" fill="${B}"/><circle cx="36" cy="34" r="3" fill="#fff"/><circle cx="60" cy="44" r="3" fill="#fff"/><circle cx="48" cy="56" r="3" fill="#fff"/></g></svg>`,
  };
  const STICKERS = [
    ["#who", "cupcake", "top:40px; inset-inline-start:4%; --s:92px", "drop", 300],
    ["#taste", "macaron", "bottom:30px; inset-inline-start:46%; --s:96px", "pop", 400, "hide-sm"],
    ["#learn", "whisk", "top:120px; inset-inline-end:6%; --s:70px", "rotate", 200],
    ["#tools", "macaron", "top:60px; inset-inline-start:5%; --s:84px", "pop", 300],
    ["#result", "choc", "top:30px; inset-inline-end:7%; --s:104px", START, 200],
    ["#gallery", "slice", "top:36px; inset-inline-start:6%; --s:110px", "pop", 250],
    ["#faq", "heart", "top:50px; inset-inline-end:7%; --s:80px", "drop", 300],
    ["#talk", "cupcake", "bottom:20px; inset-inline-start:3%; --s:78px", "pop", 500, "hide-sm"],
  ];
  STICKERS.forEach(([sel, art, style, anim, delay, cls]) => {
    const host = document.querySelector(sel); if (!host) return;
    const s = document.createElement("div");
    s.className = "sticker" + (cls ? " " + cls : "");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("style", style);
    s.setAttribute("data-anim", anim); s.dataset.delay = delay;
    s.setAttribute("data-scroll", "y:-0.12 r:0.02");
    s.innerHTML = ART[art];
    host.appendChild(s);
  });
})();

/* ---------- v6: spin / swivel entrances (PowerPoint "Spinner" / "Swivel") ---------- */
(function () {
  "use strict";
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const set = (els, anim, step, start) => els.forEach((el, i) => { el.setAttribute("data-anim", anim); el.dataset.delay = (start || 0) + i * (step || 0); });
  set($$(".stats-strip .wrap > div"), "swivel", 150);
  set($$("#journey .journey-item .dot"), "spin", 0, 150);
  set($$("#testimonials .t-card .q"), "spin", 160, 500);
  set($$(".quiz-teaser .blob"), "spin", 0, 200);
  set($$("#register .cta-box .price"), "swivel", 0, 300);
  set($$("#showcase .tool-tab .card-icon"), "spin", 110, 300);
  set($$("#tools .grid-4 .card-icon, .about-photo .float-sphere"), "spin", 100, 200);
  $$(".sticker").forEach((s, i) => { if (i % 2 === 0) s.setAttribute("data-anim", "spin"); });
  $$(".journey-cap .dot, .card-icon").forEach((d) => d.classList.add("spin-hover"));
})();
