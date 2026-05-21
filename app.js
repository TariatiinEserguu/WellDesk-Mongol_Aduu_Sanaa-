// App Data Storage
const appData = {
    waterIntake: 700, // ml
    waterGoal: 2000, // ml
    postureQuality: 80, // percentage
    postureHistory: [45, 48, 52, 50, 48, 55, 52, 50, 48, 51, 49, 50],
    hydrationHistory: [
        { time: '07:30 AM', amount: 250 },
        { time: '10:15 AM', amount: 250 },
        { time: '01:45 PM', amount: 200 }
    ],
    postureEvents: [
        { time: '08:00 AM', status: 'Good' },
        { time: '09:30 AM', status: 'Slumped' },
        { time: '11:00 AM', status: 'Good' }
    ],
    wellnessScore: 69
};
// Reminders will be stored here (persisted to localStorage)
appData.reminders = [
    { id: 'drink', icon: '💧', text: 'Time to drink water', time: '' },
    { id: 'posture', icon: '🧘', text: 'Check posture', time: '' },
    { id: 'vitamin', icon: '💊', text: 'Vitamin time', time: '14:00' }
];
// mode: 'auto' or 'manual'
appData.reminderMode = 'auto';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabNavigation();
    setupThemeToggle();
    updateDateTime();
    updateDashboard();
    updateHydrationTab();
    updatePostureTab();
    updateSummaryTab();
    loadReminders();
    renderReminders();
    applyReminderModeToUI();
    setInterval(updateDateTime, 1000);
}

function applyReminderModeToUI() {
    const toggle = document.getElementById('reminder-mode-toggle');
    const text = document.getElementById('reminder-mode-text');
    if (!toggle) return;
    const mode = localStorage.getItem('welldesk-reminder-mode') || appData.reminderMode || 'auto';
    appData.reminderMode = mode;
    toggle.checked = mode === 'auto';
    if (text) text.textContent = mode === 'auto' ? 'Auto' : 'Manual';
}

function toggleReminderMode() {
    const toggle = document.getElementById('reminder-mode-toggle');
    const text = document.getElementById('reminder-mode-text');
    if (!toggle) return;
    const mode = toggle.checked ? 'auto' : 'manual';
    appData.reminderMode = mode;
    if (text) text.textContent = mode === 'auto' ? 'Auto' : 'Manual';
    localStorage.setItem('welldesk-reminder-mode', mode);
    renderReminders();
}

// ---------------- Reminders ----------------
function loadReminders() {
    try {
        const stored = localStorage.getItem('welldesk-reminders');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                appData.reminders = parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to load reminders', e);
    }
}

function saveReminders() {
    try {
        localStorage.setItem('welldesk-reminders', JSON.stringify(appData.reminders));
    } catch (e) {
        console.warn('Failed to save reminders', e);
    }
}

