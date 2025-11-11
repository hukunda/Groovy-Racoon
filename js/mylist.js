// ============================================
// Groovy Racoon - My List Functionality
// ============================================

// Global My List storage
window.myList = JSON.parse(localStorage.getItem('groovyRacoonMyList') || '[]');

// DOM elements
let myListContent, myListCount, exportMyListICSBtn;

function initMyListElements() {
    myListContent = document.getElementById('myListContent');
    myListCount = document.getElementById('myListCount');
    exportMyListICSBtn = document.getElementById('exportMyListICS');
    
    if (exportMyListICSBtn) {
        exportMyListICSBtn.addEventListener('click', exportMyListToICS);
    }
    
    updateMyListCount();
}

/**
 * Add event to My List
 */
function addToMyList(concert) {
    // Check if already in list
    const exists = window.myList.some(item => 
        item.artist === concert.artist && 
        item.date === concert.date && 
        item.venue === concert.venue
    );
    
    if (!exists) {
        window.myList.push(concert);
        saveMyList();
        updateMyListCount();
        if (typeof renderMyList === 'function') {
            renderMyList();
        }
    }
}

/**
 * Remove event from My List
 */
function removeFromMyList(concert) {
    window.myList = window.myList.filter(item => 
        !(item.artist === concert.artist && 
          item.date === concert.date && 
          item.venue === concert.venue)
    );
    saveMyList();
    updateMyListCount();
    renderMyList();
    
    // Update checkboxes in table/calendar if visible
    if (typeof renderTableView === 'function') {
        renderTableView();
    }
}

/**
 * Check if event is in My List
 */
function isInMyList(concert) {
    return window.myList.some(item => 
        item.artist === concert.artist && 
        item.date === concert.date && 
        item.venue === concert.venue
    );
}

/**
 * Save My List to localStorage
 */
function saveMyList() {
    localStorage.setItem('groovyRacoonMyList', JSON.stringify(window.myList));
}

/**
 * Update My List count badge
 */
function updateMyListCount() {
    if (myListCount) {
        myListCount.textContent = window.myList.length;
        if (window.myList.length === 0) {
            myListCount.style.display = 'none';
        } else {
            myListCount.style.display = 'inline-block';
        }
    }
}

/**
 * Render My List pane
 */
function renderMyList() {
    if (!myListContent) return;
    
    if (window.myList.length === 0) {
        myListContent.innerHTML = '<p class="empty-list-message">No events in your list yet. Select events from All Gigs to add them here.</p>';
        return;
    }
    
    // Sort by date
    const sortedList = [...window.myList].sort((a, b) => {
        if (!a.parsedDate && !b.parsedDate) return 0;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
    });
    
    myListContent.innerHTML = '';
    
    sortedList.forEach(concert => {
        const item = document.createElement('div');
        item.className = 'my-list-item';
        
        const info = document.createElement('div');
        info.className = 'my-list-item-info';
        
        const title = document.createElement('h4');
        const eventUrl = typeof getEventPageUrl === 'function' ? getEventPageUrl(concert) : '#';
        title.innerHTML = `<a href="${eventUrl}" class="glitch-link" style="color: var(--text-primary); text-decoration: none;">${escapeHtml(concert.artist || 'Untitled Event')}</a>`;
        
        const details = document.createElement('p');
        details.innerHTML = `
            <i class="fas fa-calendar-alt"></i> ${escapeHtml(concert.date || 'TBA')} | 
            <i class="fas fa-building"></i> ${escapeHtml(concert.venue || 'TBA')} | 
            <i class="fas fa-music"></i> ${escapeHtml(concert.genre || 'N/A')}
        `;
        
        info.appendChild(title);
        info.appendChild(details);
        
        const actions = document.createElement('div');
        actions.className = 'my-list-item-actions';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-from-list-btn';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
        removeBtn.onclick = () => removeFromMyList(concert);
        
        actions.appendChild(removeBtn);
        
        item.appendChild(info);
        item.appendChild(actions);
        myListContent.appendChild(item);
    });
}

/**
 * Export My List to ICS
 */
function exportMyListToICS() {
    if (window.myList.length === 0) return;
    
    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Groovy Racoon//My List//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    
    window.myList.forEach(concert => {
        if (!concert.parsedDate) return;
        
        const date = new Date(concert.parsedDate);
        const startDate = formatICSDate(date);
        const endDate = formatICSDate(new Date(date.getTime() + 3 * 60 * 60 * 1000)); // 3 hours later
        
        icsContent += 'BEGIN:VEVENT\r\n';
        icsContent += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@groovyracoon.com\r\n`;
        icsContent += `DTSTART:${startDate}\r\n`;
        icsContent += `DTEND:${endDate}\r\n`;
        icsContent += `SUMMARY:${escapeICS(concert.artist || 'Event')}\r\n`;
        
        let description = '';
        if (concert.genre) description += `Genre: ${concert.genre}\\n`;
        if (concert.venue) description += `Venue: ${concert.venue}\\n`;
        if (concert.promoter) description += `Promoter: ${concert.promoter}\\n`;
        if (concert.ticketLink) description += `Tickets: ${concert.ticketLink}\\n`;
        if (concert.fbLink) description += `Facebook: ${concert.fbLink}\\n`;
        
        if (description) {
            icsContent += `DESCRIPTION:${escapeICS(description)}\r\n`;
        }
        
        if (concert.venue) {
            icsContent += `LOCATION:${escapeICS(concert.venue)}\r\n`;
        }
        
        icsContent += 'END:VEVENT\r\n';
    });
    
    icsContent += 'END:VCALENDAR\r\n';
    
    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'groovy-racoon-my-list.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Format date for ICS (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for ICS format
 */
function escapeICS(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMyListElements);
} else {
    initMyListElements();
}

