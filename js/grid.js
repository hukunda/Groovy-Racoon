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
 * Uses Last.fm API first (most reliable), then Google Images
 */
async function fetchImageFromMultipleSources(artistName) {
    // Strategy 1: Try Last.fm API first (most reliable and fast)
    try {
        // Clean artist name - remove extra characters like (FR), +, etc.
        const cleanName = artistName
            .split('(')[0]
            .split('+')[0]
            .split('/')[0]
            .trim();
        
        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(cleanName)}&api_key=b25b959554ed76058ac220b7b2e0a026&format=json`;
        
        const response = await Promise.race([
            fetch(lastFmUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        if (response.ok) {
            const data = await response.json();
            if (data.artist && data.artist.image && data.artist.image.length > 0) {
                // Get the largest image (usually the last one, size "extralarge" or "large")
                const images = data.artist.image.filter(img => img['#text'] && img['#text'].length > 0);
                if (images.length > 0) {
                    // Try to get extralarge first, then large, then medium
                    let imageUrl = null;
                    for (let i = images.length - 1; i >= 0; i--) {
                        const url = images[i]['#text'];
                        if (url && !url.includes('noimage') && !url.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                            imageUrl = url;
                            break;
                        }
                    }
                    
                    if (imageUrl) {
                        // Quick verification (skip verification for speed - Last.fm URLs are usually reliable)
                        console.log(`✓ Found Last.fm image for ${artistName}`);
                        return imageUrl;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`Last.fm failed for ${artistName}, trying Google Images...`);
    }

    // Strategy 2: Try Google Images (slower, less reliable)
    try {
        const googleImageUrl = await Promise.race([
            fetchGoogleImage(artistName),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (googleImageUrl) {
            // Quick verification
            const verified = await verifyImage(googleImageUrl, 2000);
            if (verified) {
                console.log(`✓ Found Google Image for ${artistName}`);
                return googleImageUrl;
            }
        }
    } catch (error) {
        console.log(`Google Images failed for ${artistName}`);
    }
    
    // Strategy 3: Use a smart placeholder with artist initials (instant fallback)
    return getPlaceholderImage(artistName);
}

/**
 * Fetch first image from Google Images for artist/band
 * Uses a CORS proxy to fetch Google Images search results
 * Extracts the first image URL from the search results
 */
async function fetchGoogleImage(artistName) {
    try {
        // Clean artist name - remove extra characters like (FR), +, etc.
        const cleanName = artistName
            .split('(')[0]
            .split('+')[0]
            .split('/')[0]
            .trim();
        
        const searchQuery = encodeURIComponent(`${cleanName} band music concert`);
        
        // Use a CORS proxy to fetch Google Images search
        // Try multiple proxy services for reliability
        const proxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${searchQuery}&tbm=isch&safe=active&tbs=isz:m`)}`,
            `https://corsproxy.io/?${encodeURIComponent(`https://www.google.com/search?q=${searchQuery}&tbm=isch&safe=active&tbs=isz:m`)}`
        ];
        
        for (const proxyUrl of proxies) {
            try {
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    let html = '';
                    
                    // Handle different proxy response formats
                    if (proxyUrl.includes('allorigins.win')) {
                        const data = await response.json();
                        html = data.contents || '';
                    } else {
                        html = await response.text();
                    }
                    
                    if (!html) continue;
                    
                    // Google Images stores image data in JSON format within the page
                    // Pattern 1: Look for "ou" field in JSON data (original image URL) - most reliable
                    const ouPattern = /"ou":"([^"]+)"/g;
                    const ouMatches = [...html.matchAll(ouPattern)];
                    
                    for (const match of ouMatches) {
                        if (match[1]) {
                            let imageUrl = match[1]
                                .replace(/\\u003d/g, '=')
                                .replace(/\\u0026/g, '&')
                                .replace(/\\\//g, '/')
                                .replace(/\\"/g, '"');
                            
                            // Decode URL encoding
                            try {
                                imageUrl = decodeURIComponent(imageUrl);
                            } catch (e) {
                                // If decode fails, use as-is
                            }
                            
                            // Verify it's a valid image URL
                            if (imageUrl.startsWith('http') && 
                                (imageUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$|#)/i) || 
                                 imageUrl.includes('googleusercontent.com') ||
                                 imageUrl.includes('imgur.com') ||
                                 imageUrl.includes('bandcamp.com'))) {
                                return imageUrl;
                            }
                        }
                    }
                    
                    // Pattern 2: Look for "ow" field (original width) which often comes with "ou"
                    const owPattern = /"ow":\d+,"ou":"([^"]+)"/g;
                    const owMatches = [...html.matchAll(owPattern)];
                    for (const match of owMatches) {
                        if (match[1]) {
                            let imageUrl = match[1]
                                .replace(/\\u003d/g, '=')
                                .replace(/\\u0026/g, '&')
                                .replace(/\\\//g, '/');
                            
                            if (imageUrl.startsWith('http')) {
                                return imageUrl;
                            }
                        }
                    }
                    
                    // Pattern 3: Look for direct image URLs in img tags
                    const imgTagPattern = /<img[^>]+src=["'](https:\/\/[^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/i;
                    const imgMatch = html.match(imgTagPattern);
                    if (imgMatch && imgMatch[1]) {
                        return imgMatch[1];
                    }
                    
                    // Pattern 4: Look for data-src attributes (lazy loading)
                    const dataSrcPattern = /data-src=["'](https:\/\/[^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/i;
                    const dataSrcMatch = html.match(dataSrcPattern);
                    if (dataSrcMatch && dataSrcMatch[1]) {
                        return dataSrcMatch[1];
                    }
                }
            } catch (proxyError) {
                // Try next proxy
                continue;
            }
        }
    } catch (error) {
        console.log(`Error fetching Google Image for ${artistName}:`, error.message);
    }
    
    return null;
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
    if (!artistName) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMkQyRDJEIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0IyMjIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1VU0lDPC90ZXh0Pjwvc3ZnPg==';
    
    const initials = artistName
        .split(/[\s+&,]/)
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .map(word => word[0])
        .filter(char => char && /[A-Za-z0-9]/.test(char))
        .join('')
        .substring(0, 2)
        .toUpperCase() || artistName.substring(0, 2).toUpperCase();
    
    // Create SVG placeholder with initials (no CORS issues)
    const colors = ['#1a1a1a', '#2d2d2d', '#3a3a3a', '#4a4a4a'];
    const textColor = '#B22222';
    const bgColor = colors[initials.charCodeAt(0) % colors.length];
    
    // Create SVG data URL
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${bgColor}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
                  fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initials}</text>
        </svg>
    `.trim();
    
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
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

    // Render all concerts at once (no grouping)
    if (sortedConcerts.length > 0) {
        console.log(`Rendering ${sortedConcerts.length} concerts in grid view`);
        
        // Render all events without section header
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'events-cards-container';
        
        // Render cards with placeholder images first, then load real images in background
        for (let i = 0; i < sortedConcerts.length; i++) {
            const concert = sortedConcerts[i];
            try {
                // Create card with placeholder first (instant)
                const card = await createEventCardFast(concert);
                if (card) {
                    cardsContainer.appendChild(card);
                    
                    // Load real image in background (non-blocking) - don't await
                    loadImageInBackground(card, concert.artist).catch(err => {
                        console.log(`Background image load for ${concert.artist} failed:`, err.message);
                    });
                }
            } catch (error) {
                console.error(`Error creating card for ${concert.artist}:`, error);
            }
        }
        
        gridContainer.appendChild(cardsContainer);
        console.log(`Grid view rendered with ${cardsContainer.children.length} cards`);
    } else {
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
 * Create an event card element quickly with placeholder
 * Real images load in background
 */
async function createEventCardFast(concert) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Check if in My List
    const isInList = typeof isInMyList === 'function' ? isInMyList(concert) : false;
    if (isInList) {
        card.classList.add('in-my-list');
    }

    // Use placeholder immediately (no waiting)
    const imageUrl = getPlaceholderImage(concert.artist);
    
    // Format date properly
    let dateStr = 'TBA';
    if (concert.parsedDate) {
        const date = new Date(concert.parsedDate);
        if (!isNaN(date.getTime())) {
            dateStr = formatCardDate(date);
        }
    } else if (concert.date) {
        dateStr = concert.date;
    }
    
    const genreColor = typeof getGenreColor === 'function' ? getGenreColor(concert.genre) : '#B22222';
    
    // Create card HTML (no clickable links)
    card.innerHTML = `
        <div class="event-card-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(concert.artist)}" class="event-card-image" loading="lazy" data-artist="${escapeHtml(concert.artist)}">
            <div class="event-card-checkbox" title="${isInList ? 'Remove from My List' : 'Add to My List'}">
                <input type="checkbox" class="event-checkbox" ${isInList ? 'checked' : ''} 
                       data-artist="${escapeHtml(concert.artist)}" 
                       data-date="${escapeHtml(concert.date)}"
                       title="${isInList ? 'Remove from My List' : 'Add to My List'}">
            </div>
            ${concert.genre ? `<div class="event-card-genre" style="background-color: ${genreColor};">${escapeHtml(concert.genre)}</div>` : ''}
        </div>
        <div class="event-card-content">
            <h3 class="event-card-title">
                ${escapeHtml(concert.artist)}
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

    // Add checkbox event listener - prevent link click when clicking checkbox
    const checkbox = card.querySelector('.event-checkbox');
    if (checkbox) {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
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
            // Update card appearance and tooltip
            if (this.checked) {
                card.classList.add('in-my-list');
                this.title = 'Remove from My List';
                if (checkboxContainer) checkboxContainer.title = 'Remove from My List';
            } else {
                card.classList.remove('in-my-list');
                this.title = 'Add to My List';
                if (checkboxContainer) checkboxContainer.title = 'Add to My List';
            }
        });
    }
    
    // Prevent link click when clicking on checkbox container
    const checkboxContainer = card.querySelector('.event-card-checkbox');
    if (checkboxContainer) {
        checkboxContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (checkbox) checkbox.click();
        });
    }

    return card;
}

