// ============================================
// Groovy Racoon - Create List & ICS Export
// ============================================

let selectedEvents = [];

// DOM elements
let createListBtn, listModal, closeListModal, eventCheckboxes, exportICSBtn, clearListBtn, selectedCount;

function initListElements() {
    createListBtn = document.getElementById('createListBtn');
    listModal = document.getElementById('listModal');
    closeListModal = document.querySelector('.close-list-modal');
    eventCheckboxes = document.getElementById('eventCheckboxes');
    exportICSBtn = document.getElementById('exportICSBtn');
    clearListBtn = document.getElementById('clearListBtn');
    selectedCount = document.getElementById('selectedCount');
    
    // Event listeners
    if (createListBtn) {
        createListBtn.addEventListener('click', openListModal);
    }
    
    if (closeListModal) {
        closeListModal.addEventListener('click', closeListModalHandler);
    }
    
    if (exportICSBtn) {
        exportICSBtn.addEventListener('click', exportToICS);
    }
    
    if (clearListBtn) {
        clearListBtn.addEventListener('click', clearSelectedEvents);
    }
    
    // Close modal when clicking outside
    if (listModal) {
        window.addEventListener('click', function(event) {
            if (event.target === listModal) {
                closeListModalHandler();
            }
        });
    }
}

/**
 * Open the list creation modal
 */
function openListModal() {
    if (!listModal || !eventCheckboxes) return;
    
    // Populate checkboxes with filtered events
    populateEventCheckboxes();
    
    // Update selected count
    updateSelectedCount();
    
    // Show modal
    listModal.style.display = 'block';
}

/**
 * Close the list modal
 */
function closeListModalHandler() {
    if (listModal) {
        listModal.style.display = 'none';
    }
}

/**
 * Populate event checkboxes
 */
function populateEventCheckboxes() {
    if (!eventCheckboxes || !window.filteredConcerts) return;
    
    eventCheckboxes.innerHTML = '';
    
    // Sort events by date
    const sortedEvents = [...window.filteredConcerts].sort((a, b) => {
        if (!a.parsedDate && !b.parsedDate) return 0;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
    });
    
    sortedEvents.forEach((concert, index) => {
        const item = document.createElement('div');
        item.className = 'event-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `event-${index}`;
        checkbox.value = JSON.stringify(concert);
        checkbox.checked = selectedEvents.some(e => 
            e.artist === concert.artist && 
            e.date === concert.date && 
            e.venue === concert.venue
        );
        checkbox.addEventListener('change', handleCheckboxChange);
        
        const label = document.createElement('label');
        label.htmlFor = `event-${index}`;
        label.textContent = concert.artist || 'Untitled Event';
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'event-date';
        dateSpan.textContent = concert.date || 'TBA';
        
        const venueSpan = document.createElement('span');
        venueSpan.className = 'event-venue';
        venueSpan.textContent = concert.venue || 'TBA';
        
        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(dateSpan);
        item.appendChild(venueSpan);
        
        eventCheckboxes.appendChild(item);
    });
}

/**
 * Handle checkbox change
 */
function handleCheckboxChange(event) {
    const concert = JSON.parse(event.target.value);
    
    if (event.target.checked) {
        // Add to selected events if not already present
        if (!selectedEvents.some(e => 
            e.artist === concert.artist && 
            e.date === concert.date && 
            e.venue === concert.venue
        )) {
            selectedEvents.push(concert);
        }
    } else {
        // Remove from selected events
        selectedEvents = selectedEvents.filter(e => 
            !(e.artist === concert.artist && 
              e.date === concert.date && 
              e.venue === concert.venue)
        );
    }
    
    updateSelectedCount();
}

/**
 * Update selected count display
 */
function updateSelectedCount() {
    if (selectedCount) {
        selectedCount.textContent = `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''} selected`;
    }
    
    if (exportICSBtn) {
        exportICSBtn.disabled = selectedEvents.length === 0;
    }
    
    if (clearListBtn) {
        clearListBtn.disabled = selectedEvents.length === 0;
    }
}

/**
 * Clear selected events
 */
function clearSelectedEvents() {
    selectedEvents = [];
    
    // Uncheck all checkboxes
    const checkboxes = eventCheckboxes.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
}

/**
 * Export selected events to ICS file
 */
function exportToICS() {
    if (selectedEvents.length === 0) return;
    
    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Groovy Racoon//Event Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    
    selectedEvents.forEach(concert => {
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
    link.download = 'groovy-racoon-events.ics';
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

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListElements);
} else {
    initListElements();
}