function formatTimeHHMM(hhmm) {
    if (!hhmm) return '';
    const [hh, mm] = hhmm.split(':');
    const d = new Date();
    d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderReminders() {
    const list = document.getElementById('reminder-list');
    if (!list) return;
    list.innerHTML = '';

    const mode = appData.reminderMode || 'auto';
    appData.reminders.forEach(r => {
        const div = document.createElement('div');
        div.className = 'reminder-item';
        if (mode === 'auto') {
            // In auto mode show next occurrence (computed) and disable edit
            const nextText = computeNextForReminder(r);
            div.innerHTML = `
                <span class="reminder-icon">${r.icon}</span>
                <span class="reminder-text">${r.text}</span>
                <span class="time">${nextText}</span>
            `;
        } else {
            const displayTime = r.time ? formatTimeHHMM(r.time) : 'Not set';
            div.innerHTML = `
                <span class="reminder-icon">${r.icon}</span>
                <span class="reminder-text">${r.text}</span>
                <span class="time" id="reminder-time-${r.id}">${displayTime}</span>
                <div style="margin-left:8px;display:flex;gap:8px">
                    <button class="btn btn-secondary" onclick="editReminder('${r.id}')">Edit</button>
                </div>
            `;
        }
        list.appendChild(div);
    });
}

function computeNextForReminder(r) {
    // For water and posture, use intervals; for vitamin use set time if provided
    const now = new Date();
    if (r.id === 'vitamin') {
        if (r.time) {
            const [hh, mm] = r.time.split(':').map(Number);
            const target = new Date(now);
            target.setHours(hh, mm, 0, 0);
            if (target < now) target.setDate(target.getDate() + 1);
            const mins = Math.round((target - now) / 60000);
            return mins <= 60 ? `In ${mins} min` : formatTimeHHMM(r.time);
        }
        return 'Not set';
    }

    // default intervals
    const intervalMins = r.id === 'drink' ? 60 : 30;
    return `Every ${intervalMins} min`;
}

function editReminder(id) {
    const r = appData.reminders.find(x => x.id === id);
    if (!r) return;
    const timeSpan = document.getElementById(`reminder-time-${id}`);
    if (!timeSpan) return;
    const current = r.time || '09:00';
    timeSpan.innerHTML = `
        <input type="time" id="time-input-${id}" value="${current}" style="margin-right:8px">
        <button class="btn btn-primary" onclick="saveReminder('${id}')">Save</button>
        <button class="btn btn-secondary" onclick="renderReminders()">Cancel</button>
    `;
}

function saveReminder(id) {
    const input = document.getElementById(`time-input-${id}`);
    if (!input) return;
    const newTime = input.value;
    const r = appData.reminders.find(x => x.id === id);
    if (!r) return;
    r.time = newTime;
    saveReminders();
    renderReminders();
    showFeedback('Reminder saved');
}

// Tab Navigation
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Remove active class from all
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Theme Toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const body = document.body;
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('welldesk-theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateThemeIcon('☀️');
    } else {
        body.classList.remove('dark-mode');
        updateThemeIcon('🌙');
    }
    
    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Save preference to localStorage
        localStorage.setItem('welldesk-theme', isDarkMode ? 'dark' : 'light');
        
        // Update icon
        updateThemeIcon(isDarkMode ? '☀️' : '🌙');
    });
}

function updateThemeIcon(icon) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = icon;
    }
}

// Update Date and Time
function updateDateTime() {
    const now = new Date();
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    
    // Format time
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    
    if (dateElement) dateElement.textContent = dateStr;
    if (timeElement) timeElement.textContent = timeStr;
}

// ============ DASHBOARD ============
function updateDashboard() {
    const hydrationScore = Math.round((appData.waterIntake / appData.waterGoal) * 100);
    const postureScore = appData.postureQuality;
    const wellnessScore = Math.round((hydrationScore * 0.4 + postureScore * 0.6));

    // Update hydration score safely
    const hydrationEl = document.getElementById('hydration-score');
    if (hydrationEl) hydrationEl.textContent = Math.min(hydrationScore, 100);

    // Show posture as a clean integer to avoid long floats
    const postureDisplay = Math.round(postureScore);
    const postureEl = document.getElementById('posture-score');
    if (postureEl) postureEl.textContent = postureDisplay;

    // Update wellness score safely
    const wellnessEl = document.getElementById('wellness-score');
    if (wellnessEl) wellnessEl.textContent = wellnessScore;

    // Ensure summary reflects the latest computed wellness score
    appData.wellnessScore = wellnessScore;
    updateSummaryTab();
    
    appData.wellnessScore = wellnessScore;
}

// ============ HYDRATION ============
function addWater(amount) {
    appData.waterIntake += amount;
    
    // Add to history
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    appData.hydrationHistory.push({ time: timeStr, amount: amount });
    
    updateHydrationTab();
    updateDashboard();
    
    // Show feedback
    showFeedback(`Added ${amount}ml of water!`);
}

