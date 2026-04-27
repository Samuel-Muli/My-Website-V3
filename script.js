/* =======================================================
   COMBINED JAVASCRIPT
   1. VisitorTracker class & dashboard helpers
      (originally visitor-tracker.js)
   2. Portfolio navigation, Typed.js, age calculator,
      date scrolling  (originally script.js)
   ======================================================= */


/* -------------------------------------------------------
   SECTION 1 – VISITOR TRACKER  (visitor-tracker.js)
   ------------------------------------------------------- */

/* =======================================================
   GOOGLE SHEETS BACKEND CONFIG
   After deploying google-sheet-backend.js as a Google
   Apps Script Web App, paste the Web App URL below.
   Leave as empty string '' to run in localStorage-only mode.
   ======================================================= */
const SHEET_CONFIG = {
    sheetScriptUrl: 'https://script.google.com/macros/s/AKfycbx05R50tPDK5zuN-iA5AcTm3APKztJexr5Z2D14Dld7JDewTyw10H-kh7QIkCYGL8xe/exec',   // ← paste your Apps Script Web App URL here
    enabled: function () { return !!this.sheetScriptUrl; }
};


class VisitorTracker {
    constructor() {
        this.apiUrl = 'https://api.web3forms.com/submit';
        this.accessKey = 'bc5139d2-b18d-46fa-85d4-4f5a11272896';
        this.storageKey = 'samuel_muli_visitor_data';
        this.sessionKey = 'visitor_session';
        this.sheetTotals = null; // cached {total, today} fetched from sheet
        this.initialize();
    }

