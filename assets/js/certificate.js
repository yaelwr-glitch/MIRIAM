/* מחולל תעודת סיום */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const student = M.load(M.KEYS.student, {});
  let st = Object.assign({ name: student.name || "", date: new Date().toISOString().slice(0, 10), business: M.getProfile().business || "", cohort: "" }, M.load(M.KEYS.certificate, {}));
  const save = () => M.save(M.KEYS.certificate, st);

  function render() {
    const d = st.date ? new Date(st.date + "T12:00:00").toLocaleDateString(M.locale, { day: "numeric", month: "long", year: "numeric" }) : "";
    $("cert").innerHTML = `
      <span class="corner c1"></span><span class="corner c2"></span><div class="frame"></div>
      <div class="inner">
        <div class="seal" aria-hidden="true">M</div>
        <div class="brand">MIREL · שוקולד וקונדיטוריית בוטיק</div>
        <h2>תעודת סיום</h2>
        <div class="lead">בזאת מוענקת ל</div>
        <div class="name">${M.esc(st.name || "שם התלמידה")}</div>
        <div class="body">על השלמה מוצלחת של התכנית</div>
        <div class="course">״מהמטבח לעסק משלי״</div>
        <div class="body">${M.t("הכוללת תמחור, תפריט ומיתוג, שיווק ולקוחות, ניהול הזמנות, בטיחות מזון וצמיחה")}${st.business ? ` ${M.t("— ובניית העסק")} <strong>${M.esc(st.business)}</strong>` : ""}.${st.cohort ? `<br>${M.esc(st.cohort)}` : ""}</div>
        <div class="foot">
          <div><span class="sig">${d}</span><br>תאריך</div>
          <div><span class="sig">מרים</span><br>מרים · MIREL</div>
        </div>
      </div>`;
    fit();
    save();
  }
  // scale certificate to fit narrow screens (keeps the 1000px layout for crisp PNG)
  function fit() {
    const wrap = $("cert-scroll"), cert = $("cert");
    const avail = wrap.clientWidth;
    const scale = Math.min(1, avail / 1000);
    cert.style.transform = scale < 1 ? `scale(${scale})` : "";
    wrap.style.height = scale < 1 ? cert.offsetHeight * scale + 8 + "px" : "";
  }
  window.addEventListener("resize", fit);

  ["name", "date", "business", "cohort"].forEach((k) => {
    $("c-" + k).value = st[k];
    $("c-" + k).addEventListener("input", (e) => { st[k] = e.target.value; render(); });
  });
  $("png-btn").addEventListener("click", async () => {
    if (!st.name.trim()) { M.toast("נא להקליד שם"); $("c-name").focus(); return; }
    const cert = $("cert"); const prev = cert.style.transform; cert.style.transform = "";
    await M.saveAsPNG(cert, "mirel-certificate.png");
    cert.style.transform = prev;
    M.confetti({ big: true });
  });
  $("print-btn").addEventListener("click", () => window.print());

  const course = window.MIREL_COURSE || [];
  const total = course.reduce((s, m) => s + m.lessons.length, 0);
  const done = Object.keys(student.done || {}).length;
  $("progress-note").textContent = total ? (done >= total ? "🎉 השלמת את כל השיעורים באזור התלמידות!" : `באזור התלמידות סימנת ${done} מתוך ${total} שיעורים.`) : "";

  M.mountBackup("backup", [M.KEYS.certificate], "certificate");
  render();
})();
