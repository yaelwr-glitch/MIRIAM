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