    initialize() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            this.trackVisit();
            sessionStorage.setItem(this.sessionKey, 'true');
            this.showPopup();
        }
        // Fetch real totals from sheet (non-blocking), then refresh display
        this.fetchSheetTotals().finally(() => this.updateDisplay());
        this.setupEventListeners();
    }

    trackVisit() {
        const visitData = this.collectVisitData();
        this.saveVisitData(visitData);
        // sendNotification() intentionally removed — consent-only (see handleVisitorForm)
        this.fetchRealLocation(); // #11: fetch real IP & location asynchronously
    }

    collectVisitData() {
        return {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            page: window.location.href,
            referrer: document.referrer || 'Direct',
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isMobile: /Mobi|Android/i.test(navigator.userAgent),
            ip: 'Fetching...',
            city: 'Unknown',
            country: 'Unknown'
        };
    }

    // #11: Real IP geolocation via ipapi.co (free tier – no API key required)
    fetchRealLocation() {
        fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
                let visits = this.getStoredVisits();
                if (visits.length > 0) {
                    const latest = visits[visits.length - 1];
                    latest.ip = data.ip || 'Unknown';
                    latest.city = data.city || 'Unknown';
                    latest.country = data.country_name || 'Unknown';
                    latest.location = latest.city !== 'Unknown'
                        ? `${latest.city}, ${latest.country}`
                        : (latest.ip || 'Unknown');
                    localStorage.setItem(this.storageKey, JSON.stringify(visits));
                    // Now that we have IP/location, log the complete visit to the sheet
                    this.logToSheet(latest);
                    this.updateDisplay();
                }
            })
            .catch(() => {
                // IP fetch failed — still log to sheet with whatever we have
                const visits = this.getStoredVisits();
                if (visits.length > 0) this.logToSheet(visits[visits.length - 1]);
            });
    }

    // ── Google Sheets: log a visit row ──────────────────────────────
    logToSheet(visitData) {
        if (!SHEET_CONFIG.enabled()) return; // sheet not configured yet

        const payload = {
            timestamp: visitData.timestamp,
            date: visitData.date,
            time: visitData.time,
            name: visitData.visitor_name || visitData.name || '',
            email: visitData.visitor_email || visitData.email || '',
            purpose: visitData.visitor_purpose || visitData.purpose || '',
            ip: visitData.ip || '',
            location: visitData.location || '',
            isMobile: visitData.isMobile,
            screenResolution: visitData.screenResolution || '',
            userAgent: visitData.userAgent || '',
            page: visitData.page || '',
            referrer: visitData.referrer || '',
            notify_me: visitData.notify_me || false,
            botcheck: ''   // honeypot — always empty from legit client
        };

        // IMPORTANT: Must use 'text/plain' not 'application/json'.
        // Apps Script cannot handle the CORS OPTIONS preflight that 'application/json' triggers,
        // so the POST would silently fail. text/plain skips the preflight entirely.
        fetch(SHEET_CONFIG.sheetScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        })
            .then(r => r.json())
            .then(res => {
                if (res.success && res.total !== undefined) {
                    // Update cached totals from the authoritative sheet count
                    if (!this.sheetTotals) this.sheetTotals = {};
                    this.sheetTotals.total = res.total;
                    this.updateDisplay();
                }
            })
            .catch(() => { /* sheet logging is best-effort — localStorage is the fallback */ });
    }

    // ── Google Sheets: fetch current total/today counts (GET) ───────
    fetchSheetTotals() {
        if (!SHEET_CONFIG.enabled()) return Promise.resolve(null);

        return fetch(SHEET_CONFIG.sheetScriptUrl)
            .then(r => r.json())
            .then(data => {
                this.sheetTotals = { total: data.total || 0, today: data.today || 0 };
            })
            .catch(() => {
                this.sheetTotals = null; // fall back to localStorage counts
            });
    }

    saveVisitData(visitData) {
        let visits = this.getStoredVisits();
        visits.push(visitData);
        if (visits.length > 1000) visits = visits.slice(-1000);
        localStorage.setItem(this.storageKey, JSON.stringify(visits));
        this.updateDisplay();
    }

    getStoredVisits() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    getTodayVisits() {
        const today = new Date().toLocaleDateString();
        return this.getStoredVisits().filter(v => v.date === today);
    }

    updateDisplay() {
        const visits = this.getStoredVisits();
        const todayVisits = this.getTodayVisits();

        // Prefer authoritative sheet totals; fall back to localStorage counts
        const totalCount = (this.sheetTotals && this.sheetTotals.total !== undefined)
            ? this.sheetTotals.total
            : visits.length;
        const todayCount = (this.sheetTotals && this.sheetTotals.today !== undefined)
            ? this.sheetTotals.today
            : todayVisits.length;

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set('totalVisitsCount', totalCount);
        set('todayVisitsCount', todayCount);
        set('totalVisits', todayCount);
        set('siteVisits', totalCount);

        const uniqueIPs = [...new Set(visits.map(v => v.ip))];
        set('uniqueVisitors', uniqueIPs.length);

        const detailedVisits = visits.filter(v => v.name || v.email);
        set('detailedVisits', detailedVisits.length);

        // Show a small indicator if sheet is connected
        const sheetStatus = document.getElementById('sheetStatus');
        if (sheetStatus) {
            if (SHEET_CONFIG.enabled() && this.sheetTotals) {
                sheetStatus.textContent = '🟢 Sheet connected';
                sheetStatus.style.color = '#2ecc71';
            } else if (SHEET_CONFIG.enabled()) {
                sheetStatus.textContent = '🟡 Connecting to sheet…';
                sheetStatus.style.color = '#f39c12';
            } else {
                sheetStatus.textContent = '⚪ Sheet not configured (localStorage only)';
                sheetStatus.style.color = '#888';
            }
        }

        this.updateVisitorList();
    }

    updateVisitorList() {
        const listElement = document.getElementById('visitorList');
        if (!listElement) return;

        const visits = this.getStoredVisits();
        if (visits.length === 0) {
            // Use textContent to prevent XSS
            listElement.textContent = '';
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No visitor data yet';
            listElement.appendChild(empty);
            return;
        }

        listElement.textContent = '';
        const recentVisits = visits.slice(-20).reverse();
        recentVisits.forEach(visit => {
            const div = document.createElement('div');
            div.className = 'visitor-item';

            [
                visit.time,
                visit.name || 'Anonymous',
                this.getLocationFromIP(visit),
                visit.isMobile ? 'Mobile' : 'Desktop'
            ].forEach(text => {
                const span = document.createElement('span');
                span.textContent = text; // textContent prevents XSS
                div.appendChild(span);
            });

            listElement.appendChild(div);
        });
    }

    getLocationFromIP(visit) {
        // #11: now uses real fetched location if available
        if (visit && visit.city && visit.city !== 'Unknown') {
            return `${visit.city}, ${visit.country || ''}`.trim().replace(/,\s*$/, '');
        }
        if (visit && visit.ip && visit.ip !== 'Fetching...' && visit.ip !== 'Unknown') {
            return visit.ip;
        }
        return 'Unknown';
    }

    showPopup() {
        setTimeout(() => {
            const popup = document.getElementById('visitorPopup');
            if (popup) popup.classList.add('active');
        }, 2000);
    }

    hidePopup() {
        const popup = document.getElementById('visitorPopup');
        if (popup) popup.classList.remove('active');
    }

    setupEventListeners() {
        const visitorForm = document.getElementById('visitorForm');
        if (visitorForm) {
            visitorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleVisitorForm(e.target);
            });
        }

        const skipBtn = document.querySelector('.skip-btn');
        if (skipBtn) skipBtn.addEventListener('click', () => this.hidePopup());

        const adminBtn = document.getElementById('adminAccessBtn');
        if (adminBtn) {
            // Show after 7 CONSECUTIVE clicks on the footer copyright text
            // within a 3-second window. Clicking anywhere else resets the counter.
            let clickCount = 0;
            let resetTimer = null;
            const targetEl = document.querySelector('.copyright') || document.querySelector('.footer');

            if (targetEl) {
                targetEl.style.cursor = 'default'; // no visual hint — it's a secret
                targetEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clickCount++;
                    clearTimeout(resetTimer);
                    resetTimer = setTimeout(() => { clickCount = 0; }, 3000);
                    if (clickCount >= 7) {
                        clickCount = 0;
                        adminBtn.style.display = 'flex';
                    }
                });

                // Any click OUTSIDE the target resets the counter
                document.addEventListener('click', () => {
                    clickCount = 0;
                    clearTimeout(resetTimer);
                });
            }
        }
    }

    handleVisitorForm(form) {
        const formData = new FormData(form);
        const visitorData = Object.fromEntries(formData.entries());

        // Merge form data into the latest stored visit
        let visits = this.getStoredVisits();
        let mergedVisit = {};
        if (visits.length > 0) {
            Object.assign(visits[visits.length - 1], visitorData);
            mergedVisit = visits[visits.length - 1];
            localStorage.setItem(this.storageKey, JSON.stringify(visits));
        }

        // Log enriched record (with name/email/purpose) to Google Sheet
        this.logToSheet({ ...mergedVisit, notify_me: formData.get('notify_me') === 'on' });

        // Send email via Web3forms only if user explicitly requested it
        if (formData.get('notify_me') === 'on') {
            this.sendDetailedNotification(visitorData);
        }

        this.hidePopup();
        this.updateDisplay();
    }

    sendNotification(visitData) {
        const emailData = {
            access_key: this.accessKey,
            subject: '🚀 New Website Visit Notification',
            from_name: 'Website Visitor System',
            message: this.formatNotificationMessage(visitData),
            botcheck: ''
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailData)
        }).catch(err => console.error('Notification error:', err));
    }

    sendDetailedNotification(visitorData) {
        const emailData = {
            access_key: this.accessKey,
            subject: '👤 Visitor Details Received',
            from_name: 'Website Visitor System',
            message: this.formatDetailedMessage(visitorData),
            botcheck: ''
        };

        fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailData)
        }).catch(err => console.error('Detailed notification error:', err));
    }

    formatNotificationMessage(visitData) {
        return `
📊 New Website Visit Alert!

🕒 Time:       ${visitData.time}
📅 Date:       ${visitData.date}
🌍 Page:       ${visitData.page}
🔗 Referrer:   ${visitData.referrer}
📱 Device:     ${visitData.isMobile ? 'Mobile' : 'Desktop'}
🖥️ Resolution: ${visitData.screenResolution}
🗣️ Language:   ${visitData.language}
📍 Timezone:   ${visitData.timezone}

Total Visits Today: ${this.getTodayVisits().length}
        `;
    }

    formatDetailedMessage(visitorData) {
        return `
👤 Visitor Details Submitted!

Name:    ${visitorData.visitor_name || 'Not provided'}
Email:   ${visitorData.visitor_email || 'Not provided'}
Purpose: ${visitorData.visitor_purpose || 'Not specified'}

🕒 Visit Time: ${new Date().toLocaleString()}
🌍 Page:       ${window.location.href}
📱 Device:     ${/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}

This visitor chose to notify you about their visit.
        `;
    }

    exportVisitorData() {
        const visits = this.getStoredVisits();
        const csv = this.convertToCSV(visits);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }
}

