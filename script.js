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

//fun page
function calculateAge() {
            const dobInput = document.getElementById('dob').value;
            if (!dobInput) {
                alert("Please enter your date of birth");
                return;
            }
            
            const dob = new Date(dobInput);
            const now = new Date();
            
            if (dob > now) {
                alert("Birthday must be in the past");
                return;
            }
            
            // Calculate current age
            const age = calculateDetailedDifference(dob, now);
            updateCard('current-age', age);
            
            // Calculate next birthday
            const nextBday = calculateNextBirthday(dob, now);
            const nextBirthdayDiff = calculateDetailedDifference(now, nextBday);
            updateCard('next-birthday', nextBirthdayDiff);
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
            let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate(), 
                                        dob.getHours(), dob.getMinutes(), dob.getSeconds());
            
            // If birthday already passed this year, set to next year
            if (nextBirthday < now) {
                nextBirthday.setFullYear(currentYear + 1);
            }
            
            // Handle leap year (February 29)
            if (dob.getMonth() === 1 && dob.getDate() === 29) {
                // Check if next year is leap year
                const nextYear = nextBirthday.getFullYear();
                const isLeapYear = (nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0));
                
                if (!isLeapYear) {
                    nextBirthday.setDate(28);
                    nextBirthday.setMonth(1);
                }
            }
            
            return nextBirthday;
        }
        
        function updateCard(cardId, data) {
            const card = document.getElementById(cardId);
            const units = card.querySelectorAll('.time-unit');
            
            units[0].querySelector('.unit-value').textContent = data.years;
            units[1].querySelector('.unit-value').textContent = data.months;
            units[2].querySelector('.unit-value').textContent = data.days;
            units[3].querySelector('.unit-value').textContent = data.hours;
            units[4].querySelector('.unit-value').textContent = data.minutes;
            units[5].querySelector('.unit-value').textContent = data.seconds;
            units[6].querySelector('.unit-value').textContent = data.milliseconds;
        }
        
        // Set default date to 30 years ago for demo
        window.onload = function() {
            const defaultDate = new Date();
            defaultDate.setFullYear(defaultDate.getFullYear() - 30);
            defaultDate.setHours(12, 0, 0, 0);
            
            // Format to YYYY-MM-DDTHH:mm
            const year = defaultDate.getFullYear();
            const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const day = String(defaultDate.getDate()).padStart(2, '0');
            const hours = String(defaultDate.getHours()).padStart(2, '0');
            const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
            
            document.getElementById('dob').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        };