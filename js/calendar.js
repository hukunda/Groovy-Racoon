// ============================================
// Groovy Racoon - Calendar View Logic (FullCalendar)
// ============================================

let calendar = null;

/**
 * Initialize FullCalendar
 */
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    if (calendar) {
        calendar.destroy();
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'cs',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        events: getCalendarEvents(),
        eventClick: function(info) {
            showEventModal(info.event);
            info.jsEvent.preventDefault();
        },
        eventDisplay: 'block',
        dayMaxEvents: 3,
        moreLinkClick: 'popover',
        eventTextColor: '#FFFFFF',
        height: 'auto'
    });

    calendar.render();
}

/**
 * Convert filtered concerts to FullCalendar events
 */
function getCalendarEvents() {
    if (!window.filteredConcerts) return [];

    return window.filteredConcerts
        .filter(concert => concert.parsedDate)
        .map(concert => {
            const date = new Date(concert.parsedDate);
            const color = getGenreColor(concert.genre);

            return {
                title: concert.artist,
                start: date.toISOString().split('T')[0],
                extendedProps: {
                    genre: concert.genre,
                    venue: concert.venue,
                    promoter: concert.promoter,
                    ticketLink: concert.ticketLink,
                    fbLink: concert.fbLink,
                    date: concert.date
                },
                backgroundColor: color,
                borderColor: color
            };
        });
}

/**
 * Get color based on genre (grungy underground palette)
 */
function getGenreColor(genre) {
    if (!genre) return '#B22222'; // Default primary

    const genreLower = genre.toLowerCase();
    
    // Punk/Hardcore
    if (genreLower.includes('punk') || genreLower.includes('hardcore') || genreLower.includes('oi!')) {
        return '#6B8E23'; // Olive Green
    } 
    // Metal
    else if (genreLower.includes('metal') || genreLower.includes('death') || genreLower.includes('black metal') || genreLower.includes('thrash')) {
        return '#8B0000'; // Dark Red
    } 
    // Jazz
    else if (genreLower.includes('jazz') || genreLower.includes('blues')) {
        return '#B8860B'; // Dark Goldenrod
    } 
    // Noise/Experimental
    else if (genreLower.includes('noise') || genreLower.includes('experimental') || genreLower.includes('ambient') || genreLower.includes('avant-garde')) {
        return '#708090'; // Slate Gray
    } 
    // Post-Punk
    else if (genreLower.includes('post-punk') || genreLower.includes('postpunk') || genreLower.includes('post punk')) {
        return '#4B0082'; // Indigo
    } 
    // Indie
    else if (genreLower.includes('indie') || genreLower.includes('alternative') || genreLower.includes('folk') || genreLower.includes('acoustic') || genreLower.includes('dream pop')) {
        return '#4682B4'; // Steel Blue
    } 
    // Electronic
    else if (genreLower.includes('electronic') || genreLower.includes('synth') || genreLower.includes('dark synth') || genreLower.includes('techno')) {
        return '#008B8B'; // Dark Cyan
    } 
    // Rock
    else if (genreLower.includes('rock') || genreLower.includes('psychedelic') || genreLower.includes('krautrock')) {
        return '#B22222'; // Firebrick (primary)
    } 
    // Hip Hop
    else if (genreLower.includes('hip hop') || genreLower.includes('rap')) {
        return '#B22222'; // Firebrick (primary)
    } 
    else {
        return '#B22222'; // Default primary color
    }
}

/**
 * Render calendar view
 */
function renderCalendarView() {
    if (!calendar) {
        initCalendar();
    } else {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
        calendar.render();
    }
}

/**
 * Show event modal with details
 */
function showEventModal(event) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close');

    const props = event.extendedProps;

    modalTitle.textContent = event.title;
    modalBody.innerHTML = `
        <p><strong>📅 Date:</strong> ${props.date || event.startStr}</p>
        <p><strong>🎵 Genre:</strong> ${props.genre || 'N/A'}</p>
        <p><strong>🏢 Venue:</strong> ${props.venue || 'N/A'}</p>
        <p><strong>🎪 Promoter:</strong> ${props.promoter || 'N/A'}</p>
        <div style="margin-top: 20px;">
            ${props.ticketLink && props.ticketLink !== 'N/A' 
                ? `<a href="${props.ticketLink}" class="glitch-link" target="_blank" rel="noopener noreferrer">🎫 Get Tickets</a>` 
                : ''}
            ${props.fbLink && props.fbLink !== 'N/A' && !props.fbLink.includes('xxxxxxxx') 
                ? `<a href="${props.fbLink}" class="glitch-link" target="_blank" rel="noopener noreferrer">📘 Facebook Event</a>` 
                : ''}
        </div>
    `;

    modal.style.display = 'block';

    // Close modal handlers
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