/* --- Dashboard helper functions --- */

function toggleDashboard() {
    const dashboard = document.getElementById('visitorDashboard');
    if (!dashboard) return;
    dashboard.classList.toggle('active');
    if (dashboard.classList.contains('active')) {
        const tracker = new VisitorTracker();
        tracker.updateDisplay();
    }
}

function refreshDashboard() {
    if (!window._trackerInstance) return;
    window._trackerInstance.fetchSheetTotals().finally(() => {
        window._trackerInstance.updateDisplay();
    });
}

function showAdminAccess() {
    const password = prompt('Enter admin password:');
    // ⚠️  Replace hardcoded passwords with a proper auth system
    if (password === 'samuel2024' || password === 'admin123') {
        toggleDashboard();
    } else {
        alert('Access denied');
    }
}

function exportVisitorData() {
    const tracker = new VisitorTracker();
    tracker.exportVisitorData();
}


/* -------------------------------------------------------
   SECTION 2 – PORTFOLIO & AGE CALCULATOR  (script.js)
   ------------------------------------------------------- */

// Handle URL routing: strip .html extension from address bar
if (window.history && window.history.replaceState && location.pathname.endsWith('.html')) {
    history.replaceState(null, '', location.pathname.slice(0, -5));
}

/* ---- Age Calculator globals ---- */
let intervalId;
let birthDate;
let nextBirthday;
let birthdayPopupShown = false;
let defaultDate;

