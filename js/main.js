// ============================================
// Groovy Racoon - Main Data Fetching Logic
// ============================================

// Google Sheets configuration
// ============================================
// OPTION 1: Google Apps Script Backend (RECOMMENDED - No CORS issues!)
// ============================================
// After setting up Google Apps Script (see BACKEND_SETUP.md), paste your Web App URL here:
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_-oGVKFBcoNIFhvpzZB5m6z7PW7agbQJuP8ADnKFRIraXw1XggRNE8BRxUlpRijg2kQ/exec'; // Paste your Web App URL here after setup
// Example: 'https://script.google.com/macros/s/AKfycby.../exec'

// Single sheet configuration - all gigs are in one sheet
// No need to configure multiple sheets anymore!

// ============================================
// OPTION 2: Direct Google Sheets (Fallback - has CORS issues)
// ============================================
const PUBLISHED_SHEET_ID = '2PACX-1vQpT2Xd6Z2X_cjVHt1MVq_FybDvSUIQ5Gm2lQz9dZOZtZx_P3qgOxiNqf9WhwoguOk06lebCl0ZXEA-';
const MAIN_GID = '0'; // Main sheet GID (only needed for fallback - use 0 for first sheet)
const PROMOTERS_GID = '0';
const VENUES_GID = '0';

/**
 * Get CSV URLs for the single sheet
 * Uses Google Apps Script if available, otherwise falls back to direct URLs
 */
function getCSVUrls() {
    // If Google Apps Script is set up, use it (no CORS issues!)
    if (GOOGLE_APPS_SCRIPT_URL) {
        return [
            GOOGLE_APPS_SCRIPT_URL, // No parameters needed - single sheet
        ];
    }
    
    // Fallback: Try direct Google Sheets URLs (may have CORS issues)
    return [
        `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv&gid=${MAIN_GID}`,
        `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?gid=${MAIN_GID}&single=true&output=csv`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv&gid=${MAIN_GID}`)}`,
        `https://corsproxy.io/?${encodeURIComponent(`https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv&gid=${MAIN_GID}`)}`,
    ];
}

// Global state (explicitly on window for cross-file access)
window.allConcerts = [];
window.filteredConcerts = [];
window.promoterLinks = {};
window.venueLinks = {};

// DOM elements - will be initialized after DOM is ready
let loading, error, gridViewBtn, tableViewBtn, calendarViewBtn, gridView, tableView, calendarView;
let filterMonth, filterDateFrom, filterDateTo, filterGenre, filterVenue, clearFiltersBtn, filtersContainer;
let allGigsTab, myListTab, myListPane;

// Debounce timer for live filtering
let filterDebounceTimer = null;

