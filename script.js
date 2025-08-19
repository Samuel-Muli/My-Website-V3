document.addEventListener('DOMContentLoaded', function () {
    // Menu Toggle Fix
    let menu = document.querySelector('#menu-icon');
    let navbar = document.querySelector('.navbar');

    menu.onclick = () => {
        menu.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    }

    window.onscroll = () => {
        menu.classList.remove('bx-x');
        navbar.classList.remove('active');
    }

    // Typed.js Initialization Fix
    const typed = new Typed('.typed-text', {
        strings: ['Mechanical Engineer.', 'Website Developer.', 'Designer.', 'Freelancer.', 'Coder.'],
        typeSpeed: 80,
        backSpeed: 70,
        backDelay: 1200,
        loop: true,
    });
});
// Handle URL routing to remove .html extension
if (window.history && window.history.replaceState && location.pathname.endsWith('.html')) {
    history.replaceState(null, '', location.pathname.slice(0, -5));
}



//fun page
// Global variables for real-time updates
let intervalId;
let birthDate;
let nextBirthday;
let birthdayPopupShown = false;

function calculateAge() {
    const dobInput = document.getElementById('dob').value;
    if (!dobInput) {
        alert("Please enter your date of birth");
        return;
    }

    birthDate = new Date(dobInput);
    const now = new Date();

    if (birthDate > now) {
        alert("Birthday must be in the past");
        return;
    }

    // Clear any existing interval
    if (intervalId) {
        clearInterval(intervalId);
    }

    // Calculate current age
    const age = calculateDetailedDifference(birthDate, now);
    updateCard('current-age', age);

    // Calculate next birthday
    nextBirthday = calculateNextBirthday(birthDate, now);
    const nextBirthdayDiff = calculateDetailedDifference(now, nextBirthday);
    updateCard('next-birthday', nextBirthdayDiff);

    // Calculate and display zodiac sign
    const zodiac = getZodiacSign(birthDate);
    updateZodiacDisplay(zodiac);

    // Display fun fact
    displayFunFact(birthDate);

    // Check if today is birthday
    checkBirthday(birthDate, now);

    // Start real-time updates
    intervalId = setInterval(() => {
        updateRealTime();
    }, 100);
}

function checkBirthday(birthDate, now) {
    // Reset flag if date changed
    birthdayPopupShown = false;

    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Check if month and day match
    if (birthMonth === currentMonth && birthDay === currentDay) {
        showBirthdayPopup();
    }
}

function showBirthdayPopup() {
    if (birthdayPopupShown) return;

    birthdayPopupShown = true;

    // Birthday facts
    const birthdayFacts = [
        "Your birthday is one of the luckiest days of the year!",
        "People born on your birthday share it with famous inventors!",
        "Your birthday month has one of the highest birth rates!",
        "Famous leaders and artists share your birthday!",
        "Statistically, birthdays are the best day to start new habits!",
        "People born on your day often become successful entrepreneurs!",
        "Your birthday is a cosmic alignment of positive energy!",
        "More people search for birthday facts on this day than any other!",
        "Your birthday is scientifically proven to be awesome!",
        "This day in history marks many important discoveries!"
    ];

    // Select a random fact
    const randomFact = birthdayFacts[Math.floor(Math.random() * birthdayFacts.length)];
    document.getElementById('birthdayFact').textContent = `Did you know? ${randomFact}`;

    // Show popup
    document.getElementById('birthdayPopup').classList.add('active');

    // Create confetti
    createConfetti();
}

function closePopup() {
    document.getElementById('birthdayPopup').classList.remove('active');
}

function createConfetti() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    const container = document.body;

    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        container.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function updateRealTime() {
    const now = new Date();

    // Update current age
    const age = calculateDetailedDifference(birthDate, now);
    updateCard('current-age', age, true);

    // Update next birthday countdown
    const nextBirthdayDiff = calculateDetailedDifference(now, nextBirthday);
    updateCard('next-birthday', nextBirthdayDiff, true);

    // Check if it became the birthday during real-time updates
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    if (birthMonth === currentMonth && birthDay === currentDay && !birthdayPopupShown) {
        showBirthdayPopup();
    }
}

function calculateDetailedDifference(startDate, endDate) {
    let milliseconds = endDate - startDate;

    const seconds = Math.floor(milliseconds / 1000);
    milliseconds %= 1000;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Calculate years, months, and days
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust for negative months/days
    if (days < 0) {
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
    }

    if (months < 0) {
        months += 12;
        years--;
    }

    return {
        years,
        months,
        days,
        hours: hours % 24,
        minutes: remainingMinutes,
        seconds: remainingSeconds,
        milliseconds
    };
}

function calculateNextBirthday(dob, now) {
    const currentYear = now.getFullYear();
    let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate(),
        dob.getHours(), dob.getMinutes(), dob.getSeconds());

    // If birthday already passed this year, set to next year
    if (nextBday < now) {
        nextBday.setFullYear(currentYear + 1);
    }

    // Handle leap year (February 29)
    if (dob.getMonth() === 1 && dob.getDate() === 29) {
        // Check if next year is leap year
        const nextYear = nextBday.getFullYear();
        const isLeapYear = (nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0));

        if (!isLeapYear) {
            nextBday.setDate(28);
            nextBday.setMonth(1);
        }
    }

    return nextBday;
}

