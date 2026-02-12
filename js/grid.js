// ============================================
// Groovy Racoon - Grid View Logic (Card-based)
// ============================================

// Cache for artist images
const imageCache = {};

/**
 * Get image URL for artist/band from Google Images
 * Uses multiple fallback strategies to find band images
 */
async function getArtistImage(artistName) {
    if (!artistName || artistName.trim() === '') {
        return getPlaceholderImage('Band');
    }

    // Check cache first
    if (imageCache[artistName]) {
        return imageCache[artistName];
    }

    // Try multiple image sources
    const imageUrl = await fetchImageFromMultipleSources(artistName);
    imageCache[artistName] = imageUrl;
    return imageUrl;
}


/**
 * Try multiple image sources to find band/artist images
 */
async function fetchImageFromMultipleSources(artistName) {
    // Strategy 1: Try Last.fm API (free, no key needed for basic image fetching)
    // Last.fm provides artist images via their API
    try {
        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=b25b959554ed76058ac220b7b2e0a026&format=json`;
        
        const response = await fetch(lastFmUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.artist && data.artist.image && data.artist.image.length > 0) {
                // Get the largest image (usually the last one)
                const images = data.artist.image.filter(img => img['#text']);
                if (images.length > 0) {
                    const imageUrl = images[images.length - 1]['#text'];
                    if (imageUrl && !imageUrl.includes('noimage')) {
                        // Verify image loads
                        const verified = await verifyImage(imageUrl);
                        if (verified) {
                            return imageUrl;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(`Last.fm API failed for ${artistName}, trying alternatives...`);
    }

    // Strategy 2: Try Unsplash with music keywords
    try {
        const unsplashUrl = `https://source.unsplash.com/400x300/?music,concert,band,${encodeURIComponent(artistName)}`;
        const verified = await verifyImage(unsplashUrl, 1500);
        if (verified) {
            return unsplashUrl;
        }
    } catch (error) {
        console.log(`Unsplash failed for ${artistName}`);
    }

    // Strategy 3: Use a smart placeholder with artist initials
    return getPlaceholderImage(artistName);
}

/**
 * Verify that an image URL actually loads
 */
function verifyImage(url, timeout = 2000) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const timer = setTimeout(() => {
            resolve(false);
        }, timeout);
        
        img.onload = () => {
            clearTimeout(timer);
            resolve(true);
        };
        
        img.onerror = () => {
            clearTimeout(timer);
            resolve(false);
        };
        
        img.src = url;
    });
}

/**
 * Get placeholder image with artist name/initials
 * Creates a nice gradient placeholder with artist initials
 */
function getPlaceholderImage(artistName) {
    const initials = artistName
        .split(' ')
        .map(word => word[0])
        .filter(char => char && /[A-Za-z]/.test(char))
        .join('')
        .substring(0, 2)
        .toUpperCase() || artistName.substring(0, 2).toUpperCase();
    
    // Use a service that creates nice gradient placeholders
    // Using placeholder.com with a music-themed color scheme
    const colors = ['1a1a1a', '2d2d2d', '3a3a3a'];
    const textColor = 'B22222';
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    return `https://via.placeholder.com/400x300/${bgColor}/${textColor}?text=${encodeURIComponent(initials || artistName.substring(0, 15))}`;
}

/**
 * Render grid view with event cards
 */
async function renderGridView() {
    const gridContainer = document.getElementById('eventsGrid');
    if (!gridContainer) return;

    // Clear existing content
    gridContainer.innerHTML = '';

    if (!window.filteredConcerts || window.filteredConcerts.length === 0) {
        gridContainer.innerHTML = '<div class="no-events-message"><p>No concerts found. Try adjusting your filters.</p></div>';
        return;
    }

    // Sort concerts by date
    const sortedConcerts = [...window.filteredConcerts].sort((a, b) => {
        if (!a.parsedDate && !b.parsedDate) return 0;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
    });

    // Group concerts by date (Today, Tomorrow, Upcoming)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = [];
    const tomorrowEvents = [];
    const upcomingEvents = [];

    sortedConcerts.forEach(concert => {
        if (!concert.parsedDate) {
            upcomingEvents.push(concert);
            return;
        }

        const eventDate = new Date(concert.parsedDate);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate.getTime() === today.getTime()) {
            todayEvents.push(concert);
        } else if (eventDate.getTime() === tomorrow.getTime()) {
            tomorrowEvents.push(concert);
        } else {
            upcomingEvents.push(concert);
        }
    });

    // Render sections
    if (todayEvents.length > 0) {
        renderEventSection(gridContainer, 'Today', todayEvents);
    }
    if (tomorrowEvents.length > 0) {
        renderEventSection(gridContainer, 'Tomorrow', tomorrowEvents);
    }
    if (upcomingEvents.length > 0) {
        renderEventSection(gridContainer, 'Upcoming', upcomingEvents);
    }

    // If no events in any category, show message
    if (todayEvents.length === 0 && tomorrowEvents.length === 0 && upcomingEvents.length === 0) {
        gridContainer.innerHTML = '<div class="no-events-message"><p>No concerts found. Try adjusting your filters.</p></div>';
    }
}

