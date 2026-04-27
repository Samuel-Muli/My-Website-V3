# Google Sheets Visitor Tracking — Setup Guide

This guide connects your portfolio's visitor tracker to a live Google Sheet so that every visit, name, email, and location is stored permanently in the cloud — not just in the visitor's browser localStorage.

---

## What You'll Need

- A Google account
- Your `google-sheet-backend.js` file (already provided)
- Your `script.js` (already has `SHEET_CONFIG` built in at the top)
- 10–15 minutes

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and click **+ Blank spreadsheet**
2. Name it something like `Samuel Muli — Visitor Tracker`
3. Look at the URL. It will look like:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
   ```
   Copy the long ID between `/d/` and `/edit`. That is your **Sheet ID**.
   
   > ✅ Save it — you'll need it in Step 3.

---

## Step 2 — Open Google Apps Script

1. In your Google Sheet, click the menu: **Extensions → Apps Script**
2. A new tab opens with a code editor showing a default empty function — delete everything in it

---

## Step 3 — Paste the Backend Code

1. Open your `google-sheet-backend.js` file
2. Copy the **entire file** and paste it into the Apps Script editor (replacing the empty function)
3. At the top of the file, fill in your two values:

```javascript
var SHEET_ID    = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'; // ← your Sheet ID from Step 1
var ADMIN_EMAIL = 'samuel@example.com';                               // ← your email address
```

4. Click the **💾 Save** icon (or press `Ctrl + S`)
5. Name the project something like `PortfolioVisitorTracker` when prompted

---

## Step 4 — Deploy as a Web App

1. Click the blue **Deploy** button (top right) → **New deployment**
2. Click the gear icon ⚙️ next to "Type" → Select **Web app**
3. Fill in the settings exactly like this:

   | Setting | Value |
   |---|---|
   | Description | Portfolio Visitor Tracker |
   | Execute as | **Me** |
   | Who has access | **Anyone** |

4. Click **Deploy**
5. Google will ask you to **authorise** the script — click **Authorise access**
6. Choose your Google account → Click **Advanced** → **Go to PortfolioVisitorTracker (unsafe)**

   > This "unsafe" warning is just because it's your own unverified script — it is safe.

7. Click **Allow**
8. You'll see a screen with your **Web App URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```

   > ✅ Copy this URL — you'll need it in Step 5.

---

## Step 5 — Connect to Your Website

Open your `script.js` file and find these lines at the very top:

```javascript
const SHEET_CONFIG = {
    sheetScriptUrl: '',   // ← paste your Apps Script Web App URL here
    enabled: function () { return !!this.sheetScriptUrl; }
};
```

Replace the empty string with your Web App URL:

```javascript
const SHEET_CONFIG = {
    sheetScriptUrl: 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXX/exec',
    enabled: function () { return !!this.sheetScriptUrl; }
};
```

Save the file and upload it to your hosting.

---

## Step 6 — Test It

1. Open your portfolio website in a **new private/incognito window** (to simulate a fresh visitor)
2. Wait 2 seconds for the visitor popup to appear
3. Open your Google Sheet — you should see a new row appear within a few seconds with:
   - Timestamp, Date, Time
   - IP address and Location (city, country)
   - Device type, Screen resolution, Browser
   - Page URL and Referrer
4. Open the Admin Dashboard on your site (7 consecutive clicks on the footer copyright text within 3 seconds)
5. Check that the status indicator shows **🟢 Sheet connected** and the total count matches the sheet

> If no row appears, check Step 7 — Troubleshooting.

---

## What Gets Logged

Every column in your Google Sheet is explained below:

| Column | What it contains |
|---|---|
| Timestamp | Exact ISO timestamp of the visit |
| Date | Local date (e.g. 24/04/2026) |
| Time | Local time (e.g. 14:32:05) |
| Name | Visitor's name if they filled in the popup form |
| Email | Visitor's email if they filled in the popup form |
| Purpose | Reason for visiting if they filled in the popup form |
| IP | Visitor's public IP address |
| Location | City and country (e.g. Nairobi, Kenya) |
| Device | Mobile or Desktop |
| Resolution | Screen size (e.g. 1920x1080) |
| Browser | Chrome / Firefox / Safari / Edge / Opera |
| Page | The full URL they visited |
| Referrer | Where they came from (Direct, Google, etc.) |
| Notified | Yes if visitor ticked "Notify Samuel", No otherwise |
| Fingerprint | Reserved for future use |

---

## How the Two Systems Work Together

```
Visitor arrives
      │
      ├── localStorage  ←  always runs, works offline
      │       stores visit data in visitor's browser
      │
      └── Google Sheet  ←  runs when sheetScriptUrl is set
              ↓
        IP lookup (ipapi.co) completes
              ↓
        Full visit row sent to Apps Script
              ↓
        Row saved in Google Sheet
              ↓
        (Optional) Email sent to ADMIN_EMAIL
```

The sheet is the **permanent record**. localStorage is the **fallback** — it keeps working even if the sheet request fails. The dashboard counter shows whichever source has data, preferring the sheet.

---

## Step 7 — Troubleshooting

**"Sheet not configured" shows in dashboard even after I pasted the URL**  
→ Make sure there are no extra spaces inside the quotes. The URL must start with `https://`

**Row not appearing in the sheet**  
→ Open browser DevTools (F12) → Console tab → look for a red error starting with `logToSheet`. The most common cause is the script not being deployed with "Anyone" access.

**"Exception: Access denied" in Apps Script logs**  
→ Go back to Apps Script → Deploy → Manage deployments → Edit → confirm "Who has access" is set to **Anyone** (not "Anyone with Google account")

**Email not arriving**  
→ Check that `ADMIN_EMAIL` in `google-sheet-backend.js` is replaced with your real email and the script was redeployed after the change. Also check your spam folder.

**Need to update the backend code later**  
→ After editing `google-sheet-backend.js` in Apps Script, go to Deploy → **Manage deployments** → Edit → change the version to **New version** → Deploy. The URL stays the same.

**CORS error in console**  
→ This is normal for Apps Script — the fetch still succeeds. Apps Script returns CORS headers only for GET, not POST. The data is still logged correctly.

---

## Optional: Viewing Data Nicely

Once you have data in the sheet, you can:

- **Filter by date**: Click the Date column header → Data → Create a filter
- **Count visits per day**: In a new sheet tab, use `=COUNTIF(Visitors!B:B, "24/04/2026")`
- **See unique visitors**: `=COUNTA(UNIQUE(Visitors!G:G))` on the IP column
- **Chart visits over time**: Select Date + a count column → Insert → Chart → Line chart

---

## Security Note (For Later)

The Web App URL acts like an API key — anyone who has it can log rows to your sheet. Since it's embedded in your public JavaScript, it's visible to anyone who views your source. This is acceptable for a portfolio visitor tracker, but when you're ready to harden it:

- Add an `origin` or `referrer` check inside `doPost()` in the Apps Script to only accept requests from your domain
- Rotate the deployment periodically (Deploy → New version → new URL → update `script.js`)

---

*Setup guide for Samuel Muli Portfolio — Last updated April 2026*