function updateCard(cardId, data, animate = false) {
    const card = document.getElementById(cardId);
    const units = card.querySelectorAll('.time-unit');

    // Get current values for animation
    const currentValues = Array.from(units).map(unit =>
        unit.querySelector('.unit-value').textContent
    );

    // Update values
    units[0].querySelector('.unit-value').textContent = data.years;
    units[1].querySelector('.unit-value').textContent = data.months;
    units[2].querySelector('.unit-value').textContent = data.days;
    units[3].querySelector('.unit-value').textContent = data.hours;
    units[4].querySelector('.unit-value').textContent = data.minutes;
    units[5].querySelector('.unit-value').textContent = data.seconds;
    units[6].querySelector('.unit-value').textContent = data.milliseconds;

    // Add animation if values changed
    if (animate) {
        units.forEach((unit, index) => {
            const valueElement = unit.querySelector('.unit-value');
            if (valueElement.textContent !== currentValues[index]) {
                valueElement.classList.add('counter-animation');
                setTimeout(() => {
                    valueElement.classList.remove('counter-animation');
                }, 500);
            }
        });
    }
}

function getZodiacSign(birthDate) {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return {
        name: "Aquarius",
        icon: "fa-water",
        dates: "Jan 20 - Feb 18"
    };
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return {
        name: "Pisces",
        icon: "fa-fish",
        dates: "Feb 19 - Mar 20"
    };
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return {
        name: "Aries",
        icon: "fa-ram",
        dates: "Mar 21 - Apr 19"
    };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return {
        name: "Taurus",
        icon: "fa-bull",
        dates: "Apr 20 - May 20"
    };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return {
        name: "Gemini",
        icon: "fa-users",
        dates: "May 21 - Jun 20"
    };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return {
        name: "Cancer",
        icon: "fa-crab",
        dates: "Jun 21 - Jul 22"
    };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return {
        name: "Leo",
        icon: "fa-crown",
        dates: "Jul 23 - Aug 22"
    };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return {
        name: "Virgo",
        icon: "fa-wheat-alt",
        dates: "Aug 23 - Sep 22"
    };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return {
        name: "Libra",
        icon: "fa-scale-balanced",
        dates: "Sep 23 - Oct 22"
    };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return {
        name: "Scorpio",
        icon: "fa-scorpion",
        dates: "Oct 23 - Nov 21"
    };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return {
        name: "Sagittarius",
        icon: "fa-bow-arrow",
        dates: "Nov 22 - Dec 21"
    };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return {
        name: "Capricorn",
        icon: "fa-mountain",
        dates: "Dec 22 - Jan 19"
    };

    return {
        name: "Unknown",
        icon: "fa-question",
        dates: ""
    };
}

function updateZodiacDisplay(zodiac) {
    const zodiacDisplay = document.getElementById('zodiac-sign');
    zodiacDisplay.querySelector('.zodiac-icon').innerHTML = `<i class="fas ${zodiac.icon}"></i>`;
    zodiacDisplay.querySelector('.zodiac-name').textContent = zodiac.name;
    zodiacDisplay.querySelector('.zodiac-dates').textContent = zodiac.dates;
}

function displayFunFact(birthDate) {
    const funFacts = [
        "People born on this day share their birthday with famous inventors!",
        "On this day in history, a major scientific discovery was announced!",
        "Your birthday month has one of the highest birth rates of the year!",
        "Famous leaders and artists share your birthday month!",
        "Your birthstone is one of the most valuable gemstones!",
        "People born in your season are known for their creativity!",
        "Your zodiac sign is associated with great leadership qualities!",
        "Many famous musicians share your birthday month!",
        "Your birth flower symbolizes joy and happiness!",
        "People born on this day often become successful entrepreneurs!"
    ];

    // Get a random fact
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

    // Get birth month name
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[birthDate.getMonth()];

    // Create fact with personalization
    const fact = `Did you know? ${randomFact} Specifically for ${monthName} birthdays!`;

    document.getElementById('fun-fact').textContent = fact;
}

// Date scrolling functionality
function setupDateScrolling() {
    const dobInput = document.getElementById('dob');

    // Add mouse wheel event
    dobInput.addEventListener('wheel', function (e) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        adjustDate(delta);
    });

    // Add button events
    document.getElementById('scrollUp').addEventListener('click', () => adjustDate(-1));
    document.getElementById('scrollDown').addEventListener('click', () => adjustDate(1));
}

function adjustDate(direction) {
    const dobInput = document.getElementById('dob');
    let date = new Date(dobInput.value || defaultDate);

    // Adjust based on key modifiers
    if (event && event.shiftKey) {
        date.setMonth(date.getMonth() - direction);
    } else if (event && event.ctrlKey) {
        date.setFullYear(date.getFullYear() - direction);
    } else {
        date.setDate(date.getDate() - direction);
    }

    // Format the date to YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    dobInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Recalculate age
    calculateAge();
}

// Global default date
let defaultDate;

// Set default date to 30 years ago for demo
window.onload = function () {
    defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 30);
    defaultDate.setHours(12, 0, 0, 0);

    // Format to YYYY-MM-DDTHH:mm
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    const hours = String(defaultDate.getHours()).padStart(2, '0');
    const minutes = String(defaultDate.getMinutes()).padStart(2, '0');

    document.getElementById('dob').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Setup scrolling functionality
    setupDateScrolling();

    // Removed auto-calculate on page load
};