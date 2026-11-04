/* מנוע צ'קליסט משותף — לצ'קליסט פתיחת העסק ולתוכנית 30 הימים.
   הנתונים מגיעים מ-window.CHECKLIST = { key, sections:[{title, items:[{id,t,d,link,day}]}], withDays } */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const C = window.CHECKLIST;
  let st = Object.assign({ done: {}, notes: {}, start: "" }, M.load(C.key, {}));
  const save = () => M.save(C.key, st);
  const allItems = () => C.sections.reduce((a, s) => a.concat(s.items), []);

  function todayDay() {
    if (!st.start) return 0;
    const s = new Date(st.start + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.floor((n - s) / 864e5) + 1;
  }

  function render() {
    const items = allItems();
    const doneCount = items.filter((i) => st.done[i.id]).length;
    const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
    $("cl-progress").innerHTML = `<div class="progress-label"><span>${doneCount} מתוך ${items.length} הושלמו</span><strong>${pct}%</strong></div><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>` +
      (pct === 100 ? `<p class="info-box" style="margin-top:10px">🎉 כל הכבוד! סיימת את כל הרשימה.</p>` : "");
    const td = todayDay();
    $("cl-sections").innerHTML = C.sections.map((sec, si) => {
      const d = sec.items.filter((i) => st.done[i.id]).length;
      return `<section class="panel"><div class="panel-head"><h2>${M.esc(sec.title)}</h2><span class="pill${d === sec.items.length ? " pill-ok" : ""}">${d}/${sec.items.length}</span></div>
        ${sec.intro ? `<p class="muted">${sec.intro}</p>` : ""}
        <div class="rows">${sec.items.map((it) => `
          <label class="check-item${st.done[it.id] ? " done" : ""}"${C.withDays && it.day === td ? ' style="border-color:var(--rose-dark);border-width:2px"' : ""}>
            <input type="checkbox" data-id="${it.id}" ${st.done[it.id] ? "checked" : ""}>
            <span style="flex:1">
              <span class="ci-title">${C.withDays ? `<span class="pill" style="margin-inline-end:6px">יום ${it.day}${it.day === td ? " · היום" : ""}</span>` : ""}${M.esc(it.t)}</span>
              ${it.d ? `<span class="ci-desc">${it.d}</span>` : ""}
              ${it.link ? `<a class="small" href="${it.link}">${it.linkText || "לכלי ←"}</a>` : ""}
            </span>
          </label>`).join("")}</div></section>`;
    }).join("");
  }

  $("cl-sections").addEventListener("change", (e) => {
    const id = e.target.dataset.id; if (!id) return;
    if (e.target.checked) st.done[id] = Date.now(); else delete st.done[id];
    save();
    if (e.target.checked) {
      const r = e.target.getBoundingClientRect();
      const sec = C.sections.find((x) => x.items.some((i) => i.id === id));
      const all = allItems().every((i) => st.done[i.id]);
      const secDone = sec && sec.items.every((i) => st.done[i.id]);
      if (all || secDone) M.confetti({ big: all, x: r.left + r.width / 2, y: r.top });
      if (all) M.toast("🎉 סיימת את כל הרשימה!"); else if (secDone) M.toast("✨ סיימת שלב שלם!");
    }
    render();
  });

  if (C.withDays) {
    const s = $("cl-start");
    s.value = st.start || "";
    s.addEventListener("change", () => { st.start = s.value; save(); render(); });
    if (!st.start) { st.start = new Date().toISOString().slice(0, 10); s.value = st.start; save(); }
  }
  const reset = $("cl-reset");
  if (reset) reset.addEventListener("click", () => { if (confirm("לאפס את כל הסימונים?")) { st.done = {}; save(); render(); } });
  const pr = $("cl-print");
  if (pr) pr.addEventListener("click", () => window.print());

  M.mountBackup("backup", [C.key], C.tag || "checklist");
  render();
})();
