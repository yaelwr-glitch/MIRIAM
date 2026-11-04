/**
 * עוזרת אפייה — Cloudflare Worker
 * מקבל מהאתר: { message, category, image?: { media_type, data(base64) } }
 * מחזיר:       { reply }  או  { error }
 * מפתח ה-API נשמר כסוד (ANTHROPIC_API_KEY) ולעולם לא מגיע לדפדפן.
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5-5";
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024; // base64-decoded size limit
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const SYSTEM_PROMPT = `את קונדיטורית ושוקולטיירית מומחית, חמה ומעודדת, שעונה בעברית לתלמידות בקורס "מהמטבח לעסק משלי" של MIREL שוקולד וקונדיטוריית בוטיק.
התלמידות הן אופות ביתיות שבונות עסק קטן לעוגות וקינוחים. הן מתארות תקלה באפייה (ולעיתים מצרפות תמונה), ואת עוזרת להן להבין מה קרה.

איך לענות:
- פתחי במשפט קצר ומרגיע.
- "## מה כנראה קרה" — 2–4 סיבות סבירות, מהסבירה ביותר, עם הסבר קצר לכל אחת. אם יש תמונה, התייחסי למה שרואים בה.
- "## אפשר להציל עכשיו?" — אם יש דרך לתקן את המוצר הנוכחי, כתבי איך. אם לא, אמרי זאת בעדינות והציעי שימוש חלופי (טרייפל, כדורי עוגה וכו').
- "## בפעם הבאה" — צעדים מעשיים ומדויקים: טמפרטורות במעלות צלזיוס, משקלים בגרמים, זמנים.
- אם חסר מידע חשוב (טמפרטורה, מתכון, סוג תבנית), סיימי בשאלה אחת או שתיים שיעזרו לדייק.
- כתבי בשפה פשוטה וברורה, בגוף שני נקבה, בלי ז'רגון מיותר. השתמשי ברשימות קצרות.
- בשאלות של בטיחות מזון (אחסון, מוצרים שעמדו בחוץ, אלרגנים) — היי זהירה והמליצי לא להגיש כשיש ספק.
- אם השאלה לא קשורה לאפייה, לקינוחים או לעסק קינוחים ביתי — הסבירי בנימוס שאת עוזרת רק בנושאים האלה.`;

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    _allowed: ok,
  };
}

function json(body, status, cors) {
  const { _allowed, ...headers } = cors;
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      const { _allowed, ...headers } = cors;
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
    if (!cors._allowed) return json({ error: "origin_not_allowed" }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "missing_api_key" }, 500, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_json" }, 400, cors);
    }

    const message = String(body.message || "").slice(0, 3000).trim();
    const category = String(body.category || "").slice(0, 60);
    const LANGS = { he: "Hebrew", en: "English", fr: "French" };
    const lang = LANGS[body.lang] ? body.lang : "he";
    const image = body.image && typeof body.image === "object" ? body.image : null;
    if (!message && !image) return json({ error: "empty" }, 400, cors);

    const content = [];
    if (image) {
      if (!ALLOWED_MEDIA.includes(image.media_type) || typeof image.data !== "string") {
        return json({ error: "bad_image" }, 400, cors);
      }
      if (image.data.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: "image_too_large" }, 413, cors);
      content.push({ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } });
    }
    content.push({
      type: "text",
      text: `סוג המוצר: ${category || "לא צוין"}\nתיאור הבעיה: ${message || "(ללא תיאור — ראי את התמונה)"}`,
    });

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT + (lang === "he" ? "" : `\n\nIMPORTANT: the student is using the ${LANGS[lang]} version of the site — write your whole answer in ${LANGS[lang]} (same structure and headings, translated).`),
        messages: [{ role: "user", content }],
        output_config: { effort: "medium" },
        // If a safety classifier declines, the API re-runs the request on a recommended fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });

      if (response.stop_reason === "refusal") {
        const sorry = { he: "מצטערת, לא אוכל לעזור בשאלה הזו. אפשר לנסח אותה מחדש, או לפנות ישירות למרים.", en: "Sorry, I can't help with this question. Try rephrasing it, or contact Miriam directly.", fr: "Désolée, je ne peux pas répondre à cette question. Reformulez-la ou contactez directement Miriam." };
        return json({ reply: sorry[lang] }, 200, cors);
      }
      const reply = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return json({ reply: reply || "לא התקבלה תשובה. נסי שוב." }, 200, cors);
    } catch (err) {
      const status = err && err.status;
      console.error("anthropic_error", status, err && err.message);
      if (status === 429) return json({ error: "busy" }, 429, cors);
      return json({ error: "upstream_error" }, 502, cors);
    }
  },
};
