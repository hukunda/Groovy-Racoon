// ============================================
// Groovy Racoon - Facebook API Integration
// ============================================

/**
 * Extract Facebook Event ID from URL
 */
function extractFacebookEventId(url) {
    if (!url || url === 'N/A' || url.includes('xxxxxxxx')) return null;
    
    // Try to extract event ID from various Facebook URL formats
    const patterns = [
        /facebook\.com\/events\/(\d+)/,
        /fb\.com\/events\/(\d+)/,
        /event_id=(\d+)/,
        /\/events\/(\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * Fetch Facebook event details
 * Note: This requires a Facebook App ID and Access Token
 * For public events, you can use the Graph API
 */
async function fetchFacebookEventDetails(eventId) {
    if (!eventId) return null;
    
    // Note: You'll need to set up a Facebook App and get an access token
    // For now, this is a placeholder that can be extended
    const FACEBOOK_APP_ID = ''; // Add your Facebook App ID
    const ACCESS_TOKEN = ''; // Add your access token (or use client-side token)
    
    if (!ACCESS_TOKEN) {
        console.log('Facebook API not configured');
        return null;
    }
    
    try {
        const url = `https://graph.facebook.com/v18.0/${eventId}?fields=name,description,cover,attending_count,interested_count,start_time,end_time,place&access_token=${ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Facebook API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            description: data.description || null,
            coverImage: data.cover?.source || null,
            attendingCount: data.attending_count || 0,
            interestedCount: data.interested_count || 0,
            place: data.place?.name || null,
            startTime: data.start_time || null,
            endTime: data.end_time || null
        };
    } catch (error) {
        console.warn('Error fetching Facebook event details:', error);
        return null;
    }
}

/**
 * Enhanced modal with Facebook data
 */
async function enhanceModalWithFacebookData(modalBody, fbLink) {
    const eventId = extractFacebookEventId(fbLink);
    if (!eventId) return;
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'fb-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading event details...';
    modalBody.appendChild(loadingDiv);
    
    const fbData = await fetchFacebookEventDetails(eventId);
    
    // Remove loading indicator
    loadingDiv.remove();
    
    if (fbData) {
        const fbSection = document.createElement('div');
        fbSection.className = 'fb-event-details';
        fbSection.style.marginTop = '20px';
        fbSection.style.paddingTop = '20px';
        fbSection.style.borderTop = '1px solid var(--border)';
        
        let html = '<h3 style="color: var(--primary); margin-bottom: 15px;"><i class="fab fa-facebook"></i> Event Details</h3>';
        
        if (fbData.coverImage) {
            html += `<img src="${fbData.coverImage}" alt="Event cover" style="width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 15px;">`;
        }
        
        if (fbData.description) {
            html += `<p style="margin-bottom: 15px; line-height: 1.6;">${escapeHtml(fbData.description.substring(0, 300))}${fbData.description.length > 300 ? '...' : ''}</p>`;
        }
        
        if (fbData.attendingCount > 0 || fbData.interestedCount > 0) {
            html += `<p style="color: var(--text-secondary); font-size: 0.9em;">`;
            if (fbData.attendingCount > 0) {
                html += `<i class="fas fa-users"></i> ${fbData.attendingCount} attending`;
            }
            if (fbData.interestedCount > 0) {
                html += ` | <i class="fas fa-heart"></i> ${fbData.interestedCount} interested`;
            }
            html += `</p>`;
        }
        
        fbSection.innerHTML = html;
        modalBody.appendChild(fbSection);
    }
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

