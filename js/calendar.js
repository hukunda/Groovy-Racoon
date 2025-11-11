// ============================================
// Groovy Racoon - Calendar View Logic (FullCalendar)
// ============================================

let calendar = null;

/**
 * Initialize FullCalendar
 */
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error('Calendar element not found');
        return;
    }
    
    if (calendar) {
        try {
            calendar.destroy();
        } catch (e) {
            console.warn('Error destroying calendar:', e);
        }
        calendar = null;
    }

    try {
        const events = getCalendarEvents();
        console.log('Initializing calendar with', events.length, 'events');
        
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'cs',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            events: events,
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
        console.log('Calendar rendered successfully');
    } catch (error) {
        console.error('Error initializing calendar:', error);
    }
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
    
    // Punk/Hardcore: #6B8E23
    if (genreLower.includes('punk') || genreLower.includes('hardcore') || genreLower.includes('oi!')) {
        return '#6B8E23';
    } 
    // Metal: #8B0000
    else if (genreLower.includes('metal') || genreLower.includes('death') || genreLower.includes('black metal') || genreLower.includes('thrash')) {
        return '#8B0000';
    } 
    // Jazz: #B8860B
    else if (genreLower.includes('jazz') || genreLower.includes('blues')) {
        return '#B8860B';
    } 
    // Noise/Post-Rock: #708090
    else if (genreLower.includes('noise') || genreLower.includes('post-rock') || genreLower.includes('postrock') || genreLower.includes('experimental') || genreLower.includes('ambient')) {
        return '#708090';
    } 
    // Post-Punk/Dark Wave: #4B0082
    else if (genreLower.includes('post-punk') || genreLower.includes('postpunk') || genreLower.includes('post punk') || genreLower.includes('dark wave') || genreLower.includes('darkwave')) {
        return '#4B0082';
    } 
    // Indie/Folk: #4682B4
    else if (genreLower.includes('indie') || genreLower.includes('alternative') || genreLower.includes('folk') || genreLower.includes('acoustic') || genreLower.includes('dream pop')) {
        return '#4682B4';
    } 
    // Electronic/Dark Synth: #008B8B
    else if (genreLower.includes('electronic') || genreLower.includes('synth') || genreLower.includes('dark synth') || genreLower.includes('techno')) {
        return '#008B8B';
    } 
    else {
        return '#B22222'; // Default primary color
    }
}

/**
 * Render calendar view
 */
function renderCalendarView() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Calendar element not found');
        return;
    }
    
    // Check if calendar view is actually visible
    const calendarView = document.getElementById('calendarView');
    if (!calendarView || calendarView.style.display === 'none' || !calendarView.classList.contains('active')) {
        console.log('Calendar view not visible, skipping render');
        return;
    }
    
    if (!calendar) {
        console.log('Initializing new calendar');
        initCalendar();
    } else {
        try {
            console.log('Updating existing calendar');
            calendar.removeAllEvents();
            const events = getCalendarEvents();
            console.log('Got events:', events.length);
            if (events && events.length > 0) {
                calendar.addEventSource(events);
            }
            calendar.render();
            console.log('Calendar rendered');
        } catch (err) {
            console.error('Error rendering calendar:', err);
            // Try to reinitialize
            try {
                calendar.destroy();
            } catch (e) {
                console.warn('Error destroying calendar:', e);
            }
            calendar = null;
            initCalendar();
        }
    }
}

/**
 * Show event modal with details
 */
async function showEventModal(event) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close');

    const props = event.extendedProps;

    // Reconstruct concert object from event
    const concert = {
        date: props.date || event.startStr,
        artist: event.title,
        genre: props.genre || '',
        venue: props.venue || '',
        promoter: props.promoter || '',
        ticketLink: props.ticketLink || '',
        fbLink: props.fbLink || '',
        parsedDate: event.start ? new Date(event.start) : null
    };
    
    const isInList = typeof isInMyList === 'function' ? isInMyList(concert) : false;
    
    modalTitle.textContent = event.title;
    modalBody.innerHTML = `
        <p><strong><i class="fas fa-calendar-alt"></i> Date:</strong> ${props.date || event.startStr}</p>
        <p><strong><i class="fas fa-music"></i> Genre:</strong> ${props.genre || 'N/A'}</p>
        <p><strong><i class="fas fa-building"></i> Venue:</strong> ${props.venue || 'N/A'}</p>
        <p><strong><i class="fas fa-ticket-alt"></i> Promoter:</strong> ${props.promoter || 'N/A'}</p>
        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="addToMyListBtn" class="add-to-list-btn" style="padding: 10px 20px; background: ${isInList ? 'var(--border)' : 'var(--primary)'}; color: var(--bg-secondary); border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                <i class="fas fa-${isInList ? 'check' : 'plus'}"></i> ${isInList ? 'In My List' : 'Add to My List'}
            </button>
            ${props.ticketLink && props.ticketLink !== 'N/A' 
                ? `<a href="${props.ticketLink}" class="glitch-link" target="_blank" rel="noopener noreferrer" style="padding: 10px 20px; background: var(--primary); color: var(--bg-secondary); text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-ticket-alt"></i> Get Tickets</a>` 
                : ''}
            ${props.fbLink && props.fbLink !== 'N/A' && !props.fbLink.includes('xxxxxxxx') 
                ? `<a href="${props.fbLink}" class="glitch-link" target="_blank" rel="noopener noreferrer" style="padding: 10px 20px; background: var(--primary); color: var(--bg-secondary); text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px;"><i class="fab fa-facebook"></i> Facebook Event</a>` 
                : ''}
        </div>
    `;
    
    // Add event listener for Add to My List button
    const addToMyListBtn = document.getElementById('addToMyListBtn');
    if (addToMyListBtn) {
        addToMyListBtn.addEventListener('click', function() {
            if (isInList) {
                if (typeof removeFromMyList === 'function') {
                    removeFromMyList(concert);
                    this.innerHTML = '<i class="fas fa-plus"></i> Add to My List';
                    this.style.background = 'var(--primary)';
                }
            } else {
                if (typeof addToMyList === 'function') {
                    addToMyList(concert);
                    this.innerHTML = '<i class="fas fa-check"></i> In My List';
                    this.style.background = 'var(--border)';
                }
            }
        });
    }

    modal.style.display = 'block';
    
    // Fetch Facebook event details if available
    if (props.fbLink && typeof enhanceModalWithFacebookData === 'function') {
        enhanceModalWithFacebookData(modalBody, props.fbLink);
    }

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

