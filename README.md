# Samuel Muli — Portfolio Website

A personal portfolio website built with vanilla HTML, CSS, and JavaScript. It showcases Samuel's skills, projects, and contact information, and includes two fully functional web tools — an Age Calculator and a Unit Converter — as well as a real-time visitor tracking system backed by Google Sheets.

---

## Live Site

> Deploy to your preferred host (Netlify, Vercel, GitHub Pages, cPanel) and update links accordingly.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Pages](#pages)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Local Development](#setup--local-development)
- [Google Sheets Visitor Tracking](#google-sheets-visitor-tracking)
- [Deployment](#deployment)
- [File Reference](#file-reference)
- [Projects Showcased](#projects-showcased)
- [Contact & Social](#contact--social)

---

## Project Structure

```
portfolio/
├── index.html                 # Main portfolio page
├── Your_Age.html              # Age Calculator tool
├── unit_converter.html        # Unit Converter tool
├── script.js                  # Combined JS (portfolio + tracker + age calc)
├── styles.css                 # Combined CSS (portfolio + age calculator)
├── google-sheet-backend.js    # Google Apps Script — deploy to script.google.com
├── GOOGLE_SHEETS_SETUP.md     # Step-by-step sheet connection guide
├── img/
│   ├── image.png              # Profile photo (used in home + about)
│   ├── img2.png               # Project card image
│   ├── img3.png               # Project card image
│   └── img4.png               # Project card image
└── README.md                  # This file
```

---

## Pages

### `index.html` — Main Portfolio
The single-page portfolio covering:
- **Home** — Name, title (Typed.js animation), social links
- **About** — Bio, skills summary
- **Services** — Mechanical Engineering, Programming, Design & 3D Printing
- **Portfolio** — 9 project cards with links
- **Contact** — Web3forms-powered async contact form

### `Your_Age.html` — Age Calculator
Calculates a visitor's exact age down to the millisecond from their date and time of birth. Shows current age, countdown to next birthday, zodiac sign, and a fun birthday fact. Triggers a confetti birthday popup if today is the user's birthday.

### `unit_converter.html` — Unit Converter
Converts between units across 6 categories: Length, Weight, Temperature, Area, Volume, and Time. Includes a conversion history log, keyboard shortcuts, and a visible shortcuts panel toggle.

---

## Features

### Portfolio
- Smooth scroll single-page layout
- Typed.js animated role titles (Mechanical Engineer, Developer, Designer…)
- Responsive mobile navigation with hamburger menu
- Animated social links

### Dark / Light Mode
- Toggle button in the navbar (🌙 / ☀️)
- Persisted to `localStorage` — preference survives page reload
- Applied instantly on load (no flash of wrong theme)
- Covers all three pages including the age calculator card colours and header gradient

### Visitor Tracking
- Popup appears 2 seconds after a new session starts
- Auto-dismisses after **10 seconds** or on click outside the box
- Visitor can fill in Name, Email, and Purpose then click **Notify Visit** to send Samuel an email
- **Skip** dismisses without any notification
- IP and location resolved via `ipapi.co` (free, no key needed)
- All visit data stored in `localStorage` as a fallback
- Optional Google Sheets backend for permanent cloud storage (see below)

### Admin Dashboard
- Triggered by **7 consecutive clicks** on the footer copyright text within 3 seconds
- Clicking anywhere else on the page resets the counter
- Shows: Total visits, Today's visits, Unique visitors, Detailed (named) visits
- Sheet connection status (🟢 connected / 🟡 syncing / ⚪ not configured)
- Last sync timestamp with time-ago display
- Manual Refresh button to pull latest sheet counts
- Export to CSV button (downloads all stored visit data)

### Contact Form
- Powered by [Web3forms](https://web3forms.com) — no backend needed
- Submitted via `fetch()` — no page reload
- Loading spinner during submission
- Inline ✅ success or ❌ error message

### Cookie Consent Banner
- Appears on first visit across all three pages
- Accept / Reject stored in `localStorage`
- Slides out smoothly on choice
- No flash of hidden content (uses CSS class toggle, not inline style)

### Age Calculator
- Accepts date **and time** of birth for millisecond precision
- Real-time countdown (updates every 100ms)
- Birthday confetti popup if today matches birth month/day
- **Share My Age** button — copies a fun sentence to clipboard, turns green to confirm
- If a future date is entered, the field resets to today with a red border warning (no alert box)
- Mouse wheel + up/down buttons to adjust the date field

### Unit Converter
- 6 categories: Length, Weight, Temperature, Area, Volume, Time
- Live conversion on input
- Swap units button
- Conversion history (stored in `localStorage`, deletable per entry)
- Keyboard shortcuts: `Enter` → Convert, `Ctrl+Shift+S` → Swap, `Ctrl+Shift+C` → Clear history, `?` → Toggle shortcuts panel
- The `?` shortcut is correctly ignored when typing in an input field

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 with custom properties (CSS variables) |
| Scripting | Vanilla JavaScript (ES6+) |
| Icons | Font Awesome 6.4 (CDN), Boxicons 2.1.4 (CDN) |
| Typed animation | Typed.js 2.1.0 (CDN) |
| Contact form | Web3forms API |
| IP geolocation | ipapi.co (free, no key) |
| Visitor persistence | Browser `localStorage` + optional Google Sheets |
| Backend (optional) | Google Apps Script (deployed as Web App) |
| Font | Poppins (Google Fonts) |

No build tools, bundlers, or frameworks — everything runs as plain static files.

---

## Setup & Local Development

### Requirements
- Any static file server (VS Code Live Server, Python's `http.server`, etc.)
- A modern browser (Chrome, Firefox, Edge, Safari)

### Steps

**1. Clone or download the project**
```bash
git clone https://github.com/Samuel-Muli/My_Website.git
cd My_Website
```

**2. Serve locally**
```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve .

# VS Code
# Install the Live Server extension, right-click index.html → Open with Live Server
```

**3. Open in browser**
```
http://localhost:8000
```

> Opening `index.html` directly as a `file://` URL may cause some fetch requests (contact form, IP lookup, Google Sheets) to fail due to browser CORS restrictions. Always use a local server.

---

## Google Sheets Visitor Tracking

The visitor tracker works out of the box using `localStorage`. To upgrade to permanent cloud storage in a Google Sheet, follow the full guide in **`GOOGLE_SHEETS_SETUP.md`**.

**Quick summary:**
1. Create a new Google Sheet — copy the Sheet ID from the URL
2. Open **Extensions → Apps Script** in that sheet
3. Paste the contents of `google-sheet-backend.js`, fill in your Sheet ID and email, save
4. Deploy as a **Web App** (Execute as: Me, Access: Anyone) — copy the Web App URL
5. In `script.js`, paste the URL into `SHEET_CONFIG.sheetScriptUrl`
6. Test in an incognito window — a row should appear in the sheet within seconds

**Why `text/plain`?** Google Apps Script cannot respond to the CORS OPTIONS preflight that `application/json` POST requests trigger. The fetch sends `Content-Type: text/plain` to skip the preflight entirely; the body is still valid JSON and is parsed manually on the Apps Script side.

**What gets logged per visit:**
Timestamp · Date · Time · Name · Email · Purpose · IP · Location · Device · Screen Resolution · Browser · Page · Referrer · Notified · Fingerprint

---

## Deployment

### Netlify (recommended)
1. Push the project to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Select your repo — publish directory is `/` (root)
4. Click **Deploy site**
5. Netlify assigns a free `*.netlify.app` URL with HTTPS automatically

### GitHub Pages
1. Push to a GitHub repository
2. Go to **Settings → Pages → Source → Deploy from branch → main / (root)**
3. Your site is live at `https://samuel-muli.github.io/My_Website/`

### cPanel / Shared Hosting
1. Zip all files
2. Upload via File Manager to `public_html`
3. Extract in place

### Vercel
```bash
npm i -g vercel
vercel
```
Follow the prompts — root directory, no framework preset.

---

## File Reference

| File | Purpose |
|---|---|
| `index.html` | Main portfolio page |
| `Your_Age.html` | Age Calculator page |
| `unit_converter.html` | Unit Converter page (self-contained HTML + CSS + JS) |
| `script.js` | All JavaScript: visitor tracker, age calculator, dark mode, contact form, cookie banner, admin dashboard |
| `styles.css` | All styles: portfolio, age calculator, dark mode, visitor popup, dashboard, cookie banner, share button, spinner |
| `google-sheet-backend.js` | Google Apps Script — handles `doPost()` (log visit) and `doGet()` (return counts). Deploy at script.google.com, not on your web server |
| `GOOGLE_SHEETS_SETUP.md` | Detailed 7-step guide to connect the sheet |
| `img/image.png` | Profile photo |
| `img/img2.png` | Project card placeholder image |
| `img/img3.png` | Project card placeholder image |
| `img/img4.png` | Project card placeholder image |

---

## Projects Showcased

| Project | Description | Link |
|---|---|---|
| WhatsApp Bot | JavaScript bot using the Baileys library for WhatsApp automation | [GitHub](https://github.com/Samuel-Muli/Nation-Protector) |
| Portfolio Website | This site — responsive HTML/CSS/JS portfolio | [GitHub](https://github.com/Samuel-Muli/My_Website) |
| Python Script | Automates downloading and organising files from the internet | [GitHub](https://github.com/Samuel-Muli/Task-Manager) |
| Lekisa Trading Co. | Company website built with React.js | [Live](https://lekisatradinglimited.onrender.com/) |
| Age Calculator | Calculates exact age to the millisecond with zodiac and birthday facts | [Live](Your_Age.html) |
| Unit Converter | Converts between units across 6 categories with history and shortcuts | [Live](unit_converter.html) |
| Music Duplicate Finder | Python script to detect and remove duplicate music files by metadata | [GitHub](https://github.com/Samuel-Muli/MP3-duplicate-sorter) |
| Birthday App | Desktop/Android app for age, zodiac sign, and birthday facts | [GitHub](https://github.com/Samuel-Muli/Birthday) |

---

## Contact & Social

| Platform | Link |
|---|---|
| WhatsApp | [+254 705 244 235](https://wa.me/254705244235) |
| Facebook | [samu.muli.92](https://web.facebook.com/samu.muli.92) |
| Twitter / X | [@Kithome_SaMu](https://x.com/Kithome_SaMu) |
| Instagram | [@dulcet265](https://www.instagram.com/dulcet265) |
| LinkedIn | [Muli Samuel](https://www.linkedin.com/in/muli-samuel-442259344) |
| GitHub | [Samuel-Muli](https://github.com/Samuel-Muli) |

---

## Security Notes

The following are intentional decisions for the development phase and should be addressed before the site goes fully public:

- **Web3forms access key** is exposed in `script.js`. For production, proxy the form submission through a serverless function (Netlify Function, Vercel Edge, PHP backend) so the key is never in the browser.
- **Admin dashboard password** (`samuel2024`, `admin123`) is stored in plain JS. Replace with a proper authentication mechanism or disable public admin access entirely before launch.
- **Google Sheets Web App URL** in `SHEET_CONFIG.sheetScriptUrl` is visible in source. Add an `origin` check inside `doPost()` in the Apps Script to reject requests from unknown domains.
- All visitor data in `localStorage` is unencrypted. For a personal portfolio tracker this is acceptable; for any sensitive use case, move to a proper backend database.

---

## Browser Support

| Browser | Status |
|---|---|
| Chrome 100+ | ✅ Full support |
| Firefox 110+ | ✅ Full support |
| Edge 100+ | ✅ Full support |
| Safari 15+ | ✅ Full support |
| Mobile Chrome / Safari | ✅ Responsive layout |

---

*README for Samuel Muli Portfolio — Last updated April 2026*