// Initialize DOM elements
function initDOMElements() {
    loading = document.getElementById('loading');
    error = document.getElementById('error');
    gridViewBtn = document.getElementById('gridViewBtn');
    tableViewBtn = document.getElementById('tableViewBtn');
    calendarViewBtn = document.getElementById('calendarViewBtn');
    gridView = document.getElementById('gridView');
    tableView = document.getElementById('tableView');
    calendarView = document.getElementById('calendarView');
    
    // Filter inputs
    filterMonth = document.getElementById('filterMonth');
    filterDateFrom = document.getElementById('filterDateFrom');
    filterDateTo = document.getElementById('filterDateTo');
    filterGenre = document.getElementById('filterGenre');
    filterVenue = document.getElementById('filterVenue');
    clearFiltersBtn = document.getElementById('clearFilters');
    filtersContainer = document.getElementById('filtersContainer');
    
    // Tabs
    allGigsTab = document.getElementById('allGigsTab');
    myListTab = document.getElementById('myListTab');
    myListPane = document.getElementById('myListPane');
    
    console.log('DOM elements initialized:', {
        filterDateFrom: !!filterDateFrom,
        filterDateTo: !!filterDateTo,
        filterGenre: !!filterGenre,
        filterVenue: !!filterVenue,
        gridViewBtn: !!gridViewBtn,
        tableViewBtn: !!tableViewBtn,
        calendarViewBtn: !!calendarViewBtn,
        filtersContainer: !!filtersContainer
    });
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', showGridView);
        console.log('Grid view button listener added');
    }
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', showTableView);
        console.log('Table view button listener added');
    }
    if (calendarViewBtn) {
        calendarViewBtn.addEventListener('click', showCalendarView);
        console.log('Calendar view button listener added');
    }
    
    // Filter inputs with debounced live filtering
    if (filterMonth) {
        filterMonth.addEventListener('change', applyFilters);
        console.log('Month filter listener added');
    }
    if (filterDateFrom) {
        filterDateFrom.addEventListener('change', applyFilters);
        console.log('Date From filter listener added');
    }
    if (filterDateTo) {
        filterDateTo.addEventListener('change', applyFilters);
        console.log('Date To filter listener added');
    }
    if (filterGenre) {
        filterGenre.addEventListener('input', debounceFilter);
        console.log('Genre filter listener added');
    }
    if (filterVenue) {
        filterVenue.addEventListener('input', debounceFilter);
        console.log('Venue filter listener added');
    }
    
    // Filters are now always visible - no toggle button needed
    
    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
        console.log('Clear filters button listener added');
    }
    
    // Tab buttons
    if (allGigsTab) {
        allGigsTab.addEventListener('click', () => switchTab('allGigs'));
    }
    if (myListTab) {
        myListTab.addEventListener('click', () => switchTab('myList'));
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
    if (lines.length < 2) {
        console.warn('CSV has less than 2 lines');
        return [];
    }

    // Parse header (if present, but we'll use position-based mapping)
    const headers = parseCSVLine(lines[0]);
    console.log('CSV Headers:', headers);
    console.log('Number of header columns:', headers.length);
    console.log('Using structure: A=Date, B=Name, C=Style, D=Place, E=Type, F=Link');
    
    // Parse data rows
    const concerts = [];
    // Start from row 1 (skip header) or row 0 if no header
    // Check if first row looks like a header (contains "date", "name", "style", etc.)
    const firstRowLower = lines[0].toLowerCase();
    const hasHeader = firstRowLower.includes('date') || firstRowLower.includes('datum') || 
                      firstRowLower.includes('name') || firstRowLower.includes('název') ||
                      firstRowLower.includes('style') || firstRowLower.includes('žánr') ||
                      firstRowLower.includes('place') || firstRowLower.includes('místo');
    const startRow = hasHeader ? 1 : 0;
    
    console.log(`Starting from row ${startRow} (header detected: ${hasHeader})`);
    
    for (let i = startRow; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        // Skip empty rows
        if (values.every(v => !v || !v.trim())) continue;
        
        // Need at least date and name (columns A and B)
        if (values.length < 2) continue;
        
        // Map columns based on spreadsheet structure (e.g., "List 14"):
        // A: Date - values[0]
        // B: Name (Artist/Event) - values[1]
        // C: Style (Genre) - values[2]
        // D: Place (Venue) - values[3]
        // E: Type - values[4] (may be promoter or event type)
        // F: Link (Ticket/Event link) - values[5]
        const concert = {
            date: values[0]?.trim() || '',
            artist: values[1]?.trim() || '',
            genre: values[2]?.trim() || '',
            venue: values[3]?.trim() || '',
            promoter: values[4]?.trim() || '', // Type column
            ticketLink: values[5]?.trim() || '',
            fbLink: '' // No Facebook link column in this structure
        };

        // Only add concerts with at least a date and artist
        if (concert.date && concert.artist) {
            concerts.push(concert);
        } else {
            // Log skipped rows for debugging
            if (i <= 5) {
                console.log(`Skipped row ${i}:`, { date: concert.date, artist: concert.artist });
            }
        }
    }

    console.log(`Parsed ${concerts.length} valid concerts from ${lines.length - 1} rows`);
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
    
    // If it's already a Date object, return it
    if (dateStr instanceof Date) {
        return dateStr;
    }
    
    // If it's a string that looks like a Date object string, try to parse it
    if (typeof dateStr === 'string' && dateStr.includes('GMT')) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    
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
    
    // Try ISO format (YYYY-MM-DD)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        return new Date(year, month, day);
    }
    
    // Last resort: try Date constructor
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
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
 * Fetch promoter links from Promoters tab
 */
async function fetchPromoterLinks() {
    const promotersUrl = `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv&gid=${PROMOTERS_GID}`;
    
    try {
        const response = await fetch(promotersUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const csvText = await response.text();
            const lines = csvText.split('\n').filter(line => line.trim());
            
            // Parse promoter links (format: Name, URL)
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length >= 2) {
                    const name = values[0]?.trim();
                    const url = values[1]?.trim();
                    if (name && url) {
                        window.promoterLinks[name.toLowerCase()] = url;
                    }
                }
            }
            console.log(`Loaded ${Object.keys(window.promoterLinks).length} promoter links`);
        }
    } catch (err) {
        console.warn('Could not fetch promoter links:', err);
    }
}

