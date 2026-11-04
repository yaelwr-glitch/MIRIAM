/* בונה תפריט אישי */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);

  let profile = M.getProfile();
  let menu = Object.assign({
    title: M.t("התפריט שלנו"),
    sub: M.t("עוגות וקינוחי בוטיק בהזמנה אישית"),
    note: M.t("הזמנות עד 3 ימים מראש · כשר"),
    tpl: "classic",
    items: [
      { id: M.uid(), name: M.t("עוגת שוקולד-פטל"), desc: M.t("שכבות שוקולד עשיר, קרם גנאש ופטל טרי"), price: 220, photo: "" },
      { id: M.uid(), name: M.t("מארז 12 פרלינים"), desc: M.t("שוקולד בלגי במילויים מתחלפים"), price: 120, photo: "" },
      { id: M.uid(), name: M.t("טארט לימון"), desc: M.t("בצק פריך, קרם לימון ומרנג שרוף"), price: 160, photo: "" },
    ],
  }, M.load(M.KEYS.menu, {}));

  function persist() { M.save(M.KEYS.menu, menu); M.setProfile(profile); }

  /* ---------- Editor ---------- */
  function renderItems() {
    $("items").innerHTML = menu.items.map((it, i) => `
      <div class="menu-edit-item" data-i="${i}">
        <div class="top">
          ${it.photo ? `<img class="item-thumb" src="${it.photo}" alt="">` : `<span class="item-thumb" aria-hidden="true"></span>`}
          <div style="flex:1"><label for="it-name-${i}">שם</label><input id="it-name-${i}" type="text" data-f="name" value="${M.esc(it.name)}"></div>
          <div style="width:96px"><label for="it-price-${i}">מחיר ₪</label><input id="it-price-${i}" type="number" min="0" step="any" inputmode="decimal" data-f="price" value="${M.esc(it.price)}"></div>
        </div>
        <div><label for="it-desc-${i}">תיאור קצר</label><input id="it-desc-${i}" type="text" data-f="desc" value="${M.esc(it.desc)}"></div>
        <div class="btn-row" style="align-items:center">
          <label class="btn btn-sm btn-ghost" style="margin:0">${it.photo ? "החלפת תמונה" : "הוספת תמונה"}<input type="file" accept="image/*" class="hidden" data-photo="${i}"></label>
          ${it.photo ? `<button type="button" class="btn btn-sm btn-ghost" data-rmphoto="${i}">הסרת תמונה</button>` : ""}
          <button type="button" class="btn btn-sm btn-ghost" data-up="${i}" aria-label="הזזה למעלה" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn btn-sm btn-ghost" data-down="${i}" aria-label="הזזה למטה" ${i === menu.items.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn btn-sm btn-danger" data-del="${i}">מחיקה</button>
        </div>
      </div>`).join("") || `<div class="empty">אין פריטים. הוסיפי פריט ראשון.</div>`;
  }

  function renderRecipeSelect() {
    const recipes = M.getRecipes();
    $("from-recipe").innerHTML = recipes.length
      ? recipes.map((r) => `<option value="${r.id}">${M.esc(r.name)} — ${M.money(M.calcRecipe(r).rounded)}</option>`).join("")
      : `<option value="">אין מתכונים שמורים — צרי במחשבון המחירים</option>`;
    $("add-from-recipe").disabled = !recipes.length;
  }

  function fillTop() {
    $("p-business").value = profile.business;
    $("p-phone").value = profile.phone;
    $("p-instagram").value = profile.instagram;
    $("p-city").value = profile.city;
    $("m-title").value = menu.title;
    $("m-sub").value = menu.sub;
    $("m-note").value = menu.note;
    document.querySelectorAll("#tpl-tabs .tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tpl === menu.tpl)));
  }

  /* ---------- Preview ---------- */
  function renderPreview() {
    const el = $("menu-sheet");
    el.dataset.tpl = menu.tpl;
    const contact = [profile.phone && "📞 " + profile.phone, profile.instagram && "📷 " + profile.instagram, profile.city].filter(Boolean).map(M.esc).join(" · ");
    el.innerHTML = `
      <div class="ms-head">
        ${profile.logo ? `<img class="ms-logo" src="${profile.logo}" alt="לוגו">` : ""}
        <h2 class="ms-biz">${M.esc(profile.business || "שם העסק שלך")}</h2>
        <div class="ms-title">${M.esc(menu.title)}</div>
        ${menu.sub ? `<div class="ms-sub">${M.esc(menu.sub)}</div>` : ""}
      </div>
      <div class="ms-items">
        ${menu.items.filter((i) => i.name).map((it) => `
          <div class="ms-item${it.photo || menu.tpl === "grid" ? "" : " noimg"}">
            ${it.photo ? `<img src="${it.photo}" alt="${M.esc(it.name)}">` : (menu.tpl === "grid" ? `<span class="ms-ph"></span>` : "")}
            <div>
              <div class="ms-row"><span class="ms-name">${M.esc(it.name)}</span><span class="ms-dots"></span><span class="ms-price">${it.price !== "" && it.price != null ? M.money(M.parseNum(it.price)) : ""}</span></div>
              ${it.desc ? `<div class="ms-desc">${M.esc(it.desc)}</div>` : ""}
            </div>
          </div>`).join("")}
      </div>
      <div class="ms-foot">
        ${menu.note ? `<div class="note">${M.esc(menu.note)}</div>` : ""}
        ${contact ? `<div>${contact}</div>` : ""}
      </div>`;
    $("wa-btn").href = M.waLink(menuText());
  }

  function menuText() {
    const lines = [`*${profile.business || "התפריט שלנו"}* — ${menu.title}`];
    if (menu.sub) lines.push(menu.sub);
    lines.push("");
    menu.items.filter((i) => i.name).forEach((it) => {
      lines.push(`• ${it.name}${it.price !== "" ? " — " + M.money(M.parseNum(it.price)) : ""}`);
      if (it.desc) lines.push(`   ${it.desc}`);
    });
    lines.push("");
    if (menu.note) lines.push(menu.note);
    if (profile.phone) lines.push("להזמנות: " + profile.phone);
    if (profile.instagram) lines.push("אינסטגרם: " + profile.instagram);
    return lines.join("\n");
  }

  function refresh() { persist(); renderPreview(); }

  /* ---------- Events ---------- */
  [["p-business", "business"], ["p-phone", "phone"], ["p-instagram", "instagram"], ["p-city", "city"]].forEach(([id, f]) => {
    $(id).addEventListener("input", (e) => { profile[f] = e.target.value; refresh(); });
  });
  [["m-title", "title"], ["m-sub", "sub"], ["m-note", "note"]].forEach(([id, f]) => {
    $(id).addEventListener("input", (e) => { menu[f] = e.target.value; refresh(); });
  });
  $("p-logo").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { profile.logo = await M.fileToDataURL(f, 300, 0.85); refresh(); } catch (err) { M.toast("לא הצלחנו לקרוא את התמונה"); }
    e.target.value = "";
  });
  $("logo-clear").addEventListener("click", () => { profile.logo = ""; refresh(); });

  $("tpl-tabs").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tpl]");
    if (!t) return;
    menu.tpl = t.dataset.tpl;
    fillTop();
    refresh();
  });

  $("items").addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row || !e.target.dataset.f) return;
    menu.items[+row.dataset.i][e.target.dataset.f] = e.target.value;
    refresh();
  });
  $("items").addEventListener("change", async (e) => {
    if (e.target.dataset.photo == null) return;
    const i = +e.target.dataset.photo;
    const f = e.target.files[0];
    if (!f) return;
    try {
      menu.items[i].photo = await M.fileToDataURL(f, 480, 0.8);
      renderItems(); refresh();
    } catch (err) { M.toast("לא הצלחנו לקרוא את התמונה"); }
  });
  $("items").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.del != null) { if (!confirm("למחוק את הפריט?")) return; menu.items.splice(+d.del, 1); }
    else if (d.rmphoto != null) menu.items[+d.rmphoto].photo = "";
    else if (d.up != null) { const i = +d.up; [menu.items[i - 1], menu.items[i]] = [menu.items[i], menu.items[i - 1]]; }
    else if (d.down != null) { const i = +d.down; [menu.items[i + 1], menu.items[i]] = [menu.items[i], menu.items[i + 1]]; }
    else return;
    renderItems(); refresh();
  });

  $("add-item").addEventListener("click", () => {
    menu.items.push({ id: M.uid(), name: "", desc: "", price: "", photo: "" });
    renderItems(); refresh();
    const inp = $("items").querySelector(".menu-edit-item:last-child input");
    if (inp) inp.focus();
  });
  $("add-from-recipe").addEventListener("click", () => {
    const r = M.getRecipes().find((x) => x.id === $("from-recipe").value);
    if (!r) return;
    menu.items.push({ id: M.uid(), recipeId: r.id, name: r.name, desc: "", price: M.calcRecipe(r).rounded, photo: "" });
    renderItems(); refresh();
    M.toast("נוסף: " + r.name);
  });

  $("png-btn").addEventListener("click", () => M.saveAsPNG($("menu-sheet"), "menu-" + new Date().toISOString().slice(0, 10) + ".png"));
  $("print-btn").addEventListener("click", () => window.print());

  M.mountBackup("backup", [M.KEYS.menu, M.KEYS.profile], "menu");

  fillTop();
  renderItems();
  renderRecipeSelect();
  renderPreview();
})();
