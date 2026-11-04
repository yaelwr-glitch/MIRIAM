/* מהמטבח לעסק משלי — קוד משותף לכל העמודים */
(function () {
  "use strict";
  const ASSETS_BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "";

  /* =========================================================
     i18n — Hebrew is the source language. English / French come from
     assets/i18n/<lang>.js (loaded by the small snippet in each page's <head>),
     keyed by the Hebrew text. Static page text is translated by walking the
     DOM; text that the tools render later is caught by a MutationObserver.
     Keys may contain {0}, {1}… placeholders for numbers/names.
     ========================================================= */
  const LANG = ["en", "fr"].includes(window.MIREL_LANG) ? window.MIREL_LANG : "he";
  const LOCALE = { he: "he-IL", en: "en-GB", fr: "fr-FR" }[LANG];
  const HEB = /[֐-׿]/;
  const normWS = (x) => String(x).replace(/\s+/g, " ").trim();
  const EXACT = new Map();
  const PATTERNS = [];
  if (LANG !== "he" && window.MIREL_I18N) {
    Object.keys(window.MIREL_I18N).forEach((k) => {
      const v = window.MIREL_I18N[k];
      if (/\{\d\}/.test(k)) {
        const re = new RegExp("^" + k.split(/\{\d\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("([\\s\\S]*?)") + "$");
        const order = (k.match(/\{\d\}/g) || []).map((m) => +m[1]);
        PATTERNS.push({ re, v, order, len: k.replace(/\{\d\}/g, "").length });
      } else EXACT.set(k, v);
    });
    PATTERNS.sort((a, b) => b.len - a.len);
  }
  function trCore(n, depth) {
    if (EXACT.has(n)) return EXACT.get(n);
    if (depth > 3) return null;
    for (const p of PATTERNS) {
      const m = n.match(p.re);
      if (!m) continue;
      const caps = {};
      p.order.forEach((idx, i) => { caps[idx] = m[i + 1]; });
      return p.v.replace(/\{(\d)\}/g, (_, i) => {
        const c = caps[+i] == null ? "" : caps[+i];
        if (!HEB.test(c)) return c;
        const lead = c.match(/^\s*/)[0], trail = c.match(/\s*$/)[0];
        const t = trCore(normWS(c), depth + 1);
        return lead + (t == null ? c.trim() : t) + trail;
      });
    }
    return null;
  }
  /* translate a finished string (returns it unchanged when unknown) */
  function tr(text) {
    if (LANG === "he" || text == null || !HEB.test(text)) return text;
    const n = normWS(text);
    const t = trCore(n, 0);
    return t == null ? text : t;
  }
  /* translate a multi-line text (WhatsApp / clipboard): whole text first, then line by line */
  function trBlock(text) {
    if (LANG === "he" || !HEB.test(text)) return text;
    const whole = trCore(normWS(text), 0);
    if (whole != null) return whole;
    return String(text).split("\n").map((l) => (HEB.test(l) ? tr(l) : l)).join("\n");
  }
  /* t("key {0}", a, b) — look up a key and fill placeholders */
  function t(key, ...args) {
    let v = LANG === "he" ? key : (EXACT.get(normWS(key)) || key);
    return String(v).replace(/\{(\d)\}/g, (m, i) => (args[+i] != null ? args[+i] : m));
  }
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function trTextNode(node) {
    const v = node.nodeValue;
    if (!v || !HEB.test(v)) return;
    const out = tr(v);
    if (out !== v) {
      const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
      node.nodeValue = lead + out + trail;
    }
  }
  function trElementAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && HEB.test(v)) { const out = tr(v); if (out !== v) el.setAttribute(a, out); }
    }
  }
  function translateTree(root) {
    if (LANG === "he" || !root) return;
    if (root.nodeType === 3) { if (!(root.parentNode && (SKIP_TAGS[root.parentNode.nodeName] || root.parentNode.nodeName === "TEXTAREA"))) trTextNode(root); return; }
    if (root.nodeType !== 1 || SKIP_TAGS[root.nodeName] || root.closest && root.closest("[data-no-i18n]")) return;
    trElementAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === 1 && (SKIP_TAGS[n.nodeName] || n.hasAttribute("data-no-i18n")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) { if (n.parentNode.nodeName !== "TEXTAREA") trTextNode(n); } else trElementAttrs(n); }
  }
  if (LANG !== "he") {
    document.title = tr(document.title);
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", tr(md.getAttribute("content")));
    translateTree(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") trTextNode(m.target);
        else m.addedNodes.forEach(translateTree);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    const nativeConfirm = window.confirm.bind(window);
    window.confirm = (msg) => nativeConfirm(tr(msg));
    document.documentElement.classList.remove("i18n-wait");
  }

  /* language switcher in the header: עב · EN · FR */
  function initLangSwitch() {
    const wrap = document.querySelector(".site-header .wrap");
    if (!wrap || wrap.querySelector(".lang-switch")) return;
    const box = document.createElement("div");
    box.className = "lang-switch no-print";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Language / שפה / Langue");
    box.setAttribute("data-no-i18n", "");
    [["he", "עב", "עברית"], ["en", "EN", "English"], ["fr", "FR", "Français"]].forEach(([code, label, full]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label; b.lang = code; b.title = full;
      b.setAttribute("aria-label", full);
      b.setAttribute("aria-pressed", String(code === LANG));
      b.addEventListener("click", () => {
        try { localStorage.setItem("mirel_lang", code); } catch (e) { /* ignore */ }
        const u = new URL(location.href);
        u.searchParams.set("lang", code);
        location.href = u.toString();
      });
      box.appendChild(b);
    });
    const toggle = wrap.querySelector(".nav-toggle");
    wrap.insertBefore(box, toggle || null);
  }

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
  const nf = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function money(n) {
    if (!isFinite(n)) n = 0;
    return "₪" + nf.format(Math.round(n * 100) / 100);
  }
  function num(n, digits) {
    if (!isFinite(n)) n = 0;
    return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits == null ? 1 : digits }).format(n);
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
    text = trBlock(text);
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
    return "https://wa.me/" + (p || "") + "?text=" + encodeURIComponent(trBlock(text));
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

    if (reduce || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".mark").forEach((m) => m.classList.add("lit"));
      return;
    }
    // highlighter marks draw themselves when they come into view
    const mio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("lit"); mio.unobserve(en.target); }
    }), { threshold: 0.6 });
    document.querySelectorAll(".mark").forEach((m) => mio.observe(m));
    // giant outline words drift with scroll: <div class="bg-word" data-parallax="0.2">
    const words = Array.from(document.querySelectorAll("[data-parallax]"));
    if (words.length) {
      let tick = false;
      const move = () => {
        tick = false;
        words.forEach((w) => {
          const r = w.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const k = parseFloat(w.dataset.parallax) || 0.2;
          w.style.transform = "translateX(" + ((r.top - innerHeight / 2) * k).toFixed(1) + "px)";
        });
      };
      addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(move); } }, { passive: true });
      move();
    }

    // scroll reveal — added by JS only, so content is always visible without it
    const groups = [".section-head", ".pain", ".t-card", ".steps-card", ".card", ".module", ".faq details", ".quote", ".compare > *", ".gallery figure", ".about > *", ".cta-box", ".quiz-teaser", ".tool-card", ".stats-strip .wrap > div", ".lesson", ".msg-card"];
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
        el.textContent = pre + v.toLocaleString(LOCALE) + suf;
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

  /* ---------- Confetti (brand colors) — Mirel.confetti({ big: true }) ---------- */
  function confetti(opts) {
    opts = opts || {};
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas");
    c.className = "confetti-canvas"; c.setAttribute("aria-hidden", "true");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const colors = ["#dc6e71", "#f6b9ba", "#9c3539", "#301816", "#bb989b", "#fde6e6", "#d4a35a"];
    const n = opts.big ? 160 : 70;
    const ox = opts.x != null ? opts.x : innerWidth / 2, oy = opts.y != null ? opts.y : innerHeight * 0.35;
    const parts = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2, sp = (opts.big ? 7 : 5) + Math.random() * 6;
      return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, r: 3 + Math.random() * 5, c: colors[(Math.random() * colors.length) | 0], rot: Math.random() * 6, vr: (Math.random() - .5) * .3, round: Math.random() < .45 };
    });
    const t0 = performance.now();
    (function frame(t) {
      const el = t - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.22; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - el / 2600); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.r * .7, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25);
        ctx.restore();
      });
      if (el < 2700) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  function initAll() { initLangSwitch(); initNav(); initMotion(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();

  window.Mirel = {
    lang: LANG, locale: LOCALE, dir: LANG === "he" ? "rtl" : "ltr", t, tr, trBlock, translateTree,
    KEYS, load, save, uid, money, num, esc, parseNum,
    UNITS, toBase, unitOptions, fmtAmount, ingredientCost, calcRecipe, roundNice,
    toast, fileToDataURL, download,
    confetti,
    getProfile, setProfile, copyText, waLink, mountBackup, exportKeys, importKeys, saveAsPNG,
    getRecipes: () => load(KEYS.recipes, []),
    setRecipes: (list) => save(KEYS.recipes, list),
  };
})();