/**
 * Fetch venue links from Venues tab
 */
async function fetchVenueLinks() {
    const venuesUrl = `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv&gid=${VENUES_GID}`;
    
    try {
        const response = await fetch(venuesUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const csvText = await response.text();
            const lines = csvText.split('\n').filter(line => line.trim());
            
            // Parse venue links (format: Name, URL)
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length >= 2) {
                    const name = values[0]?.trim();
                    const url = values[1]?.trim();
                    if (name && url) {
                        window.venueLinks[name.toLowerCase()] = url;
                    }
                }
            }
            console.log(`Loaded ${Object.keys(window.venueLinks).length} venue links`);
        }
    } catch (err) {
        console.warn('Could not fetch venue links:', err);
    }
}

/**
 * Get promoter link by name
 */
function getPromoterLink(promoterName) {
    if (!promoterName) return null;
    return window.promoterLinks[promoterName.toLowerCase()] || null;
}

/**
 * Get venue link by name
 */
function getVenueLink(venueName) {
    if (!venueName) return null;
    return window.venueLinks[venueName.toLowerCase()] || null;
}

/**
 * Generate event page URL
 */
function getEventPageUrl(concert) {
    // Create a unique ID from event data
    // Use encodeURIComponent to handle special characters safely
    try {
        const eventData = JSON.stringify({
        date: concert.date,
        artist: concert.artist,
        venue: concert.venue
        });
        // Use a safer encoding method that handles all characters
        const eventId = encodeURIComponent(eventData)
            .replace(/[!'()*]/g, '') // Remove problematic characters
            .substring(0, 100); // Limit length
    
    return `event.html?id=${eventId}`;
    } catch (err) {
        // Fallback: use a simple hash
        const simpleId = `${concert.date || ''}_${concert.artist || ''}_${concert.venue || ''}`
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .substring(0, 50);
        return `event.html?id=${encodeURIComponent(simpleId)}`;
    }
}

/**
 * Fetch concerts from the single sheet
 */
async function fetchConcerts() {
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';

    console.log('Loading concerts from sheet...');
    
    const urls = getCSVUrls();
    let allRawConcerts = [];
    
    for (let i = 0; i < urls.length; i++) {
        try {
            const url = urls[i];
            console.log(`  Trying URL ${i + 1}/${urls.length}...`);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let csvText = await response.text();
            
            // Check if Google Apps Script returned an error
            if (csvText.trim().startsWith('Error:')) {
                const errorMsg = csvText.trim();
                console.error(`  Google Apps Script error: ${errorMsg}`);
                throw new Error(errorMsg);
            }
            
            // Handle CORS proxy responses that might wrap the data
            if (csvText.includes('<!DOCTYPE') || csvText.includes('<html')) {
                throw new Error('Received HTML instead of CSV (likely CORS issue)');
            }
            
            // Clean up the CSV text (remove BOM if present)
            csvText = csvText.replace(/^\uFEFF/, '');
            
            // Check if response is empty
            if (!csvText.trim()) {
                throw new Error('Received empty response from server');
            }
            
            // Debug: log first few lines
            if (i === 0) {
                const firstLines = csvText.split('\n').slice(0, 5);
                console.log(`  CSV preview (first 5 lines):`, firstLines);
                console.log(`  CSV length: ${csvText.length} chars, ${csvText.split('\n').length} lines`);
            }
            
            allRawConcerts = parseCSV(csvText);
            
            // Log if no concerts found
            if (allRawConcerts.length === 0 && i === 0) {
                console.warn(`  ⚠ No concerts parsed - check CSV structure`);
            }
            
            if (allRawConcerts.length > 0) {
                console.log(`  ✓ Loaded ${allRawConcerts.length} concerts`);
                break; // Success! Stop trying other URLs
            }
            
        } catch (err) {
            console.error(`  ✗ URL ${i + 1} failed:`, err.message);
            console.error(`  Full error:`, err);
            
            if (i === urls.length - 1) {
                // Last URL failed
                console.error('  Could not load sheet data');
                if (loading) loading.style.display = 'none';
                if (error) {
                    // Check if it's a Google Apps Script error
                    const isScriptError = err.message && err.message.includes('Error:');
                    const errorDetails = isScriptError 
                        ? `<strong>Google Apps Script Error:</strong> ${err.message}<br><br>`
                        : '';
                    
                    error.style.display = 'block';
                    error.innerHTML = `
                        <strong>Error loading data:</strong> Could not fetch concerts from sheet.<br><br>
                        ${errorDetails}
                        <strong>Debugging steps:</strong><br>
                        1. Open browser console (F12) and check for detailed error messages<br>
                        2. If using Google Apps Script:<br>
                           &nbsp;&nbsp;- Make sure the Web App URL is correct<br>
                           &nbsp;&nbsp;- Check that SPREADSHEET_ID in Google Apps Script matches your sheet<br>
                           &nbsp;&nbsp;- Verify SHEET_NAME matches your sheet tab name exactly<br>
                           &nbsp;&nbsp;- Test the URL directly: <a href="${urls[0]}" target="_blank">${urls[0]}</a><br>
                        3. If using direct URLs: Make sure sheet is published (File → Share → Publish to web)<br>
                        4. Check that sheet structure is: A=Date, B=Name, C=Style, D=Place, E=Type, F=Link<br>
                    `;
                }
                return;
            }
        }
    }
    
    if (allRawConcerts.length === 0) {
    if (loading) loading.style.display = 'none';
    if (error) {
        error.style.display = 'block';
    error.innerHTML = `
                <strong>Error loading data:</strong> No concerts found in sheet.<br><br>
                <strong>Debugging steps:</strong><br>
                1. Check that your sheet has data<br>
                2. Verify sheet structure: A=Date, B=Name, C=Style, D=Place, E=Type, F=Link<br>
                3. Make sure dates are in format: "1. 11. 2025" or "1.11.2025"<br>
            `;
        }
        console.error('No concerts loaded from sheet');
        return;
    }
    
    // Add parsed date objects and month info for easier filtering
    window.allConcerts = allRawConcerts.map(concert => {
        const parsedDate = parseDate(concert.date);
        let monthYear = null;
        if (parsedDate) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            monthYear = `${year}-${month}`;
        }
        
        return {
            ...concert,
            parsedDate: parsedDate,
            monthYear: monthYear
        };
    });

    console.log(`Successfully loaded ${window.allConcerts.length} total concerts`);
    
    // Populate month filter dropdown and set current month as default
    populateMonthFilter();
    
    // Fetch promoter and venue links from separate tabs
    await fetchPromoterLinks();
    await fetchVenueLinks();
    
    if (loading) loading.style.display = 'none';
    
    // Always apply filters after loading (this will render the views)
    // Filters will default to current month
    applyFilters();
    
    // Set default view to table (table view is now default)
    if (tableView && tableView.classList.contains('active')) {
        if (typeof renderTableView === 'function') {
            setTimeout(() => renderTableView(), 100);
        }
    }
}

/**
 * Populate month filter dropdown with available months
 * Sets current month as default
 */
function populateMonthFilter() {
    if (!filterMonth) return;
    
    // Get unique months from concerts
    const months = new Set();
    window.allConcerts.forEach(concert => {
        if (concert.monthYear) {
            months.add(concert.monthYear);
        }
    });
    
    // Sort months (newest first)
    const sortedMonths = Array.from(months).sort().reverse();
    
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Clear existing options
    filterMonth.innerHTML = '<option value="">All Months</option>';
    
    // Add month options
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthName;
        // Set current month as selected by default
        if (month === currentMonth) {
            option.selected = true;
        }
        filterMonth.appendChild(option);
    });
    
    // If current month is not in the list, but we have concerts, select the newest month
    if (!sortedMonths.includes(currentMonth) && sortedMonths.length > 0) {
        filterMonth.value = sortedMonths[0]; // Select newest month
    }
    
    console.log(`Populated month filter with ${sortedMonths.length} months (default: ${filterMonth.value || 'All Months'})`);
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
    const monthValue = filterMonth ? filterMonth.value : '';
    const dateFromValue = filterDateFrom ? filterDateFrom.value : '';
    const dateToValue = filterDateTo ? filterDateTo.value : '';
    const genreValue = filterGenre ? filterGenre.value.trim() : '';
    const venueValue = filterVenue ? filterVenue.value.trim() : '';
    
    window.filteredConcerts = window.allConcerts.filter(concert => {
        // Month filter (takes priority over date range)
        if (monthValue && concert.monthYear) {
            if (concert.monthYear !== monthValue) {
                return false;
            }
        }
        
        // Date range filter (works independently or with month filter)
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
                // If date range is set but concert has no valid date, exclude it
                if (dateFromValue || dateToValue) {
                return false;
                }
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

        return true;
    });

    console.log(`Filtered ${window.filteredConcerts.length} concerts from ${window.allConcerts.length} total`);
    if (genreValue) {
        console.log(`Genre filter: "${genreValue}" - Found:`, window.filteredConcerts.map(c => c.genre));
    }

    // Update views
    if (typeof renderGridView === 'function') {
        renderGridView();
    }
    if (typeof renderTableView === 'function') {
        renderTableView();
    }
    if (typeof renderCalendarView === 'function') {
        renderCalendarView();
    }
}