function updateHydrationTab() {
    const percentage = Math.round((appData.waterIntake / appData.waterGoal) * 100);
    const cappedPercentage = Math.min(percentage, 100);
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    const progressBar = document.querySelector('.progress-bar');
    if (progressFill) {
        progressFill.style.width = cappedPercentage + '%';
    }
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', cappedPercentage);
    }
    
    // Update water ml display
    const waterMlElement = document.getElementById('water-ml');
    if (waterMlElement) {
        waterMlElement.textContent = appData.waterIntake + ' ml';
    }
    const waterGoalEl = document.getElementById('water-goal');
    if (waterGoalEl) {
        waterGoalEl.textContent = appData.waterGoal + ' ml';
    }
    
    // Update cup
    const waterLevel = document.getElementById('water-level');
    const cupPercentage = document.getElementById('cup-percentage');
    if (waterLevel) {
        waterLevel.style.height = cappedPercentage + '%';
    }
    if (cupPercentage) {
        cupPercentage.textContent = cappedPercentage + '%';
    }
    
    // Update history
    const historyList = document.getElementById('hydration-history');
    if (historyList) {
        historyList.innerHTML = '';
        appData.hydrationHistory.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span>💧 ${item.amount}ml</span>
                <span>${item.time}</span>
            `;
            historyList.appendChild(div);
        });
    }
    
    // Update dashboard scores
    updateDashboard();
}

// ============ POSTURE ============
function updatePostureTab() {
    try {
        const goodPosturePercentage = appData.postureQuality;
        const postureStatusText = document.getElementById('posture-status-text');
        const postureIndicator = document.querySelector('.posture-dot');
        
        // Update status based on quality
        if (goodPosturePercentage >= 80) {
            if (postureStatusText) postureStatusText.textContent = 'Good Posture';
            if (postureIndicator) postureIndicator.style.backgroundColor = '#10b981'; // green
        } else if (goodPosturePercentage >= 60) {
            if (postureStatusText) postureStatusText.textContent = 'Fair Posture';
            if (postureIndicator) postureIndicator.style.backgroundColor = '#f59e0b'; // orange
        } else {
            if (postureStatusText) postureStatusText.textContent = 'Poor Posture';
            if (postureIndicator) postureIndicator.style.backgroundColor = '#ef4444'; // red
        }
        
        // Update metrics (rounded values for readability)
        const spineAngleElement = document.getElementById('spine-angle');
        if (spineAngleElement) {
            spineAngleElement.textContent = (45 + (goodPosturePercentage / 100) * 5).toFixed(1) + '°';
        }
        
        // Draw posture chart
        drawPostureChart();
    } catch (e) {
        console.error('Error updating posture tab', e);
    }
}

function drawPostureChart() {
    const canvas = document.getElementById('posture-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(248, 250, 252, 1)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw data line
    const data = appData.postureHistory;
    const pointSpacing = width / (data.length - 1);
    const yMin = 40;
    const yMax = 60;
    const yRange = yMax - yMin;
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = index * pointSpacing;
        const normalizedValue = (value - yMin) / yRange;
        const y = height - (normalizedValue * height * 0.8) - height * 0.1;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#f59e0b';
    data.forEach((value, index) => {
        const x = index * pointSpacing;
        const normalizedValue = (value - yMin) / yRange;
        const y = height - (normalizedValue * height * 0.8) - height * 0.1;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Simulate posture change
function simulatePostureChange() {
    const randomChange = (Math.random() - 0.5) * 10;
    appData.postureQuality = Math.max(50, Math.min(100, appData.postureQuality + randomChange));
    // Keep stored postureQuality to a single decimal to prevent long floats
    appData.postureQuality = parseFloat(appData.postureQuality.toFixed(1));
    updatePostureTab();
    updateDashboard();
}

// Update posture periodically
setInterval(simulatePostureChange, 15000);

// ============ SUMMARY ============
function updateSummaryTab() {
    try {
        const overallScore = appData.wellnessScore;
        
        // Update overall score
        const scoreRing = document.getElementById('score-ring');
        if (scoreRing) {
            // compute circumference based on radius to avoid hardcoded values
            const r = parseFloat(scoreRing.getAttribute('r')) || 45;
            const circumference = 2 * Math.PI * r;
            const percentage = Math.max(0, Math.min(1, overallScore / 100));
            scoreRing.style.strokeDasharray = String(circumference);
            scoreRing.style.strokeDashoffset = String(circumference * (1 - percentage));
        }
        
        const scoreNumberElement = document.getElementById('overall-score');
        if (scoreNumberElement) {
            scoreNumberElement.textContent = overallScore;
        }
    } catch (e) {
        console.error('Error updating summary tab', e);
    }
}

// ============ UTILITIES ============
function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => feedback.remove(), 300);
    }, 2000);
}

// Add animations to stylesheet
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Simulate real-time data updates
setInterval(() => {
    // Randomly simulate water intake reminders
    if (Math.random() > 0.95) {
        const amount = Math.random() > 0.5 ? 250 : 200;
        if (appData.waterIntake < appData.waterGoal) {
            console.log('💧 Reminder: Time to drink water!');
        }
    }
}, 5000);
