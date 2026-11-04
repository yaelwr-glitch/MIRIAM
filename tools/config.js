/* הגדרות האתר
 * ------------------------------------------------------------
 * assistantEndpoint — הכתובת של ה-Worker של עוזרת האפייה (ראו README, "חיבור עוזרת ה-AI").
 * כל עוד הכתובת ריקה, העמוד מציג את מדריך התקלות המובנה (בלי AI).
 * TODO: אחרי פריסת ה-Worker, להדביק כאן את הכתובת, למשל:
 *   assistantEndpoint: "https://mirel-baking-assistant.<your-account>.workers.dev"
 *
 * newsletterEndpoint — כתובת לשליחת לידים מהשאלון (Mailchimp / ActiveTrail / Make / Zapier / Google Apps Script).
 * TODO: לחבר לרשימת התפוצה של מרים. כל עוד ריק — הלידים נשמרים רק במכשיר של הגולשת, ומוצג לה כפתור וואטסאפ.
 *
 * whatsappNumber — מספר הוואטסאפ של מרים לפניות (בפורמט 9725XXXXXXXX). TODO: להשלים.
 */
window.MIREL_CONFIG = {
  assistantEndpoint: "",
  newsletterEndpoint: "",
  whatsappNumber: "",
};
