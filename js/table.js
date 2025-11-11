// ============================================
// Groovy Racoon - Table View Logic (DataTables)
// ============================================

let dataTable = null;

/**
 * Render table view using DataTables
 */
function renderTableView() {
    const tableBody = document.getElementById('concertsTableBody');
    
    // Clear existing table
    tableBody.innerHTML = '';

    if (!window.filteredConcerts || window.filteredConcerts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No concerts found</td></tr>';
        if (dataTable) {
            try {
                dataTable.destroy();
            } catch (e) {
                console.warn('Error destroying DataTable:', e);
            }
            dataTable = null;
        }
        return;
    }

    // Sort concerts by date
    const sortedConcerts = [...window.filteredConcerts].sort((a, b) => {
        if (!a.parsedDate && !b.parsedDate) return 0;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate - b.parsedDate;
    });

    // Populate table
    sortedConcerts.forEach((concert, index) => {
        const genreColor = getGenreColor(concert.genre);
        const row = document.createElement('tr');
        
        // Checkbox for My List
        const isInList = typeof isInMyList === 'function' ? isInMyList(concert) : false;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isInList;
        checkbox.className = 'event-checkbox';
        checkbox.dataset.index = index;
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
        });
        
        const checkboxCell = document.createElement('td');
        checkboxCell.style.textAlign = 'center';
        checkboxCell.appendChild(checkbox);
        
        // Event name - clickable to event page
        const eventUrl = typeof getEventPageUrl === 'function' ? getEventPageUrl(concert) : '#';
        const eventNameHtml = `<a href="${eventUrl}" class="glitch-link" style="font-weight: 600; color: var(--primary);">${escapeHtml(concert.artist)}</a>`;
        
        // Venue - clickable if link exists
        let venueHtml = escapeHtml(concert.venue);
        if (typeof getVenueLink === 'function') {
            const venueLink = getVenueLink(concert.venue);
            if (venueLink) {
                venueHtml = `<a href="${escapeHtml(venueLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer">${escapeHtml(concert.venue)}</a>`;
            }
        }
        
        // Promoter - clickable if link exists
        let promoterHtml = escapeHtml(concert.promoter);
        if (typeof getPromoterLink === 'function') {
            const promoterLink = getPromoterLink(concert.promoter);
            if (promoterLink) {
                promoterHtml = `<a href="${escapeHtml(promoterLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer">${escapeHtml(concert.promoter)}</a>`;
            }
        }
        
        const dateCell = document.createElement('td');
        dateCell.textContent = concert.date;
        
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<strong>${eventNameHtml}</strong>`;
        
        const genreCell = document.createElement('td');
        genreCell.innerHTML = `<span class="genre-tag" style="background-color: ${genreColor}; color: ${getContrastColor(genreColor)}; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${escapeHtml(concert.genre)}</span>`;
        
        const venueCell = document.createElement('td');
        venueCell.innerHTML = venueHtml;
        
        const promoterCell = document.createElement('td');
        promoterCell.innerHTML = promoterHtml;
        
        const ticketsCell = document.createElement('td');
        ticketsCell.innerHTML = concert.ticketLink && concert.ticketLink !== 'N/A' 
            ? `<a href="${escapeHtml(concert.ticketLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer"><i class="fas fa-ticket-alt"></i> Tickets</a>` 
            : 'N/A';
        
        const fbCell = document.createElement('td');
        fbCell.innerHTML = concert.fbLink && concert.fbLink !== 'N/A' && !concert.fbLink.includes('xxxxxxxx') 
            ? `<a href="${escapeHtml(concert.fbLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook"></i> Facebook</a>` 
            : 'N/A';
        
        row.appendChild(checkboxCell);
        row.appendChild(dateCell);
        row.appendChild(nameCell);
        row.appendChild(genreCell);
        row.appendChild(venueCell);
        row.appendChild(promoterCell);
        row.appendChild(ticketsCell);
        row.appendChild(fbCell);
        
        tableBody.appendChild(row);
    });

    // Initialize or reinitialize DataTables
    if (dataTable) {
        try {
            dataTable.destroy();
        } catch (e) {
            console.warn('Error destroying DataTable:', e);
        }
        dataTable = null;
    }

    // Check if jQuery and DataTables are available
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        try {
            dataTable = $('#concertsTable').DataTable({
                pageLength: 25,
                lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                order: [[1, 'asc']], // Sort by date column (index 1, since 0 is checkbox)
                language: {
                    search: "Search:",
                    lengthMenu: "Show _MENU_ concerts",
                    info: "Showing _START_ to _END_ of _TOTAL_ concerts",
                    infoEmpty: "No concerts available",
                    infoFiltered: "(filtered from _MAX_ total concerts)",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                },
                responsive: true,
                processing: false, // Disable processing indicator for faster rendering
                deferRender: true, // Only render visible rows
                columnDefs: [
                    { orderable: false, targets: [0] }, // Checkbox column not sortable
                    { orderable: true, targets: [1, 2, 3, 4, 5] },
                    { orderable: false, targets: [6, 7] } // Links columns not sortable
                ]
            });
            console.log('DataTable initialized successfully');
        } catch (e) {
            console.error('Error initializing DataTable:', e);
        }
    } else {
        console.error('jQuery or DataTables not loaded');
    }
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
 * Get contrasting text color (white or black) based on background
 */
function getContrastColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
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

