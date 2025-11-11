// ============================================
// Groovy Racoon - Main Data Fetching Logic
// ============================================

// Google Sheets configuration
const SPREADSHEET_ID = '1J6aInjzgf-_7PZO6I8TG4Ghvnx9e3Z_E5rVYImY2BC0';
const GID = '1445856825';

// Try multiple URL formats and CORS proxies
const CSV_URLS = [
    // Direct export URL
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`,
    // Alternative format
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`,
    // CORS proxy options (public proxies)
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`)}`
];

// Global state (explicitly on window for cross-file access)
window.allConcerts = [];
window.filteredConcerts = [];

// DOM elements
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const tableViewBtn = document.getElementById('tableViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const tableView = document.getElementById('tableView');
const calendarView = document.getElementById('calendarView');

// Filter inputs
const filterDate = document.getElementById('filterDate');
const filterArtist = document.getElementById('filterArtist');
const filterGenre = document.getElementById('filterGenre');
const filterVenue = document.getElementById('filterVenue');
const filterPromoter = document.getElementById('filterPromoter');
const clearFiltersBtn = document.getElementById('clearFilters');

// ============================================
// CSV Parsing Functions
// ============================================

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const concerts = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        
        const concert = {
            date: values[0]?.trim() || '',
            artist: values[1]?.trim() || '',
            genre: values[2]?.trim() || '',
            venue: values[3]?.trim() || '',
            promoter: values[4]?.trim() || '',
            ticketLink: values[5]?.trim() || '',
            fbLink: values[6]?.trim() || ''
        };

        // Only add concerts with at least a date and artist
        if (concert.date && concert.artist) {
            concerts.push(concert);
        }
    }

    return concerts;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

/**
 * Parse date from various formats (e.g., "1. 11. 2025")
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Try different date formats
    // Format: "1. 11. 2025" or "1.11.2025"
    const cleaned = dateStr.replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(/[.\s]+/);
    
    if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    return null;
}

/**
 * Format date for display
 */
function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('cs-CZ', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
    });
}

/**
 * Format date as YYYY-MM-DD for input fields
 */
function formatDateInput(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================
// Data Fetching
// ============================================

/**
 * Fetch concerts from Google Sheets with fallback URLs
 */
async function fetchConcerts() {
    loading.style.display = 'block';
    error.style.display = 'none';

    let lastError = null;
    
    // Try each URL until one works
    for (let i = 0; i < CSV_URLS.length; i++) {
        try {
            const url = CSV_URLS[i];
            console.log(`Trying URL ${i + 1}/${CSV_URLS.length}: ${url.substring(0, 80)}...`);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let csvText = await response.text();
            
            // Handle CORS proxy responses that might wrap the data
            if (csvText.includes('<!DOCTYPE') || csvText.includes('<html')) {
                throw new Error('Received HTML instead of CSV (likely CORS issue)');
            }
            
            // Clean up the CSV text (remove BOM if present)
            csvText = csvText.replace(/^\uFEFF/, '');
            
            const rawConcerts = parseCSV(csvText);
            
            if (rawConcerts.length === 0) {
                throw new Error('No concerts found in CSV data');
            }
            
            // Add parsed date objects for easier filtering and sorting
            window.allConcerts = rawConcerts.map(concert => ({
                ...concert,
                parsedDate: parseDate(concert.date)
            }));

            console.log(`Successfully loaded ${window.allConcerts.length} concerts`);
            loading.style.display = 'none';
            applyFilters();
            return; // Success!
            
        } catch (err) {
            console.warn(`URL ${i + 1} failed:`, err.message);
            lastError = err;
            // Continue to next URL
        }
    }
    
    // All URLs failed
    loading.style.display = 'none';
    error.style.display = 'block';
    error.innerHTML = `
        <strong>Error loading data:</strong> ${lastError?.message || 'Unknown error'}<br><br>
        <strong>Possible solutions:</strong><br>
        1. Make sure your Google Sheet is published: <strong>File → Share → Publish to web → CSV</strong><br>
        2. Check your internet connection<br>
        3. The sheet might be private - make sure it's publicly accessible<br>
        4. Try refreshing the page
    `;
    console.error('All fetch attempts failed. Last error:', lastError);
}

// ============================================
// Filtering Logic
// ============================================

/**
 * Apply all active filters
 */
function applyFilters() {
    window.filteredConcerts = window.allConcerts.filter(concert => {
        // Date filter
        if (filterDate.value) {
            const filterDateObj = new Date(filterDate.value);
            if (concert.parsedDate) {
                const concertDate = new Date(concert.parsedDate);
                if (concertDate.toDateString() !== filterDateObj.toDateString()) {
                    return false;
                }
            } else {
                return false;
            }
        }

        // Artist filter
        if (filterArtist.value && !concert.artist.toLowerCase().includes(filterArtist.value.toLowerCase())) {
            return false;
        }

        // Genre filter
        if (filterGenre.value && !concert.genre.toLowerCase().includes(filterGenre.value.toLowerCase())) {
            return false;
        }

        // Venue filter
        if (filterVenue.value && !concert.venue.toLowerCase().includes(filterVenue.value.toLowerCase())) {
            return false;
        }

        // Promoter filter
        if (filterPromoter.value && !concert.promoter.toLowerCase().includes(filterPromoter.value.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Update views
    if (typeof renderTableView === 'function') {
        renderTableView();
    }
    if (typeof renderCalendarView === 'function') {
        renderCalendarView();
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    filterDate.value = '';
    filterArtist.value = '';
    filterGenre.value = '';
    filterVenue.value = '';
    filterPromoter.value = '';
    applyFilters();
}

// ============================================
// View Switching
// ============================================

/**
 * Switch to table view
 */
function showTableView() {
    tableView.classList.add('active');
    calendarView.classList.remove('active');
    tableViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
    // Re-render table if data is available
    if (typeof renderTableView === 'function' && window.filteredConcerts) {
        renderTableView();
    }
}

/**
 * Switch to calendar view
 */
function showCalendarView() {
    tableView.classList.remove('active');
    calendarView.classList.add('active');
    tableViewBtn.classList.remove('active');
    calendarViewBtn.classList.add('active');
    if (typeof renderCalendarView === 'function') {
        renderCalendarView();
    }
}

// ============================================
// Event Listeners
// ============================================

// View toggle buttons
tableViewBtn.addEventListener('click', showTableView);
calendarViewBtn.addEventListener('click', showCalendarView);

// Filter inputs
filterDate.addEventListener('change', applyFilters);
filterArtist.addEventListener('input', applyFilters);
filterGenre.addEventListener('input', applyFilters);
filterVenue.addEventListener('input', applyFilters);
filterPromoter.addEventListener('input', applyFilters);

// Clear filters button
clearFiltersBtn.addEventListener('click', clearFilters);

// ============================================
// Initialize
// ============================================

// Fetch concerts on page load
fetchConcerts();

