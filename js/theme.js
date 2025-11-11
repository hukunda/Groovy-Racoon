// ============================================
// Groovy Racoon - Theme Switching Logic
// ============================================

const THEME_STORAGE_KEY = 'groovy-racoon-theme';
const THEME_AUTO = 'auto';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

let currentThemeMode = THEME_AUTO;
let currentTheme = THEME_LIGHT;

// DOM elements
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const body = document.body;

/**
 * Get current time-based theme
 */
function getTimeBasedTheme() {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? THEME_LIGHT : THEME_DARK;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    currentTheme = theme;
    body.setAttribute('data-theme', theme);
    
    // Update icon
    if (theme === THEME_DARK) {
        themeIcon.textContent = '☀️';
        themeToggle.setAttribute('title', 'Switch to light theme');
    } else {
        themeIcon.textContent = '🌙';
        themeToggle.setAttribute('title', 'Switch to dark theme');
    }
    
    // Update FullCalendar theme if it exists
    if (typeof calendar !== 'undefined' && calendar) {
        updateCalendarTheme(theme);
    }
}

/**
 * Update FullCalendar theme
 */
function updateCalendarTheme(theme) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    if (theme === THEME_DARK) {
        calendarEl.classList.add('fc-dark');
    } else {
        calendarEl.classList.remove('fc-dark');
    }
    
    // Re-render calendar if it exists
    if (typeof renderCalendarView === 'function') {
        renderCalendarView();
    }
}

/**
 * Toggle theme manually
 */
function toggleTheme() {
    if (currentThemeMode === THEME_AUTO) {
        // Switch to manual mode with opposite of current
        currentThemeMode = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        applyTheme(currentThemeMode);
    } else {
        // Toggle between light and dark
        currentThemeMode = currentThemeMode === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        applyTheme(currentThemeMode);
    }
    
    // Save preference
    localStorage.setItem(THEME_STORAGE_KEY, currentThemeMode);
}

/**
 * Initialize theme
 */
function initTheme() {
    // Load saved preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (savedTheme && (savedTheme === THEME_LIGHT || savedTheme === THEME_DARK)) {
        currentThemeMode = savedTheme;
        applyTheme(savedTheme);
    } else {
        // Auto mode based on time
        currentThemeMode = THEME_AUTO;
        const timeTheme = getTimeBasedTheme();
        applyTheme(timeTheme);
    }
    
    // Check theme every minute for auto mode
    setInterval(() => {
        if (currentThemeMode === THEME_AUTO) {
            const timeTheme = getTimeBasedTheme();
            if (timeTheme !== currentTheme) {
                applyTheme(timeTheme);
            }
        }
    }, 60000); // Check every minute
}

/**
 * Reset to auto theme
 */
function resetToAutoTheme() {
    currentThemeMode = THEME_AUTO;
    localStorage.removeItem(THEME_STORAGE_KEY);
    const timeTheme = getTimeBasedTheme();
    applyTheme(timeTheme);
}

// Event listener
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