function calculateAge() {
    const dobInput = document.getElementById('dob');
    if (!dobInput || !dobInput.value) {
        alert('Please enter your date of birth');
        return;
    }

    birthDate = new Date(dobInput.value);
    const now = new Date();

    if (birthDate > now) {
        alert('Birthday must be in the past');
        return;
    }

    if (intervalId) clearInterval(intervalId);

    const age = calculateDetailedDifference(birthDate, now);
    updateCard('current-age', age);

    nextBirthday = calculateNextBirthday(birthDate, now);
    updateCard('next-birthday', calculateDetailedDifference(now, nextBirthday));

    updateZodiacDisplay(getZodiacSign(birthDate));
    displayFunFact(birthDate);
    checkBirthday(birthDate, now);

    intervalId = setInterval(updateRealTime, 100);
}

function checkBirthday(birthDate, now) {
    birthdayPopupShown = false;
    if (birthDate.getMonth() === now.getMonth() && birthDate.getDate() === now.getDate()) {
        showBirthdayPopup();
    }
}

function showBirthdayPopup() {
    if (birthdayPopupShown) return;
    birthdayPopupShown = true;

    const birthdayFacts = [
        'Your birthday is one of the luckiest days of the year!',
        'People born on your birthday share it with famous inventors!',
        'Your birthday month has one of the highest birth rates!',
        'Famous leaders and artists share your birthday!',
        'Statistically, birthdays are the best day to start new habits!',
        'People born on your day often become successful entrepreneurs!',
        'Your birthday is a cosmic alignment of positive energy!',
        'More people search for birthday facts on this day than any other!',
        'Your birthday is scientifically proven to be awesome!',
        'This day in history marks many important discoveries!'
    ];

    const factEl = document.getElementById('birthdayFact');
    if (factEl) {
        factEl.textContent = `Did you know? ${birthdayFacts[Math.floor(Math.random() * birthdayFacts.length)]}`;
    }

    const popup = document.getElementById('birthdayPopup');
    if (popup) popup.classList.add('active');

    createConfetti();
}

function closePopup() {
    const popup = document.getElementById('birthdayPopup');
    if (popup) popup.classList.remove('active');
    // #8 FIX: clean up all confetti elements immediately on close
    document.querySelectorAll('.confetti').forEach(el => el.remove());
}

function createConfetti() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    for (let i = 0; i < 150; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (Math.random() * 3 + 2) + 's';
        el.style.width = (Math.random() * 10 + 5) + 'px';
        el.style.height = (Math.random() * 10 + 5) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
}

function updateRealTime() {
    const now = new Date();
    updateCard('current-age', calculateDetailedDifference(birthDate, now), true);
    updateCard('next-birthday', calculateDetailedDifference(now, nextBirthday), true);

    if (birthDate.getMonth() === now.getMonth() &&
        birthDate.getDate() === now.getDate() && !birthdayPopupShown) {
        showBirthdayPopup();
    }
}

function calculateDetailedDifference(startDate, endDate) {
    let ms = endDate - startDate;

    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    const minutes = Math.floor(seconds / 60);
    const remainSecs = seconds % 60;
    const hours = Math.floor(minutes / 60);
    const remainMins = minutes % 60;

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
    }
    if (months < 0) { months += 12; years--; }

    return { years, months, days, hours: hours % 24, minutes: remainMins, seconds: remainSecs, milliseconds };
}