/**
 * Render a section of events (Today, Tomorrow, etc.)
 */
async function renderEventSection(container, sectionTitle, events) {
    const section = document.createElement('div');
    section.className = 'events-section';

    const header = document.createElement('div');
    header.className = 'events-section-header';
    header.innerHTML = `
        <h2 class="events-section-title">${sectionTitle}</h2>
        ${events.length > 6 ? '<a href="#" class="see-all-link">See all</a>' : ''}
    `;
    section.appendChild(header);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'events-cards-container';

    // Render first 6 events (or all if less than 6)
    const eventsToShow = events.slice(0, 6);
    
    for (const concert of eventsToShow) {
        const card = await createEventCard(concert);
        cardsContainer.appendChild(card);
    }

    section.appendChild(cardsContainer);
    container.appendChild(section);
}

/**
 * Create an event card element
 */
async function createEventCard(concert) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Check if in My List
    const isInList = typeof isInMyList === 'function' ? isInMyList(concert) : false;
    if (isInList) {
        card.classList.add('in-my-list');
    }

    // Get image
    const imageUrl = await getArtistImage(concert.artist);
    
    // Format date
    const dateStr = concert.date || 'TBA';
    const genreColor = typeof getGenreColor === 'function' ? getGenreColor(concert.genre) : '#B22222';
    
    // Create card HTML
    card.innerHTML = `
        <div class="event-card-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(concert.artist)}" class="event-card-image" loading="lazy">
            <div class="event-card-checkbox">
                <input type="checkbox" class="event-checkbox" ${isInList ? 'checked' : ''} 
                       data-artist="${escapeHtml(concert.artist)}" 
                       data-date="${escapeHtml(concert.date)}">
            </div>
            ${concert.genre ? `<div class="event-card-genre" style="background-color: ${genreColor};">${escapeHtml(concert.genre)}</div>` : ''}
        </div>
        <div class="event-card-content">
            <h3 class="event-card-title">
                <a href="${typeof getEventPageUrl === 'function' ? getEventPageUrl(concert) : '#'}" class="event-card-link">
                    ${escapeHtml(concert.artist)}
                </a>
            </h3>
            <div class="event-card-details">
                <div class="event-card-detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${escapeHtml(dateStr)}</span>
                </div>
                <div class="event-card-detail-item">
                    <i class="fas fa-building"></i>
                    <span>${escapeHtml(concert.venue || 'TBA')}</span>
                </div>
                ${concert.promoter ? `
                <div class="event-card-detail-item">
                    <i class="fas fa-ticket-alt"></i>
                    <span>${escapeHtml(concert.promoter)}</span>
                </div>
                ` : ''}
            </div>
            <div class="event-card-actions">
                ${concert.ticketLink && concert.ticketLink !== 'N/A' ? `
                    <a href="${escapeHtml(concert.ticketLink)}" class="event-card-button tickets-btn" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-ticket-alt"></i> Tickets
                    </a>
                ` : ''}
                ${concert.fbLink && concert.fbLink !== 'N/A' && !concert.fbLink.includes('xxxxxxxx') ? `
                    <a href="${escapeHtml(concert.fbLink)}" class="event-card-button facebook-btn" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-facebook"></i> Facebook
                    </a>
                ` : ''}
            </div>
        </div>
    `;

    // Add checkbox event listener
    const checkbox = card.querySelector('.event-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (typeof addToMyList === 'function') {
                    addToMyList(concert);
                }
            } else {
                if (typeof removeFromMyList === 'function') {
                    removeFromMyList(concert);
                }
            }
            // Update card appearance
            if (this.checked) {
                card.classList.add('in-my-list');
            } else {
                card.classList.remove('in-my-list');
            }
        });
    }

    return card;
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
