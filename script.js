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

class VisitorTracker {
    constructor() {
        this.apiUrl     = 'https://api.web3forms.com/submit';
        this.accessKey  = 'bc5139d2-b18d-46fa-85d4-4f5a11272896';
        this.storageKey = 'samuel_muli_visitor_data';
        this.sessionKey = 'visitor_session';
        this.initialize();
    }

    initialize() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            // NOTE: trackVisit() currently sends an automatic email on every new
            // session. Consider removing the sendNotification() call inside it
            // and only notifying on explicit form consent (see handleVisitorForm).
            this.trackVisit();
            sessionStorage.setItem(this.sessionKey, 'true');
            this.showPopup();
        }
        this.updateDisplay();
        this.setupEventListeners();
    }

    trackVisit() {
        const visitData = this.collectVisitData();
        this.saveVisitData(visitData);
        this.sendNotification(visitData);
    }

    collectVisitData() {
        return {
            timestamp:        new Date().toISOString(),
            date:             new Date().toLocaleDateString(),
            time:             new Date().toLocaleTimeString(),
            page:             window.location.href,
            referrer:         document.referrer || 'Direct',
            userAgent:        navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language:         navigator.language,
            timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
            isMobile:         /Mobi|Android/i.test(navigator.userAgent),
            ip:               'Pending...'
        };
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
        const visits      = this.getStoredVisits();
        const todayVisits = this.getTodayVisits();

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set('totalVisitsCount', visits.length);
        set('todayVisitsCount', todayVisits.length);
        set('totalVisits',      todayVisits.length);
        set('siteVisits',       visits.length);

        const uniqueIPs = [...new Set(visits.map(v => v.ip))];
        set('uniqueVisitors', uniqueIPs.length);

        const detailedVisits = visits.filter(v => v.name || v.email);
        set('detailedVisits', detailedVisits.length);

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
                this.getLocationFromIP(visit.ip),
                visit.isMobile ? 'Mobile' : 'Desktop'
            ].forEach(text => {
                const span = document.createElement('span');
                span.textContent = text; // textContent prevents XSS
                div.appendChild(span);
            });

            listElement.appendChild(div);
        });
    }

    getLocationFromIP(ip) {
        if (ip === 'Pending...') return 'Unknown';
        return 'Nairobi, KE'; // placeholder – replace with real IP geo API
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
            let clickCount = 0;
            document.addEventListener('click', () => {
                clickCount++;
                if (clickCount === 10) adminBtn.style.display = 'flex';
            });
        }
    }

    handleVisitorForm(form) {
        const formData   = new FormData(form);
        const visitorData = Object.fromEntries(formData.entries());

        let visits = this.getStoredVisits();
        if (visits.length > 0) {
            Object.assign(visits[visits.length - 1], visitorData);
            localStorage.setItem(this.storageKey, JSON.stringify(visits));
        }

        if (formData.get('notify_me') === 'on') {
            this.sendDetailedNotification(visitorData);
        }

        this.hidePopup();
        this.updateDisplay();
    }

    sendNotification(visitData) {
        const emailData = {
            access_key: this.accessKey,
            subject:    '🚀 New Website Visit Notification',
            from_name:  'Website Visitor System',
            message:    this.formatNotificationMessage(visitData),
            botcheck:   ''
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
            subject:    '👤 Visitor Details Received',
            from_name:  'Website Visitor System',
            message:    this.formatDetailedMessage(visitorData),
            botcheck:   ''
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

Name:    ${visitorData.visitor_name    || 'Not provided'}
Email:   ${visitorData.visitor_email   || 'Not provided'}
Purpose: ${visitorData.visitor_purpose || 'Not specified'}

🕒 Visit Time: ${new Date().toLocaleString()}
🌍 Page:       ${window.location.href}
📱 Device:     ${/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}

This visitor chose to notify you about their visit.
        `;
    }

    exportVisitorData() {
        const visits = this.getStoredVisits();
        const csv    = this.convertToCSV(visits);
        const blob   = new Blob([csv], { type: 'text/csv' });
        const url    = window.URL.createObjectURL(blob);
        const a      = document.createElement('a');
        a.href       = url;
        a.download   = `visitor-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        const rows    = data.map(row =>
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
}

function createConfetti() {
    const colors    = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    for (let i = 0; i < 150; i++) {
        const el       = document.createElement('div');
        el.className   = 'confetti';
        el.style.left  = Math.random() * 100 + 'vw';
        el.style.backgroundColor   = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (Math.random() * 3 + 2) + 's';
        el.style.width  = (Math.random() * 10 + 5) + 'px';
        el.style.height = (Math.random() * 10 + 5) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
}

function updateRealTime() {
    const now = new Date();
    updateCard('current-age',   calculateDetailedDifference(birthDate, now), true);
    updateCard('next-birthday', calculateDetailedDifference(now, nextBirthday), true);

    if (birthDate.getMonth() === now.getMonth() &&
        birthDate.getDate()  === now.getDate()  && !birthdayPopupShown) {
        showBirthdayPopup();
    }
}

function calculateDetailedDifference(startDate, endDate) {
    let ms = endDate - startDate;

    const seconds     = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    const minutes     = Math.floor(seconds / 60);
    const remainSecs  = seconds % 60;
    const hours       = Math.floor(minutes / 60);
    const remainMins  = minutes % 60;

    let years  = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth()    - startDate.getMonth();
    let days   = endDate.getDate()     - startDate.getDate();

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
    const keys  = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];

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
    if ((m === 1  && d >= 20) || (m === 2  && d <= 18)) return { name: 'Aquarius',    icon: 'fa-water',          dates: 'Jan 20 - Feb 18' };
    if ((m === 2  && d >= 19) || (m === 3  && d <= 20)) return { name: 'Pisces',       icon: 'fa-fish',           dates: 'Feb 19 - Mar 20' };
    if ((m === 3  && d >= 21) || (m === 4  && d <= 19)) return { name: 'Aries',        icon: 'fa-ram',            dates: 'Mar 21 - Apr 19' };
    if ((m === 4  && d >= 20) || (m === 5  && d <= 20)) return { name: 'Taurus',       icon: 'fa-bull',           dates: 'Apr 20 - May 20' };
    if ((m === 5  && d >= 21) || (m === 6  && d <= 20)) return { name: 'Gemini',       icon: 'fa-users',          dates: 'May 21 - Jun 20' };
    if ((m === 6  && d >= 21) || (m === 7  && d <= 22)) return { name: 'Cancer',       icon: 'fa-crab',           dates: 'Jun 21 - Jul 22' };
    if ((m === 7  && d >= 23) || (m === 8  && d <= 22)) return { name: 'Leo',          icon: 'fa-crown',          dates: 'Jul 23 - Aug 22' };
    if ((m === 8  && d >= 23) || (m === 9  && d <= 22)) return { name: 'Virgo',        icon: 'fa-wheat-alt',      dates: 'Aug 23 - Sep 22' };
    if ((m === 9  && d >= 23) || (m === 10 && d <= 22)) return { name: 'Libra',        icon: 'fa-scale-balanced', dates: 'Sep 23 - Oct 22' };
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { name: 'Scorpio',      icon: 'fa-scorpion',       dates: 'Oct 23 - Nov 21' };
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { name: 'Sagittarius',  icon: 'fa-bow-arrow',      dates: 'Nov 22 - Dec 21' };
    if ((m === 12 && d >= 22) || (m === 1  && d <= 19)) return { name: 'Capricorn',    icon: 'fa-mountain',       dates: 'Dec 22 - Jan 19' };
    return { name: 'Unknown', icon: 'fa-question', dates: '' };
}

function updateZodiacDisplay(zodiac) {
    const display = document.getElementById('zodiac-sign');
    if (!display) return;
    display.querySelector('.zodiac-icon').innerHTML = `<i class="fas ${zodiac.icon}"></i>`;
    display.querySelector('.zodiac-name').textContent  = zodiac.name;
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

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
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

    const up   = document.getElementById('scrollUp');
    const down = document.getElementById('scrollDown');
    if (up)   up.addEventListener('click',   e => adjustDate(-1, e));
    if (down) down.addEventListener('click', e => adjustDate(1, e));
}

function adjustDate(direction, event) {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return;

    let date = new Date(dobInput.value || defaultDate);

    if (event && event.shiftKey)     date.setMonth(date.getMonth()         - direction);
    else if (event && event.ctrlKey) date.setFullYear(date.getFullYear()   - direction);
    else                              date.setDate(date.getDate()           - direction);

    const pad = n => String(n).padStart(2, '0');
    dobInput.value = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

    calculateAge();
}

/* ---- Single DOMContentLoaded – merges all handlers ---- */

document.addEventListener('DOMContentLoaded', function () {

    /* Portfolio: menu toggle */
    const menuIcon = document.querySelector('#menu-icon');
    const navbar   = document.querySelector('.navbar');

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

    /* Portfolio: Typed.js */
    const typedTarget = document.querySelector('.typed-text');
    if (typedTarget && typeof Typed !== 'undefined') {
        new Typed('.typed-text', {
            strings:   ['Mechanical Engineer.', 'Website Developer.', 'Designer.', 'Freelancer.', 'Coder.'],
            typeSpeed:  80,
            backSpeed:  70,
            backDelay: 1200,
            loop:      true,
        });
    }

    /* Visitor tracker – initialised once here.
       Only runs when the required DOM elements exist (main portfolio page). */
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    if (adminAccessBtn) {
        adminAccessBtn.style.display = 'none';

        // Expose dashboard globals
        window.toggleDashboard  = toggleDashboard;
        window.showAdminAccess  = showAdminAccess;
        window.exportVisitorData = exportVisitorData;

        const tracker = new VisitorTracker();

        // Add Stats button to navbar (if not already present)
        if (navbar && !document.querySelector('.visitor-stats-btn')) {
            const statsBtn       = document.createElement('a');
            statsBtn.href        = '#';
            statsBtn.className   = 'visitor-stats-btn';
            statsBtn.innerHTML   = '<i class="fas fa-chart-bar"></i> Stats';
            statsBtn.onclick     = (e) => { e.preventDefault(); toggleDashboard(); };
            navbar.appendChild(statsBtn);
        }
    }
});

/* ---- window.onload – age calculator default date ---- */

window.addEventListener('load', function () {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return; // not on age calculator page

    defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 30);
    defaultDate.setHours(12, 0, 0, 0);

    const pad = n => String(n).padStart(2, '0');
    dobInput.value = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth()+1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

    setupDateScrolling();
});