function calculateNextBirthday(dob, now) {
    const yr = now.getFullYear();
    let next = new Date(yr, dob.getMonth(), dob.getDate(),
        dob.getHours(), dob.getMinutes(), dob.getSeconds());

    if (next < now) next.setFullYear(yr + 1);

    // Handle Feb 29 on non-leap years
    if (dob.getMonth() === 1 && dob.getDate() === 29) {
        const ny = next.getFullYear();
        if (!(ny % 4 === 0 && (ny % 100 !== 0 || ny % 400 === 0))) {
            next.setDate(28);
        }
    }
    return next;
}

function updateCard(cardId, data, animate = false) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const units = card.querySelectorAll('.time-unit');
    const keys = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];

    const prev = Array.from(units).map(u => u.querySelector('.unit-value').textContent);

    keys.forEach((key, i) => {
        if (units[i]) units[i].querySelector('.unit-value').textContent = data[key];
    });

    if (animate) {
        units.forEach((unit, i) => {
            const el = unit.querySelector('.unit-value');
            if (el.textContent !== prev[i]) {
                el.classList.add('counter-animation');
                setTimeout(() => el.classList.remove('counter-animation'), 500);
            }
        });
    }
}

function getZodiacSign(birthDate) {
    const m = birthDate.getMonth() + 1;
    const d = birthDate.getDate();
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { name: 'Aquarius', icon: 'fa-water', dates: 'Jan 20 - Feb 18' };
    if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return { name: 'Pisces', icon: 'fa-fish', dates: 'Feb 19 - Mar 20' };
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { name: 'Aries', icon: 'fa-ram', dates: 'Mar 21 - Apr 19' };
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { name: 'Taurus', icon: 'fa-bull', dates: 'Apr 20 - May 20' };
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { name: 'Gemini', icon: 'fa-users', dates: 'May 21 - Jun 20' };
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { name: 'Cancer', icon: 'fa-crab', dates: 'Jun 21 - Jul 22' };
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { name: 'Leo', icon: 'fa-crown', dates: 'Jul 23 - Aug 22' };
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { name: 'Virgo', icon: 'fa-wheat-alt', dates: 'Aug 23 - Sep 22' };
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { name: 'Libra', icon: 'fa-scale-balanced', dates: 'Sep 23 - Oct 22' };
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { name: 'Scorpio', icon: 'fa-scorpion', dates: 'Oct 23 - Nov 21' };
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { name: 'Sagittarius', icon: 'fa-bow-arrow', dates: 'Nov 22 - Dec 21' };
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { name: 'Capricorn', icon: 'fa-mountain', dates: 'Dec 22 - Jan 19' };
    return { name: 'Unknown', icon: 'fa-question', dates: '' };
}

function updateZodiacDisplay(zodiac) {
    const display = document.getElementById('zodiac-sign');
    if (!display) return;
    display.querySelector('.zodiac-icon').innerHTML = `<i class="fas ${zodiac.icon}"></i>`;
    display.querySelector('.zodiac-name').textContent = zodiac.name;
    display.querySelector('.zodiac-dates').textContent = zodiac.dates;
}

function displayFunFact(birthDate) {
    const funFacts = [
        'People born on this day share their birthday with famous inventors!',
        'On this day in history, a major scientific discovery was announced!',
        'Your birthday month has one of the highest birth rates of the year!',
        'Famous leaders and artists share your birthday month!',
        'Your birthstone is one of the most valuable gemstones!',
        'People born in your season are known for their creativity!',
        'Your zodiac sign is associated with great leadership qualities!',
        'Many famous musicians share your birthday month!',
        'Your birth flower symbolizes joy and happiness!',
        'People born on this day often become successful entrepreneurs!'
    ];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const fact = `Did you know? ${funFacts[Math.floor(Math.random() * funFacts.length)]} Specifically for ${monthNames[birthDate.getMonth()]} birthdays!`;

    const el = document.getElementById('fun-fact');
    if (el) el.textContent = fact;
}

/* ---- Date scrolling (age calculator) ---- */

function setupDateScrolling() {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return;

    dobInput.addEventListener('wheel', function (e) {
        e.preventDefault();
        adjustDate(Math.sign(e.deltaY), e);
    });

    const up = document.getElementById('scrollUp');
    const down = document.getElementById('scrollDown');
    if (up) up.addEventListener('click', e => adjustDate(-1, e));
    if (down) down.addEventListener('click', e => adjustDate(1, e));
}

