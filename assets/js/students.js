/* אזור תלמידות — מודולים, שיעורים וסימון התקדמות */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const COURSE = window.MIREL_COURSE || [];
  let st = Object.assign({ name: "", done: {}, open: {} }, M.load(M.KEYS.student, {}));
  const save = () => M.save(M.KEYS.student, st);
  const lessons = () => COURSE.reduce((a, m) => a.concat(m.lessons.map((l) => Object.assign({ module: m }, l))), []);

  function embedUrl(url) {
    if (!url) return "";
    let m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (m) return `https://player.vimeo.com/video/${m[1]}${m[2] ? "?h=" + m[2] : ""}`;
    m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
    return "";
  }

  function render() {
    const all = lessons();
    const done = all.filter((l) => st.done[l.id]).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    $("hello").textContent = st.name ? `שלום ${st.name}, ברוכה הבאה 💗` : "ברוכה הבאה לתכנית";
    $("overall").innerHTML = `<div class="progress-label"><span>ההתקדמות שלי בתכנית</span><strong>${done}/${all.length} שיעורים · ${pct}%</strong></div>
      <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="התקדמות בתכנית"><span style="width:${pct}%"></span></div>
      ${pct === 100 ? `<p class="info-box" style="margin-top:12px">🎓 סיימת את כל התכנית! <a href="certificate.html">לתעודת הסיום שלך ←</a></p>` : ""}`;

    const next = all.find((l) => !st.done[l.id]);
    $("next-up").innerHTML = next ? `<span class="eyebrow">השיעור הבא שלך</span><h2 style="margin:0 0 4px">${M.esc(next.title)}</h2><p class="muted" style="margin:0 0 10px">${M.esc(next.module.title)}</p><button type="button" class="btn btn-sm" data-goto="${next.module.id}">להמשך ←</button>`
      : `<h2>כל השיעורים הושלמו 🎉</h2><a class="btn btn-sm" href="certificate.html">לתעודה</a>`;

    $("modules").innerHTML = COURSE.map((m, mi) => {
      const md = m.lessons.filter((l) => st.done[l.id]).length;
      const mp = Math.round((md / m.lessons.length) * 100);
      const open = st.open[m.id] != null ? st.open[m.id] : (next && next.module.id === m.id);
      return `<details class="panel" id="mod-${m.id}" data-mod="${m.id}"${open ? " open" : ""}>
        <summary style="cursor:pointer;list-style:none">
          <div class="module"><span class="module-num">${mi + 1}</span><div style="flex:1"><h2 style="margin:0">${M.esc(m.title)}</h2>
            <div class="progress-label small" style="margin:6px 0 4px"><span>${md}/${m.lessons.length} שיעורים</span><span>${mp}%</span></div>
            <div class="progress"><span style="width:${mp}%"></span></div></div></div>
        </summary>
        <div class="rows" style="margin-top:14px">${m.lessons.map((l, li) => {
          const src = embedUrl(l.video);
          return `<article class="lesson${st.done[l.id] ? " done" : ""}">
            <h3 style="margin:0;font-size:1.1rem"><span>${mi + 1}.${li + 1}</span> <span>${M.esc(l.title)}</span></h3>
            ${l.desc ? `<p class="muted" style="margin:0">${M.esc(l.desc)}</p>` : ""}
            <div class="video-ph">${src ? `<iframe src="${src}" title="${M.esc(l.title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>` : `<span>🎬 הסרטון יעלה בקרוב<!-- TODO: להוסיף קישור וידאו ב-tools/course-data.js --></span>`}</div>
            ${l.task ? `<div class="info-box"><strong>המשימה:</strong> ${M.esc(l.task)}${l.tool ? ` <a href="${l.tool}">לכלי ←</a>` : ""}</div>` : ""}
            <label class="check"><input type="checkbox" data-lesson="${l.id}" ${st.done[l.id] ? "checked" : ""}> סיימתי את השיעור</label>
          </article>`;
        }).join("")}</div></details>`;
    }).join("");
  }

  $("modules").addEventListener("change", (e) => {
    const id = e.target.dataset.lesson; if (!id) return;
    if (e.target.checked) st.done[id] = Date.now(); else delete st.done[id];
    save();
    if (e.target.checked) {
      const r = e.target.getBoundingClientRect();
      const mod = COURSE.find((m) => m.lessons.some((l) => l.id === id));
      const all = lessons().every((l) => st.done[l.id]);
      const modDone = mod && mod.lessons.every((l) => st.done[l.id]);
      M.confetti({ big: all || modDone, x: r.left + r.width / 2, y: r.top });
      M.toast(all ? "🎓 סיימת את כל התכנית!" : modDone ? "🎉 סיימת את המודול!" : "כל הכבוד! ✓");
    }
    render();
  });
  $("modules").addEventListener("toggle", (e) => {
    const d = e.target.closest("[data-mod]"); if (d) { st.open[d.dataset.mod] = d.open; save(); }
  }, true);
  $("next-up").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto]"); if (!b) return;
    const d = $("mod-" + b.dataset.goto); d.open = true; d.scrollIntoView({ behavior: "smooth" });
  });
  $("s-name").value = st.name;
  $("s-name").addEventListener("input", (e) => {
    st.name = e.target.value.trim(); save();
    $("hello").textContent = st.name ? `שלום ${st.name}, ברוכה הבאה 💗` : "ברוכה הבאה לתכנית";
    const cert = M.load(M.KEYS.certificate, {});
    if (!cert.name) M.save(M.KEYS.certificate, Object.assign(cert, { name: st.name }));
  });

  M.mountBackup("backup", [M.KEYS.student], "students");
  render();
})();
