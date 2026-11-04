/* מהמטבח לעסק משלי — קוד משותף לכל העמודים */
(function () {
  "use strict";
  const ASSETS_BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "";

  const KEYS = {
    recipes: "mirel_recipes_v1",
    orders: "mirel_orders_v1",
    menu: "mirel_menu_v1",
    pricingDraft: "mirel_pricing_draft_v1",
    profile: "mirel_profile_v1",
    scale: "mirel_scale_v1",
    dessertBar: "mirel_dessertbar_v1",
    quotes: "mirel_quotes_v1",
    income: "mirel_income_v1",
    messages: "mirel_messages_v1",
    captions: "mirel_captions_v1",
    checklist: "mirel_checklist_v1",
    quiz: "mirel_quiz_v1",
    student: "mirel_student_v1",
    certificate: "mirel_certificate_v1",
    launch: "mirel_launch_v1",
    assistant: "mirel_assistant_v1",
  };

  /* ---------- Storage (safe) ---------- */
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      toast("לא הצלחנו לשמור — ייתכן שהזיכרון בדפדפן מלא (נסי תמונות קטנות יותר)");
      return false;
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Formatting ---------- */
  const nf = new Intl.NumberFormat("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function money(n) {
    if (!isFinite(n)) n = 0;
    return "₪" + nf.format(Math.round(n * 100) / 100);
  }
  function num(n, digits) {
    if (!isFinite(n)) n = 0;
    return new Intl.NumberFormat("he-IL", { maximumFractionDigits: digits == null ? 1 : digits }).format(n);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function parseNum(v) {
    const n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  /* ---------- Units ---------- */
  const UNITS = {
    g: { label: "גרם", base: "g", factor: 1 },
    kg: { label: "ק״ג", base: "g", factor: 1000 },
    ml: { label: "מ״ל", base: "ml", factor: 1 },
    l: { label: "ליטר", base: "ml", factor: 1000 },
    unit: { label: "יח׳", base: "unit", factor: 1 },
  };
  function toBase(qty, unit) {
    const u = UNITS[unit] || UNITS.g;
    return { qty: qty * u.factor, base: u.base };
  }
  function unitOptions(selected) {
    return Object.keys(UNITS)
      .map((k) => `<option value="${k}"${k === selected ? " selected" : ""}>${UNITS[k].label}</option>`)
      .join("");
  }
  function fmtAmount(qty, base) {
    if (base === "g") return qty >= 1000 ? num(qty / 1000, 2) + " ק״ג" : num(qty, 0) + " גרם";
    if (base === "ml") return qty >= 1000 ? num(qty / 1000, 2) + " ליטר" : num(qty, 0) + " מ״ל";
    return num(qty, 1) + " יח׳";
  }

  /* Cost of one ingredient line. Mass/volume mismatch → assume 1 g ≈ 1 ml (with warning). */
  function ingredientCost(ing) {
    const pkg = toBase(parseNum(ing.pkgSize), ing.pkgUnit);
    const use = toBase(parseNum(ing.qty), ing.unit);
    const price = parseNum(ing.pkgPrice);
    let warn = "";
    if (!pkg.qty || !price) return { cost: 0, warn: "" };
    if (pkg.base !== use.base) {
      const massVol = ["g", "ml"];
      if (massVol.includes(pkg.base) && massVol.includes(use.base)) {
        warn = "יחידות שונות — חישבנו לפי 1 גרם ≈ 1 מ״ל";
      } else {
        return { cost: 0, warn: "לא ניתן להמיר בין יחידות ליחידות משקל/נפח" };
      }
    }
    return { cost: (price / pkg.qty) * use.qty, warn };
  }

  /* Full recipe calculation — shared by all tools */
  function calcRecipe(r) {
    const ingredients = (r.ingredients || []).map((i) => ingredientCost(i));
    const ingCost = ingredients.reduce((s, x) => s + x.cost, 0);
    const extrasCost = (r.extras || []).reduce((s, x) => s + parseNum(x.cost), 0);
    const labor = parseNum(r.hours) * parseNum(r.rate);
    const direct = ingCost + extrasCost + labor;
    const overhead = direct * (parseNum(r.overhead) / 100);
    const totalCost = direct + overhead;
    let margin = parseNum(r.margin);
    if (margin > 90) margin = 90;
    if (margin < 0) margin = 0;
    let price = totalCost / (1 - margin / 100);
    if (r.vat) price = price * (1 + parseNum(r.vatRate || 18) / 100);
    const rounded = price > 0 ? roundNice(price) : 0;
    const servings = Math.max(1, parseNum(r.servings) || 1);
    return {
      lines: ingredients,
      ingCost, extrasCost, labor, overhead, totalCost,
      price, rounded,
      profit: (r.vat ? rounded / (1 + parseNum(r.vatRate || 18) / 100) : rounded) - totalCost,
      perServing: rounded / servings,
      costPerServing: totalCost / servings,
      servings,
    };
  }
  /* Round up to a "nice" retail price */
  function roundNice(p) {
    if (p < 20) return Math.ceil(p);
    if (p < 100) return Math.ceil(p / 5) * 5;
    if (p < 500) return Math.ceil(p / 10) * 10;
    return Math.ceil(p / 50) * 50;
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ---------- Image helper: resize to data URL ---------- */
  function fileToDataURL(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("not-image"));
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("bad-image"));
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", quality || 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- File download ---------- */
  function download(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- Business profile (shared by menu, quote, messages, certificate) ---------- */
  function getProfile() {
    return Object.assign({ business: "", owner: "", phone: "", instagram: "", city: "", logo: "" }, load(KEYS.profile, {}));
  }
  function setProfile(p) { return save(KEYS.profile, p); }

  /* ---------- Clipboard & sharing ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) { /* ignore */ }
      ta.remove();
    }
    toast("הועתק ✓");
  }
  function waLink(text, phone) {
    let p = String(phone || "").replace(/[^\d]/g, "");
    if (p.startsWith("0")) p = "972" + p.slice(1);
    return "https://wa.me/" + (p || "") + "?text=" + encodeURIComponent(text);
  }

  /* ---------- Backup / restore widget ----------
     Mirel.mountBackup(element, [keys], "tag") renders "export" + "import" buttons
     that save/restore the given localStorage keys as one JSON file. */
  function exportKeys(keys, tag) {
    const data = {};
    keys.forEach((k) => { const v = localStorage.getItem(k); if (v != null) data[k] = JSON.parse(v); });
    if (!Object.keys(data).length) { toast("אין עדיין מידע לגבות"); return; }
    download("mirel-" + tag + "-" + new Date().toISOString().slice(0, 10) + ".json",
      JSON.stringify({ type: "mirel-backup", version: 1, created: new Date().toISOString(), data }, null, 2));
  }
  function importKeys(file, keys, done) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj || obj.type !== "mirel-backup" || typeof obj.data !== "object") throw new Error("bad");
        const found = Object.keys(obj.data).filter((k) => keys.includes(k));
        if (!found.length) { toast("בקובץ אין מידע של הכלי הזה"); return; }
        if (!confirm("הייבוא יחליף את המידע הנוכחי בכלי במידע מהקובץ. להמשיך?")) return;
        found.forEach((k) => localStorage.setItem(k, JSON.stringify(obj.data[k])));
        toast("הגיבוי שוחזר ✓");
        setTimeout(() => (done ? done() : location.reload()), 600);
      } catch (e) {
        toast("הקובץ לא תקין — צריך קובץ גיבוי שנוצר באתר הזה");
      }
    };
    reader.readAsText(file);
  }
  function mountBackup(el, keys, tag) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    el.classList.add("backup-bar", "no-print");
    el.innerHTML = `<span class="small muted">💾 המידע נשמר במכשיר הזה.</span>
      <button type="button" class="btn btn-sm btn-ghost" data-bk="export">גיבוי לקובץ</button>
      <label class="btn btn-sm btn-ghost" style="margin:0">שחזור מקובץ<input type="file" accept="application/json,.json" class="hidden" data-bk="import"></label>`;
    el.querySelector('[data-bk="export"]').addEventListener("click", () => exportKeys(keys, tag));
    el.querySelector('[data-bk="import"]').addEventListener("change", (e) => {
      if (e.target.files[0]) importKeys(e.target.files[0], keys);
      e.target.value = "";
    });
  }

  /* ---------- Load html2canvas on demand & save element as PNG ---------- */
  // html2canvas is self-hosted (assets/vendor); the pinned cdnjs copy is only a fallback.
  const H2C_SOURCES = [ASSETS_BASE + "vendor/html2canvas-1.4.1.min.js", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"];
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => { s.remove(); rej(new Error("load")); };
      document.head.appendChild(s);
    });
  }
  async function loadH2C() {
    if (window.html2canvas) return;
    for (const src of H2C_SOURCES) {
      try { await loadScript(src); if (window.html2canvas) return; } catch (e) { /* try next */ }
    }
    throw new Error("html2canvas unavailable");
  }
  async function saveAsPNG(el, filename) {
    try {
      toast("מכינה תמונה...");
      await loadH2C();
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
      canvas.toBlob((blob) => { download(filename, blob); toast("התמונה ירדה ✓"); }, "image/png");
    } catch (e) {
      toast("לא הצלחנו ליצור תמונה. נסי 'הדפסה / PDF'");
    }
  }

  /* ---------- Nav toggle ---------- */
  function initNav() {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "✕" : "☰";
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a") && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "☰";
      }
    });
  }
  const yearEl = document.querySelectorAll("[data-year]");
  yearEl.forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Motion: scroll reveal, header, progress bar, counters, back-to-top ---------- */
  function initMotion() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const header = document.querySelector(".site-header");

    // scroll progress + back-to-top
    const bar = document.createElement("div");
    bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const top = document.createElement("button");
    top.className = "to-top no-print"; top.type = "button"; top.setAttribute("aria-label", "חזרה למעלה"); top.textContent = "↑";
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
    document.body.appendChild(top);
    let ticking = false;
    function onScroll() {
      ticking = false;
      const y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle("scrolled", y > 10);
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
      top.classList.toggle("show", y > 700);
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    if (reduce || !("IntersectionObserver" in window)) return;

    // scroll reveal — added by JS only, so content is always visible without it
    const groups = [".section-head", ".card", ".module", ".faq details", ".quote", ".compare > *", ".gallery figure", ".about > *", ".cta-box", ".quiz-teaser", ".tool-card", ".stats-strip .wrap > div", ".lesson", ".msg-card"];
    const els = [];
    groups.forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
      if (el.closest(".hero") || el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      if (el.matches(".gallery figure, .cta-box")) el.classList.add("reveal-zoom");
      // stagger siblings
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal")) : [];
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 0.08 + "s");
      els.push(el);
    }));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));

    // count-up numbers: <span data-count="15">15</span>
    const cio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      const el = en.target, to = parseFloat(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1400;
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        el.textContent = pre + v.toLocaleString("he-IL") + suf;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

    // gentle parallax on hero photos
    const hp = document.querySelector(".hero-photos");
    if (hp && window.innerWidth > 900) {
      window.addEventListener("scroll", () => { hp.style.translate = "0 " + Math.min(60, window.scrollY * 0.08) + "px"; }, { passive: true });
    }
  }

  function initAll() { initNav(); initMotion(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();

  window.Mirel = {
    KEYS, load, save, uid, money, num, esc, parseNum,
    UNITS, toBase, unitOptions, fmtAmount, ingredientCost, calcRecipe, roundNice,
    toast, fileToDataURL, download,
    getProfile, setProfile, copyText, waLink, mountBackup, exportKeys, importKeys, saveAsPNG,
    getRecipes: () => load(KEYS.recipes, []),
    setRecipes: (list) => save(KEYS.recipes, list),
  };
})();
