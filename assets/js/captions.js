/* מחולל כיתובים לאינסטגרם — מבוסס תבניות */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  const DESSERTS = {
    cake: { n: "עוגה מעוצבת", w: "העוגה", tags: ["עוגהמעוצבת", "עוגותמעוצבות", "עוגתיוםהולדת", "cakedesign"] },
    choc: { n: "מארז שוקולד / פרלינים", w: "מארז הפרלינים", tags: ["פרלינים", "שוקולדבעבודתיד", "מארזשוקולד", "chocolatier"] },
    macaron: { n: "מקרונים", w: "המקרונים", tags: ["מקרונים", "מקרון", "macarons"] },
    tart: { n: "טארט", w: "הטארט", tags: ["טארט", "טארטים", "קונדיטוריה"] },
    cookies: { n: "עוגיות", w: "העוגיות", tags: ["עוגיות", "עוגיותמעוצבות", "cookies"] },
    bar: { n: "בר קינוחים", w: "שולחן הקינוחים", tags: ["ברקינוחים", "שולחןקינוחים", "קינוחיםלאירועים", "dessertbar"] },
    mini: { n: "קינוחים אישיים", w: "הקינוחים האישיים", tags: ["קינוחיםאישיים", "כוסותקינוח", "מיניקינוחים"] },
    cupcake: { n: "קאפקייקס", w: "הקאפקייקס", tags: ["קאפקייקס", "cupcakes"] },
  };
  const OCCASIONS = {
    birthday: { n: "יום הולדת", p: "ליום הולדת", tags: ["יוםהולדת", "מסיבתיוםהולדת"] },
    wedding: { n: "חתונה / אירוסין", p: "לחתונה", tags: ["חתונה", "אירוסין", "כלה"] },
    barmitzva: { n: "בר / בת מצווה", p: "לבת המצווה", tags: ["בתמצווה", "ברמצווה"] },
    brit: { n: "ברית / לידה", p: "לחגיגת הלידה", tags: ["ברית", "לידה", "מזלטוב"] },
    holiday: { n: "חג", p: "לחג", tags: ["חג", "מארזיחג", "שולחןחג"] },
    shabbat: { n: "שבת", p: "לשבת", tags: ["שבתשלום", "קינוחלשבת"] },
    gift: { n: "מתנה", p: "כמתנה", tags: ["מתנה", "מתנהמתוקה", "מארזמתנה"] },
    none: { n: "סתם כי בא לי", p: "", tags: [] },
  };
  const STYLES = { warm: "חם ואישי", lux: "יוקרתי", fun: "שובב ומצחיק", short: "קצר וקולע", sale: "מכירתי" };

  const T = {
    warm: [
      "יש קינוחים שמכינים — ויש קינוחים שמכינים באהבה 💗\n{W} {P} של לקוחה יקרה — וכל פרט קיבל את הזמן שלו.{D}",
      "הרגע הזה כשהלקוחה פותחת את הקופסה... 🥹\n{W} {P}, בדיוק כמו שחלמנו יחד.{D}",
      "מאחורי כל {N} יש סיפור.\nהפעם: {W} {P} — ושמחה גדולה שלי להיות חלק מהרגע.{D}",
    ],
    lux: [
      "אלגנטיות בכל פרט ✨\n{W} {P}, בעבודת יד מחומרי הגלם האיכותיים ביותר.{D}",
      "כשטעם פוגש עיצוב.\n{W} בהזמנה אישית {P}.{D}",
      "פחות זה יותר — כשכל פרט מדויק.\n{W} {P}.{D}",
    ],
    fun: [
      "אזהרה: הפוסט הזה עלול לגרום לרעב פתאומי 😅\n{W} {P} — ולא, לא נשאר לי לטעום 🙈{D}",
      "מישהו אמר {N}? 🙋‍♀️\n{W} {P}, ובאמת שהיה קשה להיפרד.{D}",
      "דיאטה? מתחילים מחר. היום יש {N} 😋\n{W} {P}.{D}",
    ],
    short: ["{W} {P} 🤍{D}", "{N}. בעבודת יד. באהבה.{D}", "עוד הזמנה יצאה לדרך 🚗💨 {W} {P}.{D}"],
    sale: [
      "מחפשת משהו מתוק {P} שכולם ידברו עליו? 🎉\n{N} בהזמנה אישית — בעיצוב שלך, בטעמים שאת אוהבת.{D}\nמספר ההזמנות בשבוע מוגבל!",
      "{W} {P} — עכשיו גם אצלך 💗\nמתאימים לך עיצוב, גודל וטעמים.{D}\nהיומן לחודש הקרוב כבר מתמלא.",
      "רוצה גם? 😍\n{W} {P}, בהזמנה מראש.{D}",
    ],
  };
  const CTA = {
    dm: ["להזמנות — שלחי הודעה פרטית 📩", "רוצה גם? כתבי לי בפרטי 💌"],
    link: ["להזמנות — קישור בביו 👆", "התפריט המלא בקישור בביו 🔗"],
    wa: ["להזמנות בוואטסאפ — הקישור בביו 💬", "הזמנות בוואטסאפ, מחכה לך 💬"],
    none: [""],
  };
  const GENERAL = ["קינוחים", "קונדיטוריה", "קונדיטוריתביתית", "אפייהביתית", "עוגות", "מתוקים", "בעבודתיד", "pastry", "dessert", "homebaker"];

  let st = Object.assign({ dessert: "cake", occasion: "birthday", style: "warm", detail: "", city: "", cta: "dm", favs: [] }, M.load(M.KEYS.captions, {}));
  if (!st.city) st.city = M.getProfile().city || "";
  let seed = 0;
  const save = () => M.save(M.KEYS.captions, st);
  const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  const shuffle = (arr, s) => arr.map((x, i) => ({ x, r: Math.sin(s * 99 + i * 7.3) })).sort((a, b) => a.r - b.r).map((o) => o.x);

  function chips(id, obj, key) {
    $(id).innerHTML = Object.keys(obj).map((k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${st[key] === k}">${typeof obj[k] === "string" ? obj[k] : obj[k].n}</button>`).join("");
    $(id).onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; st[key] = b.dataset.k; save(); chips(id, obj, key); generate(); };
  }

  function hashtags(s) {
    const d = DESSERTS[st.dessert], o = OCCASIONS[st.occasion];
    const city = (st.city || "").trim().replace(/\s+/g, "");
    const loc = city ? [city, "עוגות" + city, "קינוחים" + city] : [];
    const tags = [...new Set([...d.tags, ...o.tags, ...loc, ...shuffle(GENERAL, s).slice(0, 6)])].slice(0, 15);
    return tags.map((t) => "#" + t).join(" ");
  }

  function build(i) {
    const d = DESSERTS[st.dessert], o = OCCASIONS[st.occasion];
    const tpl = pick(T[st.style], seed + i);
    const det = st.detail.trim() ? `\n${st.style === "short" ? "" : "✨ "}${st.detail.trim()}` : "";
    let text = tpl.replace(/\{W\}/g, d.w).replace(/\{N\}/g, d.n.split(" / ")[0]).replace(/\{P\}/g, o.p).replace(/\{D\}/g, det).replace(/ +([,.!])/g, "$1").replace(/  +/g, " ");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    const cta = pick(CTA[st.cta], seed + i);
    return text.trim() + (cta ? "\n\n" + cta : "") + "\n.\n.\n" + hashtags(seed + i);
  }

  function generate() {
    const caps = [0, 1, 2].map(build);
    $("out").innerHTML = caps.map((c, i) => `
      <article class="msg-card"><div class="msg-box">${M.esc(c)}</div>
      <div class="btn-row" style="margin-top:10px"><button type="button" class="btn btn-sm" data-copy="${i}">העתקה</button><button type="button" class="btn btn-sm btn-ghost" data-fav="${i}">♡ שמירה</button></div></article>`).join("") +
      `<button type="button" class="btn btn-outline" id="more">עוד גרסאות ↻</button>`;
    $("out").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "more") { seed += 3; generate(); return; }
      if (b.dataset.copy) M.copyText(caps[+b.dataset.copy]);
      if (b.dataset.fav) { st.favs.unshift({ id: M.uid(), text: caps[+b.dataset.fav], at: Date.now() }); st.favs = st.favs.slice(0, 30); save(); renderFavs(); M.toast("נשמר ✓"); }
    };
  }
  function renderFavs() {
    $("favs").innerHTML = st.favs.length ? st.favs.map((f) => `<li class="saved-item"><div style="flex:1;min-width:0"><span class="meta" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${M.esc(f.text.split("\n")[0])}</span></div>
      <div class="btn-row"><button class="btn btn-sm btn-ghost" data-c="${f.id}" type="button">העתקה</button><button class="btn btn-sm btn-danger" data-r="${f.id}" type="button" aria-label="מחיקה">✕</button></div></li>`).join("")
      : `<li class="empty">עוד לא שמרת כיתובים</li>`;
  }
  $("favs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const f = st.favs.find((x) => x.id === (b.dataset.c || b.dataset.r)); if (!f) return;
    if (b.dataset.c) M.copyText(f.text); else { st.favs = st.favs.filter((x) => x !== f); save(); renderFavs(); }
  });

  $("c-detail").value = st.detail; $("c-city").value = st.city; $("c-cta").value = st.cta;
  ["detail", "city"].forEach((k) => $("c-" + k).addEventListener("input", (e) => { st[k] = e.target.value; save(); }));
  $("c-cta").addEventListener("change", (e) => { st.cta = e.target.value; save(); generate(); });
  $("gen").addEventListener("click", () => { seed += 3; generate(); $("out").scrollIntoView({ behavior: "smooth", block: "start" }); });

  chips("c-dessert", DESSERTS, "dessert");
  chips("c-occasion", OCCASIONS, "occasion");
  chips("c-style", STYLES, "style");
  M.mountBackup("backup", [M.KEYS.captions], "captions");
  renderFavs();
  generate();
})();