// Toggle filters function removed - filters are now always visible

/**
 * Clear all filters
 */
function clearFilters() {
    if (filterMonth) filterMonth.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    if (filterGenre) filterGenre.value = '';
    if (filterVenue) filterVenue.value = '';
    applyFilters();
}

/**
 * Switch between All Gigs and My List tabs
 */
function switchTab(tab) {
    if (tab === 'allGigs') {
        if (allGigsTab) allGigsTab.classList.add('active');
        if (myListTab) myListTab.classList.remove('active');
        if (myListPane) myListPane.style.display = 'none';
        
        // Show the active view (grid, table, or calendar)
        if (gridView && gridView.classList.contains('active')) {
            gridView.style.display = 'block';
        } else if (tableView && tableView.classList.contains('active')) {
            tableView.style.display = 'block';
        } else if (calendarView && calendarView.classList.contains('active')) {
            calendarView.style.display = 'block';
        }
    } else if (tab === 'myList') {
        if (allGigsTab) allGigsTab.classList.remove('active');
        if (myListTab) myListTab.classList.add('active');
        if (myListPane) myListPane.style.display = 'block';
        if (gridView) gridView.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (calendarView) calendarView.style.display = 'none';
        // Update My List display
        if (typeof renderMyList === 'function') {
            renderMyList();
        }
    }
}

