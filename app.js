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
    setInterval(updateDateTime, 1000);
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

    document.getElementById('hydration-score').textContent = Math.min(hydrationScore, 100);
    document.getElementById('posture-score').textContent = postureScore;
    document.getElementById('wellness-score').textContent = wellnessScore;
    
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
    if (progressFill) {
        progressFill.style.width = cappedPercentage + '%';
    }
    
    // Update water ml display
    const waterMlElement = document.getElementById('water-ml');
    if (waterMlElement) {
        waterMlElement.textContent = appData.waterIntake;
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
    
    // Update metrics
    const spineAngleElement = document.getElementById('spine-angle');
    if (spineAngleElement) {
        spineAngleElement.textContent = (45 + (goodPosturePercentage / 100) * 5).toFixed(2) + '°';
    }
    
    // Draw posture chart
    drawPostureChart();
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
    updatePostureTab();
    updateDashboard();
}

// Update posture periodically
setInterval(simulatePostureChange, 15000);

// ============ SUMMARY ============
function updateSummaryTab() {
    const overallScore = appData.wellnessScore;
    
    // Update overall score
    const scoreRing = document.getElementById('score-ring');
    if (scoreRing) {
        const percentage = overallScore / 100;
        const circumference = 282;
        scoreRing.style.strokeDashoffset = circumference * (1 - percentage);
    }
    
    const scoreNumberElement = document.getElementById('overall-score');
    if (scoreNumberElement) {
        scoreNumberElement.textContent = overallScore;
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
