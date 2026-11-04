/* מחשבון יעד הכנסה */
(function () {
  "use strict";
  const M = window.Mirel;
  const $ = (id) => document.getElementById(id);
  const WEEKS = 4.33;

  // average from saved recipes, if any
  const recipes = M.getRecipes();
  let avgPrice = 0, avgCostPct = 0;
  if (recipes.length) {
    const cs = recipes.map((r) => M.calcRecipe(r)).filter((c) => c.rounded > 0);
    if (cs.length) {
      avgPrice = cs.reduce((s, c) => s + c.rounded, 0) / cs.length;
      avgCostPct = (cs.reduce((s, c) => s + (c.ingCost + c.extrasCost) / c.rounded, 0) / cs.length) * 100;
    }
  }

  let st = Object.assign({ goal: 6000, price: avgPrice ? Math.round(avgPrice) : 250, costpct: avgCostPct ? Math.round(avgCostPct) : 30, hours: 3, fixed: 400, tax: 10, days: 4, cap: 6 }, M.load(M.KEYS.income, {}));
  if (avgPrice) $("price-hint").textContent = `ממוצע המתכונים השמורים שלך: ${M.money(avgPrice)}`;

  function plan(price) {
    const goal = M.parseNum(st.goal), fixed = M.parseNum(st.fixed), tax = M.parseNum(st.tax) / 100;
    const margin = price * (1 - M.parseNum(st.costpct) / 100); // contribution per order
    const neededBeforeTax = tax < 1 ? goal / (1 - tax) : goal;
    const perMonth = margin > 0 ? (neededBeforeTax + fixed) / margin : Infinity;
    const ordersMonth = Math.ceil(perMonth);
    const ordersWeek = ordersMonth / WEEKS;
    const hoursWeek = ordersWeek * M.parseNum(st.hours);
    const revenue = ordersMonth * price;
    const hourly = hoursWeek ? goal / (hoursWeek * WEEKS) : 0;
    return { ordersMonth, ordersWeek, hoursWeek, revenue, hourly, margin };
  }

  function update() {
    const price = M.parseNum(st.price);
    const p = plan(price);
    const ok = isFinite(p.ordersMonth);
    $("stats").innerHTML = ok ? `
      <div class="stat hl"><div class="k">הזמנות בשבוע</div><div class="v">${M.num(Math.ceil(p.ordersWeek * 10) / 10, 1)}</div></div>
      <div class="stat"><div class="k">הזמנות בחודש</div><div class="v">${p.ordersMonth}</div></div>
      <div class="stat"><div class="k">שעות עבודה בשבוע</div><div class="v">${M.num(p.hoursWeek, 1)}</div></div>
      <div class="stat"><div class="k">מחזור חודשי</div><div class="v">${M.money(p.revenue)}</div></div>
      <div class="stat"><div class="k">כמה מרוויחה לשעה</div><div class="v">${M.money(p.hourly)}</div></div>
      <div class="stat"><div class="k">ביום עבודה</div><div class="v">${M.num(p.ordersWeek / (M.parseNum(st.days) || 1), 1)} הזמנות</div></div>`
      : `<div class="warn-box" style="grid-column:1/-1">עם העלויות האלה כל הזמנה מפסידה כסף — צריך להעלות מחיר או להוריד עלויות.</div>`;

    let verdict = "";
    if (ok) {
      const perDay = p.hoursWeek / (M.parseNum(st.days) || 1);
      if (perDay > 9) verdict = `<div class="warn-box">זה יוצא כ־${M.num(perDay, 1)} שעות עבודה ביום — עומס גבוה מדי לעסק ביתי. נסי להעלות את המחיר הממוצע (ראי טבלת "מה אם") או למכור מוצרים גדולים יותר.</div>`;
      else if (p.hourly < 45) verdict = `<div class="warn-box">את מרוויחה רק כ־${M.money(p.hourly)} לשעה. זה פחות משכר שעתי סביר — כדאי להעלות מחירים.</div>`;
      else verdict = `<div class="info-box">💪 יעד ריאלי! כ־${M.num(perDay, 1)} שעות ביום, ${M.num(st.days)} ימים בשבוע. עכשיו צריך לדאוג שיהיו ${M.num(Math.ceil(p.ordersWeek))} הזמנות בשבוע — וזה בדיוק מה שעושים בשלב 3 בקורס.</div>`;
    }
    $("verdict").innerHTML = verdict;

    // scenarios
    const mults = [0.8, 1, 1.2, 1.5, 2];
    $("scen").innerHTML = `<thead><tr><th>מחיר להזמנה</th><th class="num">הזמנות בשבוע</th><th class="num">שעות בשבוע</th><th class="num">לשעה</th></tr></thead><tbody>` +
      mults.map((m) => {
        const pr = Math.round(price * m / 5) * 5;
        const s = plan(pr);
        return `<tr${m === 1 ? ' style="background:var(--blush)"' : ""}><td>${M.money(pr)}${m === 1 ? " (היום)" : ""}</td><td class="num">${isFinite(s.ordersWeek) ? M.num(s.ordersWeek, 1) : "—"}</td><td class="num">${isFinite(s.hoursWeek) ? M.num(s.hoursWeek, 1) : "—"}</td><td class="num">${isFinite(s.hourly) ? M.money(s.hourly) : "—"}</td></tr>`;
      }).join("") + "</tbody>";

    // capacity -> required price
    const cap = M.parseNum(st.cap);
    if (cap > 0) {
      const goal = M.parseNum(st.goal), fixed = M.parseNum(st.fixed), tax = M.parseNum(st.tax) / 100;
      const need = (goal / (1 - tax) + fixed) / (cap * WEEKS);
      const priceNeeded = need / (1 - M.parseNum(st.costpct) / 100);
      $("cap-out").innerHTML = `עם ${M.num(cap)} הזמנות בשבוע, כדי להגיע ליעד המחיר הממוצע צריך להיות לפחות <strong>${M.money(Math.ceil(priceNeeded / 5) * 5)}</strong> להזמנה.` +
        (priceNeeded > price * 1.05 ? ` זה ${M.money(priceNeeded - price)} יותר ממה שאת גובה היום — מארזים, תוספות ועוגות גדולות יותר הם דרך טובה להגיע לשם.` : " את כבר שם! 🎉");
    }
    M.save(M.KEYS.income, st);
  }

  ["goal", "price", "costpct", "hours", "fixed", "tax", "days", "cap"].forEach((k) => {
    const el = $("i-" + k);
    el.value = st[k];
    el.addEventListener("input", () => { st[k] = el.value; update(); });
  });
  $("copy-btn").addEventListener("click", () => {
    const p = plan(M.parseNum(st.price));
    M.copyText(`היעד שלי: ${M.money(M.parseNum(st.goal))} רווח בחודש\nמחיר ממוצע: ${M.money(M.parseNum(st.price))}\nצריך: ${M.num(p.ordersWeek, 1)} הזמנות בשבוע (${p.ordersMonth} בחודש)\nכ־${M.num(p.hoursWeek, 1)} שעות עבודה בשבוע`);
  });
  M.mountBackup("backup", [M.KEYS.income], "income-goal");
  update();
})();