function adjustDate(direction, event) {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return;

    let date = new Date(dobInput.value || defaultDate);

    if (event && event.shiftKey) date.setMonth(date.getMonth() - direction);
    else if (event && event.ctrlKey) date.setFullYear(date.getFullYear() - direction);
    else date.setDate(date.getDate() - direction);

    const pad = n => String(n).padStart(2, '0');
    dobInput.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

    calculateAge();
}

/* ---- Single DOMContentLoaded – merges all handlers ---- */

document.addEventListener('DOMContentLoaded', function () {

    /* Portfolio: menu toggle */
    const menuIcon = document.querySelector('#menu-icon');
    const navbar = document.querySelector('.navbar');

    if (menuIcon && navbar) {
        menuIcon.onclick = () => {
            menuIcon.classList.toggle('bx-x');
            navbar.classList.toggle('active');
        };
        window.addEventListener('scroll', () => {
            menuIcon.classList.remove('bx-x');
            navbar.classList.remove('active');
        });
    }

    /* Portfolio: Typed.js – deferred until Typed.js has loaded */
    function initTyped() {
        const typedTarget = document.querySelector('.typed-text');
        if (typedTarget && typeof Typed !== 'undefined') {
            new Typed('.typed-text', {
                strings: ['Mechanical Engineer.', 'Website Developer.', 'Designer.', 'Freelancer.', 'Coder.'],
                typeSpeed: 80,
                backSpeed: 70,
                backDelay: 1200,
                loop: true,
            });
        } else if (typedTarget) {
            // Typed.js not yet loaded – retry after a short delay
            setTimeout(initTyped, 300);
        }
    }
    initTyped();

    /* Visitor tracker – initialised once here.
       Only runs when the required DOM elements exist (main portfolio page). */
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    if (adminAccessBtn) {
        adminAccessBtn.style.display = 'none';

        // Expose dashboard globals
        window.toggleDashboard = toggleDashboard;
        window.showAdminAccess = showAdminAccess;
        window.exportVisitorData = exportVisitorData;
        window.refreshDashboard = refreshDashboard;

        window._trackerInstance = new VisitorTracker();
    }

    // -------------------------------------------------------
    // #14: Dark Mode Toggle
    // -------------------------------------------------------
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        updateThemeIcon(themeBtn, savedTheme);
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(themeBtn, next);
        });
    }

    function updateThemeIcon(btn, theme) {
        btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        btn.setAttribute('aria-label', btn.title);
    }

    // -------------------------------------------------------
    // #15: Cookie Consent Banner
    // -------------------------------------------------------
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.style.display = 'flex';
    }

    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            hideCookieBanner();
        });
    }
    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'rejected');
            hideCookieBanner();
        });
    }

    function hideCookieBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.style.animation = 'none';
            banner.style.transform = 'translateY(100%)';
            banner.style.transition = 'transform 0.3s ease';
            setTimeout(() => banner.remove(), 300);
        }
    }

    // -------------------------------------------------------
    // #12: Contact Form – async fetch with inline feedback
    // -------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('.submit-contact-btn');
            const feedback = document.getElementById('formFeedback');
            const formData = new FormData(contactForm);
            const jsonData = Object.fromEntries(formData.entries());

            if (submitBtn) { submitBtn.disabled = true; submitBtn.value = 'Sending…'; }
            if (feedback) { feedback.className = 'form-feedback'; feedback.textContent = ''; }

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(jsonData)
                });
                const data = await res.json();

                if (data.success) {
                    if (feedback) {
                        feedback.textContent = '✅ Message sent! Samuel will get back to you soon.';
                        feedback.className = 'form-feedback success';
                    }
                    contactForm.reset();
                } else {
                    throw new Error(data.message || 'Submission failed');
                }
            } catch (err) {
                if (feedback) {
                    feedback.textContent = '❌ Something went wrong. Please try again or email directly.';
                    feedback.className = 'form-feedback error';
                }
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.value = 'Send Message'; }
            }
        });
    }
});

/* ---- window.onload – age calculator default date ---- */

window.addEventListener('load', function () {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return; // not on age calculator page

    // Leave the field empty so the user enters their own date.
    // (A 30-year placeholder was removed — not everyone visiting is 30.)
    setupDateScrolling();
});