// ============================================
// View Switching
// ============================================

/**
 * Switch to grid view
 */
function showGridView() {
    console.log('Switching to grid view');
    if (tableView) {
        tableView.classList.remove('active');
        tableView.style.display = 'none';
    }
    if (calendarView) {
        calendarView.classList.remove('active');
        calendarView.style.display = 'none';
    }
    if (gridView) {
        gridView.classList.add('active');
        gridView.style.display = 'block';
    }
    if (gridViewBtn) gridViewBtn.classList.add('active');
    if (tableViewBtn) tableViewBtn.classList.remove('active');
    if (calendarViewBtn) calendarViewBtn.classList.remove('active');
    // Re-render grid if data is available
    if (typeof renderGridView === 'function' && window.filteredConcerts) {
        renderGridView();
    }
}

/**
 * Switch to table view
 */
function showTableView() {
    console.log('Switching to table view');
    if (gridView) {
        gridView.classList.remove('active');
        gridView.style.display = 'none';
    }
    if (calendarView) {
        calendarView.classList.remove('active');
        calendarView.style.display = 'none';
    }
    if (tableView) {
        tableView.classList.add('active');
        tableView.style.display = 'block';
    }
    if (gridViewBtn) gridViewBtn.classList.remove('active');
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
    if (gridView) {
        gridView.classList.remove('active');
        gridView.style.display = 'none';
    }
    if (tableView) {
        tableView.classList.remove('active');
        tableView.style.display = 'none';
    }
    if (calendarView) {
        calendarView.classList.add('active');
        calendarView.style.display = 'block';
        console.log('Calendar view displayed');
    }
    if (gridViewBtn) gridViewBtn.classList.remove('active');
    if (tableViewBtn) tableViewBtn.classList.remove('active');
    if (calendarViewBtn) calendarViewBtn.classList.add('active');
    
    // Initialize calendar if not already done
    setTimeout(() => {
        if (typeof initCalendar === 'function') {
            console.log('Initializing calendar');
            initCalendar();
        } else if (typeof renderCalendarView === 'function') {
            console.log('Calling renderCalendarView');
            renderCalendarView();
        } else {
            console.error('Calendar functions not found');
        }
    }, 100);
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

