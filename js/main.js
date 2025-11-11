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

// DOM elements - will be initialized after DOM is ready
let loading, error, tableViewBtn, calendarViewBtn, tableView, calendarView;
let filterDateFrom, filterDateTo, filterArtist, filterGenre, filterVenue, filterPromoter, clearFiltersBtn;

// Debounce timer for live filtering
let filterDebounceTimer = null;

// Initialize DOM elements
function initDOMElements() {
    loading = document.getElementById('loading');
    error = document.getElementById('error');
    tableViewBtn = document.getElementById('tableViewBtn');
    calendarViewBtn = document.getElementById('calendarViewBtn');
    tableView = document.getElementById('tableView');
    calendarView = document.getElementById('calendarView');
    
    // Filter inputs
    filterDateFrom = document.getElementById('filterDateFrom');
    filterDateTo = document.getElementById('filterDateTo');
    filterArtist = document.getElementById('filterArtist');
    filterGenre = document.getElementById('filterGenre');
    filterVenue = document.getElementById('filterVenue');
    filterPromoter = document.getElementById('filterPromoter');
    clearFiltersBtn = document.getElementById('clearFilters');
    
    console.log('DOM elements initialized:', {
        filterDateFrom: !!filterDateFrom,
        filterDateTo: !!filterDateTo,
        filterArtist: !!filterArtist,
        filterGenre: !!filterGenre,
        filterVenue: !!filterVenue,
        filterPromoter: !!filterPromoter,
        tableViewBtn: !!tableViewBtn,
        calendarViewBtn: !!calendarViewBtn
    });
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', showTableView);
        console.log('Table view button listener added');
    }
    if (calendarViewBtn) {
        calendarViewBtn.addEventListener('click', showCalendarView);
        console.log('Calendar view button listener added');
    }
    
    // Filter inputs with debounced live filtering
    if (filterDateFrom) {
        filterDateFrom.addEventListener('change', applyFilters);
        console.log('Date From filter listener added');
    }
    if (filterDateTo) {
        filterDateTo.addEventListener('change', applyFilters);
        console.log('Date To filter listener added');
    }
    if (filterArtist) {
        filterArtist.addEventListener('input', debounceFilter);
        console.log('Artist filter listener added');
    }
    if (filterGenre) {
        filterGenre.addEventListener('input', debounceFilter);
        console.log('Genre filter listener added');
    }
    if (filterVenue) {
        filterVenue.addEventListener('input', debounceFilter);
        console.log('Venue filter listener added');
    }
    if (filterPromoter) {
        filterPromoter.addEventListener('input', debounceFilter);
        console.log('Promoter filter listener added');
    }
    
    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
        console.log('Clear filters button listener added');
    }
}

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
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';

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
            if (loading) loading.style.display = 'none';
            applyFilters();
            return; // Success!
            
        } catch (err) {
            console.warn(`URL ${i + 1} failed:`, err.message);
            lastError = err;
            // Continue to next URL
        }
    }
    
    // All URLs failed
    if (loading) loading.style.display = 'none';
    if (error) {
        error.style.display = 'block';
    error.innerHTML = `
        <strong>Error loading data:</strong> ${lastError?.message || 'Unknown error'}<br><br>
        <strong>Possible solutions:</strong><br>
        1. Make sure your Google Sheet is published: <strong>File → Share → Publish to web → CSV</strong><br>
        2. Check your internet connection<br>
        3. The sheet might be private - make sure it's publicly accessible<br>
        4. Try refreshing the page
    `;
    }
    console.error('All fetch attempts failed. Last error:', lastError);
}

// ============================================
// Filtering Logic
// ============================================

/**
 * Debounce filter function for live filtering
 */
function debounceFilter() {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(() => {
        applyFilters();
    }, 300); // 300ms debounce
}

/**
 * Apply all active filters
 */
