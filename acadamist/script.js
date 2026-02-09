// Initialize Socket.io connection (with fallback)
let socket = null;
let useBackend = false;

// Check if Socket.io is available
if (typeof io !== 'undefined') {
    try {
        socket = io();
        useBackend = true;

        socket.on('connect', () => {
            console.log('✅ Connected to server - Real-time sync enabled');
            useBackend = true;
        });

        socket.on('disconnect', () => {
            console.log('⚠️ Disconnected from server - Using local storage');
            useBackend = false;
        });

        socket.on('connect_error', () => {
            console.log('⚠️ Backend not available - Using local storage mode');
            useBackend = false;
        });
    } catch (e) {
        console.log('⚠️ Socket.io not available - Using local storage mode');
        useBackend = false;
    }
} else {
    console.log('ℹ️ Running in offline mode - Install Node.js and run "npm start" for real-time sync');
    useBackend = false;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Toast Notification Logic ---
    const toast = document.createElement('div');
    toast.className = 'toast-container';
    toast.innerHTML = '<span class="toast-icon">✨</span><span class="toast-message">Resource Will Update Soon</span>';
    if (document.body) { // Safety check for document.body
        document.body.appendChild(toast);
    }

    function showToast(message) {
        if (!toast) return; // Safety check for toast element
        if (message) {
            const toastMessageEl = toast.querySelector('.toast-message');
            if (toastMessageEl) toastMessageEl.textContent = message;
        }
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    // Global interceptor for placeholder links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href) {
            const href = link.getAttribute('href') || '';
            // Check if link points to example.com, has a placeholder href, or is just #
            if (href.includes('example.com') || href === '#' || href === '') {
                e.preventDefault();
                showToast('Resource Will Update Soon');
            }
        }
    });

    // --- Calendar Logic ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthTitle = document.querySelector('.month-title');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    let currentDate = new Date();

    // Event Storage
    let calendarEvents = {};

    function getEventKey(date, monthName, year) {
        return `${monthName}-${date}-${year}`;
    }

    function initCalendar() {
        if (!calendarGrid || !monthTitle || !prevMonthBtn || !nextMonthBtn) return;

        // Load calendar events (from backend or localStorage)
        if (useBackend) {
            fetch('/api/events')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(events => {
                    calendarEvents = events;
                    renderCalendar(currentDate);
                })
                .catch(error => {
                    console.error('Error fetching events from backend:', error);
                    console.log('Backend not available, using localStorage');
                    calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
                    renderCalendar(currentDate);
                });

            // Listen for real-time calendar updates
            if (socket) {
                socket.on('calendar-update', (updatedEvents) => {
                    console.log('Calendar updated from server');
                    calendarEvents = updatedEvents;
                    renderCalendar(currentDate);
                    if (currentOpenDateKey) {
                        renderModalEvents();
                    }
                });
            }
        } else {
            // Load from localStorage
            calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
            renderCalendar(currentDate);
        }

        prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
        nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
    }

    function saveEventsLocal() {
        if (!useBackend) {
            try {
                localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
        }
    }

    // --- Modal Logic ---
    const dayModal = document.getElementById('dayModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalDate = document.getElementById('modalDate');
    const modalEvents = document.getElementById('modalEvents');
    const addEventBtn = document.getElementById('addEventBtn');

    let currentOpenDateKey = null;
    let editingEventIndex = null; // Track if we are editing an event

    // --- Add Event Modal Elements ---
    const addEventModal = document.getElementById('addEventModal');
    const closeAddEventModalBtn = document.getElementById('closeAddEventModal');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const saveEventBtn = document.getElementById('saveEventBtn');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDescInput = document.getElementById('eventDesc');

    // Time picker wheels
    const hourWheel = document.getElementById('hourWheel');
    const minuteWheel = document.getElementById('minuteWheel');
    const ampmWheel = document.getElementById('ampmWheel');

    function openModal(date, day, monthName, year) {
        if (!modalDate || !dayModal) return;
        const fullDateStr = `${monthName} ${day}, ${year}`;
        modalDate.textContent = fullDateStr;
        currentOpenDateKey = getEventKey(day, monthName, year);
        renderModalEvents();
        dayModal.classList.add('active');
    }

    function renderModalEvents() {
        if (!modalEvents) return;
        const events = calendarEvents[currentOpenDateKey] || [];
        modalEvents.innerHTML = '';

        if (events.length === 0) {
            modalEvents.innerHTML = `<p class="empty-state">No events scheduled for this day.</p>`;
        } else {
            events.forEach((event, index) => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event-item';
                eventEl.style.cssText = 'background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; position: relative; border: 1px solid rgba(255,255,255,0.1);';

                const actionsHtml = `
                    <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
                        <button class="edit-event-btn" data-index="${index}" style="background: rgba(255, 165, 0, 0.2); border: none; color: orange; border-radius: 4px; cursor: pointer; padding: 4px 8px; font-size: 0.8rem;">✏️</button>
                        <button class="delete-event-btn" data-index="${index}" style="background: rgba(255, 50, 50, 0.2); border: none; color: #ff6b6b; border-radius: 4px; cursor: pointer; padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
                    </div>
                `;

                eventEl.innerHTML = `
                    <h3 style="margin-bottom:0.25rem; font-size: 1.1rem; padding-right: 60px;">${event.title || 'Untitled Event'}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem;">${event.time || 'No Time'}</p>
                    <p style="font-size: 0.9rem;">${event.desc || 'No description'}</p>
                    ${actionsHtml}
                `;
                modalEvents.appendChild(eventEl);
            });

            // Attach Listeners
            document.querySelectorAll('.delete-event-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.closest('button')?.dataset.index;
                    if (index !== undefined) deleteEvent(parseInt(index, 10));
                });
            });

            document.querySelectorAll('.edit-event-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = e.target.closest('button')?.dataset.index;
                    if (index !== undefined) editEvent(parseInt(index, 10));
                });
            });
        }
    }

    function deleteEvent(index) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        if (!currentOpenDateKey || !calendarEvents[currentOpenDateKey]) {
            console.error('No date key or events found for deletion.');
            return;
        }

        if (useBackend) {
            fetch(`/api/events/${currentOpenDateKey}/${index}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => console.log('Event deleted successfully'))
                .catch(error => { console.error('Error deleting event:', error); alert('Failed to delete event.'); });
        } else {
            if (calendarEvents[currentOpenDateKey]) {
                calendarEvents[currentOpenDateKey].splice(index, 1);
                if (calendarEvents[currentOpenDateKey].length === 0) delete calendarEvents[currentOpenDateKey];
                saveEventsLocal();
                renderModalEvents();
                renderCalendar(currentDate);
            }
        }
    }

    function editEvent(index) {
        if (!currentOpenDateKey || !calendarEvents[currentOpenDateKey] || !calendarEvents[currentOpenDateKey][index]) {
            console.error('Event not found for editing.');
            return;
        }
        const event = calendarEvents[currentOpenDateKey][index];
        if (!event || !addEventModal || !eventTitleInput || !eventDescInput || !saveEventBtn) return;
        editingEventIndex = index;
        eventTitleInput.value = event.title || '';
        eventDescInput.value = event.desc || '';
        const modalTitle = addEventModal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = 'Edit Event';
        saveEventBtn.textContent = 'Update Event';
        initTimePicker(event.time);
        addEventModal.classList.add('active');
    }

    // Initialize time picker
    function initTimePicker(initialTime = null) {
        if (!hourWheel || !minuteWheel || !ampmWheel) return;
        hourWheel.innerHTML = '';
        minuteWheel.innerHTML = '';
        ampmWheel.innerHTML = '';

        const addPadding = (wheel) => {
            for (let i = 0; i < 3; i++) {
                const padding = document.createElement('div');
                padding.className = 'time-picker-padding';
                wheel.appendChild(padding);
            }
        };

        addPadding(hourWheel);
        addPadding(minuteWheel);
        addPadding(ampmWheel);

        for (let i = 1; i <= 12; i++) {
            const item = document.createElement('div');
            item.className = 'time-picker-item';
            item.textContent = i.toString().padStart(2, '0');
            item.dataset.value = i.toString(); // Store as string
            hourWheel.appendChild(item);
        }

        for (let i = 0; i < 60; i += 5) {
            const item = document.createElement('div');
            item.className = 'time-picker-item';
            item.textContent = i.toString().padStart(2, '0');
            item.dataset.value = i.toString(); // Store as string
            minuteWheel.appendChild(item);
        }

        ['AM', 'PM'].forEach(period => {
            const item = document.createElement('div');
            item.className = 'time-picker-item';
            item.textContent = period;
            item.dataset.value = period;
            ampmWheel.appendChild(item);
        });

        addPadding(hourWheel);
        addPadding(minuteWheel);
        addPadding(ampmWheel);

        let hours, minutes, ampm;
        if (initialTime) {
            const [timePart, periodPart] = initialTime.split(' ');
            const [h, m] = timePart.split(':');
            hours = parseInt(h, 10);
            minutes = parseInt(m, 10);
            ampm = periodPart;
            minutes = Math.round(minutes / 5) * 5;
            if (minutes === 60) { minutes = 0; hours = hours === 12 ? 1 : hours + 1; }
        } else {
            const now = new Date();
            hours = now.getHours();
            minutes = Math.round(now.getMinutes() / 5) * 5;
            if (minutes === 60) { minutes = 0; hours += 1; }
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
        }

        setTimeout(() => {
            scrollToValue(hourWheel, hours.toString());
            scrollToValue(minuteWheel, minutes.toString());
            scrollToValue(ampmWheel, ampm);
        }, 100);

        setupWheelScroll(hourWheel);
        setupWheelScroll(minuteWheel);
        setupWheelScroll(ampmWheel);
    }

    function scrollToValue(wheel, value) {
        if (!wheel) return;
        const items = wheel.querySelectorAll('.time-picker-item');
        if (items.length === 0) return;
        const itemHeight = items[0].offsetHeight || 45; // Fallback height
        let targetIndex = -1;
        items.forEach((item, index) => {
            if (item.dataset.value === value) {
                targetIndex = index;
            }
        });
        if (targetIndex !== -1) {
            wheel.scrollTop = targetIndex * itemHeight;
        }
    }

    function setupWheelScroll(wheel) {
        if (!wheel) return;
        let scrollTimeout;
        let touchStartY = 0;
        let touchEndY = 0;

        function getItemHeight() {
            const item = wheel.querySelector('.time-picker-item');
            return item ? item.offsetHeight : 45;
        }

        wheel.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const itemHeight = getItemHeight();
                const scrollTop = wheel.scrollTop;
                const index = Math.round(scrollTop / itemHeight);
                wheel.scrollTop = index * itemHeight;
                updateActiveItem(wheel);
            }, 100);
            updateActiveItem(wheel);
        });

        wheel.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('time-picker-item')) {
                const items = Array.from(wheel.querySelectorAll('.time-picker-item'));
                const index = items.indexOf(e.target);
                const itemHeight = getItemHeight();
                wheel.scrollTop = index * itemHeight;
            }
        });

        wheel.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        wheel.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                touchEndY = e.changedTouches[0].clientY;
            }
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const itemHeight = getItemHeight();
                const scrollTop = wheel.scrollTop;
                const index = Math.round(scrollTop / itemHeight);
                wheel.scrollTop = index * itemHeight;
                updateActiveItem(wheel);
            }, 150);
        }, { passive: true });
    }

    function updateActiveItem(wheel) {
        if (!wheel) return;
        const items = wheel.querySelectorAll('.time-picker-item');
        if (items.length === 0) return;
        const itemHeight = items[0].offsetHeight || 45;
        const scrollTop = wheel.scrollTop;
        const centerIndex = Math.round(scrollTop / itemHeight);
        items.forEach((item, index) => {
            if (index === centerIndex) item.classList.add('active');
            else item.classList.remove('active');
        });
    }

    function getSelectedTime() {
        const hour = hourWheel?.querySelector('.active')?.dataset.value || '12';
        const minute = minuteWheel?.querySelector('.active')?.dataset.value || '00';
        const ampm = ampmWheel?.querySelector('.active')?.dataset.value || 'AM';
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`;
    }

    if (addEventBtn) {
        addEventBtn.onclick = () => {
            editingEventIndex = null;
            if (addEventModal && saveEventBtn && eventTitleInput && eventDescInput) {
                const modalTitle = addEventModal.querySelector('h2');
                if (modalTitle) modalTitle.textContent = 'Add New Event';
                saveEventBtn.textContent = 'Save Event';
                eventTitleInput.value = '';
                eventDescInput.value = '';
                initTimePicker();
                addEventModal.classList.add('active');
            }
        };
    }

    if (closeAddEventModalBtn) closeAddEventModalBtn.onclick = () => { if (addEventModal) addEventModal.classList.remove('active'); };
    if (cancelEventBtn) cancelEventBtn.onclick = () => { if (addEventModal) addEventModal.classList.remove('active'); };

    if (saveEventBtn) {
        saveEventBtn.onclick = () => {
            if (!eventTitleInput || !eventDescInput || !addEventModal || !currentOpenDateKey) return;
            const title = eventTitleInput.value.trim();
            if (!title) { alert('Please enter an event name'); return; }
            const time = getSelectedTime();
            const desc = eventDescInput.value.trim() || 'No description';
            const event = { title, time, desc };

            if (useBackend) {
                const method = editingEventIndex !== null ? 'PUT' : 'POST';
                const urlSource = editingEventIndex !== null ? `/api/events/${currentOpenDateKey}/${editingEventIndex}` : '/api/events';
                const bodyData = editingEventIndex !== null ? { event } : { key: currentOpenDateKey, event };
                fetch(urlSource, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                })
                    .then(res => {
                        if (!res.ok) throw new Error('Network response was not ok');
                        return res.json();
                    })
                    .then(() => { console.log('Event saved'); addEventModal.classList.remove('active'); })
                    .catch(err => { console.error(err); alert('Failed to save event.'); });
            } else {
                if (!calendarEvents[currentOpenDateKey]) calendarEvents[currentOpenDateKey] = [];
                if (editingEventIndex !== null) calendarEvents[currentOpenDateKey][editingEventIndex] = event;
                else calendarEvents[currentOpenDateKey].push(event);
                saveEventsLocal();
                renderModalEvents();
                renderCalendar(currentDate);
                addEventModal.classList.remove('active');
            }
        };
    }

    window.addEventListener('click', (e) => {
        if (addEventModal && e.target === addEventModal) addEventModal.classList.remove('active');
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if (dayModal) dayModal.classList.remove('active'); });
    window.addEventListener('click', (e) => {
        if (dayModal && e.target === dayModal) dayModal.classList.remove('active');
    });

    function renderCalendar(date) {
        if (!calendarGrid || !monthTitle) return;
        calendarGrid.innerHTML = '';
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthName = date.toLocaleString('default', { month: 'long' });
        monthTitle.textContent = `${monthName} ${year}`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyCell);
        }
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayCell.classList.add('today');
            const dayNum = document.createElement('div');
            dayNum.classList.add('day-number');
            dayNum.textContent = i.toString(); // Ensure textContent is string
            dayCell.appendChild(dayNum); // Append day number
            // Check for events
            const eventKey = getEventKey(i, monthName, year);
            if (calendarEvents[eventKey] && calendarEvents[eventKey].length > 0) {
                const count = calendarEvents[eventKey].length;
                const badge = document.createElement('div');
                badge.className = 'event-count-badge';
                badge.textContent = count.toString(); // Ensure textContent is string
                dayCell.appendChild(badge);
            }
            dayCell.addEventListener('click', () => {
                if (typeof openModal === 'function') openModal(date, i, monthName, year);
            });
            calendarGrid.appendChild(dayCell);
        }
    }

    initCalendar();

    // --- Syllabus Accordion ---
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.nextElementSibling?.classList.toggle('active');
        });
    });

    // --- Pomodoro Timer ---
    const timeDisplay = document.querySelector('.time-display');
    const startBtn = document.getElementById('startTimer');
    const resetBtn = document.getElementById('resetTimer');
    const timeSlider = document.getElementById('timeSlider');

    if (timeDisplay && startBtn && resetBtn && timeSlider) {
        let timerInterval;
        let timeLeft = parseInt(timeSlider.value, 10) * 60; // Ensure base 10
        let isRunning = false;

        function updateDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function startTimer() {
            if (isRunning) { clearInterval(timerInterval); isRunning = false; startBtn.textContent = 'Start'; return; }
            isRunning = true;
            startBtn.textContent = 'Pause';
            timerInterval = setInterval(() => {
                if (timeLeft > 0) { timeLeft--; updateDisplay(); }
                else { clearInterval(timerInterval); isRunning = false; startBtn.textContent = 'Start'; alert('Time is up!'); }
            }, 1000);
        }

        function resetTimer() {
            clearInterval(timerInterval);
            isRunning = false;
            timeLeft = parseInt(timeSlider.value, 10) * 60; // Ensure base 10
            updateDisplay();
            startBtn.textContent = 'Start';
        }

        timeSlider.addEventListener('input', () => {
            if (isRunning) { clearInterval(timerInterval); isRunning = false; startBtn.textContent = 'Start'; }
            timeLeft = parseInt(timeSlider.value, 10) * 60; // Ensure base 10
            updateDisplay();
        });

        startBtn.addEventListener('click', startTimer);
        resetBtn.addEventListener('click', resetTimer);
        updateDisplay();
    }


    // --- Upcoming Events ---
    const upcomingEventsBtn = document.getElementById('upcomingEventsBtn');
    const upcomingEventsModal = document.getElementById('upcomingEventsModal');
    const closeUpcomingModalBtn = document.getElementById('closeUpcomingModal');
    const upcomingEventsList = document.getElementById('upcomingEventsList');

    if (upcomingEventsBtn && upcomingEventsModal && closeUpcomingModalBtn && upcomingEventsList) {
        function renderUpcomingEvents() {
            if (!upcomingEventsList) return; // Safety check
            upcomingEventsList.innerHTML = '';
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            let allEvents = [];
            Object.keys(calendarEvents).forEach(key => {
                const parts = key.split('-');
                if (parts.length === 3) {
                    const eventDate = new Date(`${parts[0]} ${parts[1]}, ${parts[2]}`);
                    if (!isNaN(eventDate.getTime()) && eventDate >= now) {
                        calendarEvents[key].forEach(event => {
                            allEvents.push({ date: eventDate, dateString: key, ...event });
                        });
                    }
                }
            });
            allEvents.sort((a, b) => a.date.getTime() - b.date.getTime()); // Compare timestamps
            if (allEvents.length === 0) upcomingEventsList.innerHTML = '<p class="empty-state">No upcoming events found.</p>';
            else {
                allEvents.forEach(event => {
                    const eventEl = document.createElement('div');
                    eventEl.className = 'event-item';
                    eventEl.style.cssText = 'background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid rgba(255,255,255,0.1);';
                    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                    eventEl.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <span style="font-size: 0.85rem; color: var(--accent-primary); font-weight:bold; text-transform:uppercase; letter-spacing:1px;">${event.date.toLocaleDateString('en-US', dateOptions)}</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${event.time || 'No Time'}</span>
                        </div>
                        <h3 style="margin-bottom:0.25rem; font-size: 1.1rem;">${event.title || 'Untitled Event'}</h3>
                        <p style="font-size: 0.9rem;">${event.desc || 'No description'}</p>
                    `;
                    upcomingEventsList.appendChild(eventEl);
                });
            }
        }

        upcomingEventsBtn.addEventListener('click', () => { renderUpcomingEvents(); upcomingEventsModal.classList.add('active'); });
        closeUpcomingModalBtn.addEventListener('click', () => upcomingEventsModal.classList.remove('active'));
        window.addEventListener('click', (e) => { if (e.target === upcomingEventsModal) upcomingEventsModal.classList.remove('active'); });
    }


    // --- Countdown ---
    // --- Countdown ---
    const countdownText = document.getElementById('countdownText');

    if (countdownText) {
        function updateCountdown() {
            const now = new Date();
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            const diff = endOfYear.getTime() - now.getTime(); // Use getTime() for reliable diff

            if (diff <= 0) {
                countdownText.textContent = 'Happy New Year! 🎉';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Compact format: 320d 12h 30m 15s
            countdownText.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // --- Scroll ---
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }
});