/**
 * Load real image in background and update card when ready
 * This allows cards to render instantly while images load asynchronously
 */
async function loadImageInBackground(card, artistName) {
    try {
        const img = card.querySelector('.event-card-image');
        const imageContainer = card.querySelector('.event-card-image-container');
        if (!img || !imageContainer) {
            return;
        }
        
        // Get real image (with timeout)
        const realImageUrl = await Promise.race([
            getArtistImage(artistName),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
        ]);
        
        // Only update if we got a different (non-placeholder) image
        if (realImageUrl && !realImageUrl.startsWith('data:image/svg')) {
            // Directly update the image - browser will handle loading
            img.src = realImageUrl;
            img.onerror = () => {
                // If real image fails, remove image container entirely
                if (imageContainer) {
                    imageContainer.style.display = 'none';
                }
            };
        } else {
            // No real image found, remove image container
            if (imageContainer) {
                imageContainer.style.display = 'none';
            }
        }
    } catch (error) {
        // Remove image container if loading fails
        const imageContainer = card.querySelector('.event-card-image-container');
        if (imageContainer) {
            imageContainer.style.display = 'none';
        }
    }
}

/**
 * Escape HTML to prevent XSS
 */
/**
 * Format date for card display (readable format)
 */
function formatCardDate(date) {
    if (!date || isNaN(date.getTime())) return 'TBA';
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return `${day} ${month} ${year}, ${dayOfWeek}`;
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