function applyFilters() {
    if (!window.allConcerts || window.allConcerts.length === 0) {
        window.filteredConcerts = [];
        if (typeof renderTableView === 'function') {
            renderTableView();
        }
        return;
    }
    
    // Get filter values safely
    const dateFromValue = filterDateFrom ? filterDateFrom.value : '';
    const dateToValue = filterDateTo ? filterDateTo.value : '';
    const artistValue = filterArtist ? filterArtist.value.trim() : '';
    const genreValue = filterGenre ? filterGenre.value.trim() : '';
    const venueValue = filterVenue ? filterVenue.value.trim() : '';
    const promoterValue = filterPromoter ? filterPromoter.value.trim() : '';
    
    window.filteredConcerts = window.allConcerts.filter(concert => {
        // Date range filter
        if (dateFromValue || dateToValue) {
            if (concert.parsedDate) {
                const concertDate = new Date(concert.parsedDate);
                concertDate.setHours(0, 0, 0, 0);
                
                if (dateFromValue) {
                    const fromDate = new Date(dateFromValue);
                    fromDate.setHours(0, 0, 0, 0);
                    if (concertDate < fromDate) {
                        return false;
                    }
                }
                
                if (dateToValue) {
                    const toDate = new Date(dateToValue);
                    toDate.setHours(23, 59, 59, 999);
                    if (concertDate > toDate) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }

        // Artist filter
        if (artistValue && concert.artist) {
            if (!concert.artist.toLowerCase().includes(artistValue.toLowerCase())) {
                return false;
            }
        }

        // Genre filter
        if (genreValue && concert.genre) {
            if (!concert.genre.toLowerCase().includes(genreValue.toLowerCase())) {
                return false;
            }
        }

        // Venue filter
        if (venueValue && concert.venue) {
            if (!concert.venue.toLowerCase().includes(venueValue.toLowerCase())) {
                return false;
            }
        }

        // Promoter filter
        if (promoterValue && concert.promoter) {
            if (!concert.promoter.toLowerCase().includes(promoterValue.toLowerCase())) {
                return false;
            }
        }

        return true;
    });

    console.log(`Filtered ${window.filteredConcerts.length} concerts from ${window.allConcerts.length} total`);
    if (genreValue) {
        console.log(`Genre filter: "${genreValue}" - Found:`, window.filteredConcerts.map(c => c.genre));
    }

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
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    if (filterArtist) filterArtist.value = '';
    if (filterGenre) filterGenre.value = '';
    if (filterVenue) filterVenue.value = '';
    if (filterPromoter) filterPromoter.value = '';
    applyFilters();
}

// ============================================
// View Switching
// ============================================

/**
 * Switch to table view
 */
function showTableView() {
    console.log('Switching to table view');
    if (calendarView) {
        calendarView.classList.remove('active');
        calendarView.style.display = 'none';
    }
    if (tableView) {
        tableView.classList.add('active');
        tableView.style.display = 'block';
    }
    if (tableViewBtn) tableViewBtn.classList.add('active');
    if (calendarViewBtn) calendarViewBtn.classList.remove('active');
    // Re-render table if data is available
    if (typeof renderTableView === 'function' && window.filteredConcerts) {
        renderTableView();
    }
}

/**
 * Switch to calendar view
 */
function showCalendarView() {
    console.log('Switching to calendar view');
    if (tableView) {
        tableView.classList.remove('active');
        tableView.style.display = 'none';
    }
    if (calendarView) {
        calendarView.classList.add('active');
        calendarView.style.display = 'block';
        console.log('Calendar view displayed');
    }
    if (tableViewBtn) tableViewBtn.classList.remove('active');
    if (calendarViewBtn) calendarViewBtn.classList.add('active');
    
    // Force reflow and then render calendar
    if (calendarView) {
        calendarView.offsetHeight; // Force reflow
    }
    
    // Small delay to ensure DOM is ready and visible
    setTimeout(() => {
        if (typeof renderCalendarView === 'function') {
            console.log('Calling renderCalendarView');
            renderCalendarView();
        } else {
            console.error('renderCalendarView function not found');
        }
    }, 200);
}

// ============================================
// Initialize
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDOMElements();
        fetchConcerts();
    });
} else {
    initDOMElements();
    fetchConcerts();
}

