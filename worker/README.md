# עוזרת האפייה — חיבור ל-AI (Cloudflare Worker)

האתר עצמו סטטי (GitHub Pages) ולכן אסור לשים בו מפתח API — כל אחד יוכל לראות אותו.
לכן יש כאן "מתווך" קטן שרץ אצל Cloudflare (חינם עד 100,000 פניות ביום): האתר שולח אליו את השאלה והתמונה, והוא פונה ל-Claude עם המפתח הסודי ומחזיר תשובה.

כל עוד המתווך לא מחובר — עמוד העוזרת עובד במצב "מדריך תקלות" בלי AI.

## מה צריך
- חשבון Anthropic עם מפתח API: https://console.anthropic.com → API Keys (צריך להגדיר אמצעי תשלום; התשלום לפי שימוש).
- חשבון Cloudflare חינמי: https://dash.cloudflare.com/sign-up
- מחשב עם Node.js 20 ומעלה (https://nodejs.org).

## פריסה — צעד אחרי צעד
1. פותחים טרמינל בתיקייה `worker` של הפרויקט.
2. מתקינים:
   ```bash
   npm install
   ```
3. מתחברים ל-Cloudflare (ייפתח דפדפן):
   ```bash
   npx wrangler login
   ```
4. שומרים את מפתח ה-API כסוד (מדביקים את המפתח כשמתבקשים):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
5. מפרסמים:
   ```bash
   npx wrangler deploy
   ```
   בסוף תופיע כתובת כמו `https://mirel-baking-assistant.<שם-החשבון>.workers.dev`.
6. מדביקים את הכתובת בקובץ `tools/config.js` בשדה `assistantEndpoint`, שומרים ודוחפים ל-GitHub.
7. בודקים בעמוד "עוזרת אפייה" — אמורה להופיע ההודעה "העוזרת מחוברת ל-AI".

## הגדרות
- **ALLOWED_ORIGINS** בקובץ `wrangler.toml` — רשימת האתרים שמותר להם לפנות למתווך. אם מטמיעים את הכלי בדומיין אחר — להוסיף אותו ולפרסם שוב.
- **המודל**: `claude-sonnet-5-5` (מוגדר בראש `worker.js`).
- **הנחיית המערכת** (האישיות והמבנה של התשובה) — `SYSTEM_PROMPT` בתוך `worker.js`. אפשר לערוך בעברית.
- תמונות מוקטנות בדפדפן לפני השליחה (עד 1280 פיקסלים), כך שכל שאלה זולה.

## עלויות והגנה
- כל שאלה עולה בדרך כלל אגורות בודדות. כדאי להגדיר תקרת הוצאה חודשית ב-Console של Anthropic (Settings → Limits).
- המתווך מקבל פניות רק מהאתרים ברשימה. אם רוצים הגנה חזקה יותר מפני שימוש לרעה, אפשר להוסיף ב-Cloudflare כלל Rate Limiting (Security → WAF → Rate limiting rules) על כתובת ה-Worker.

## בדיקה מקומית (למפתחים)
```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .dev.vars
npx wrangler dev
```
