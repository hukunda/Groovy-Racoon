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
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No concerts found</td></tr>';
        if (dataTable) {
            dataTable.destroy();
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
    sortedConcerts.forEach(concert => {
        const genreColor = getGenreColor(concert.genre);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(concert.date)}</td>
            <td><strong>${escapeHtml(concert.artist)}</strong></td>
            <td><span class="genre-tag" style="background-color: ${genreColor}; color: ${getContrastColor(genreColor)}; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${escapeHtml(concert.genre)}</span></td>
            <td>${escapeHtml(concert.venue)}</td>
            <td>${escapeHtml(concert.promoter)}</td>
            <td>${concert.ticketLink && concert.ticketLink !== 'N/A' 
                ? `<a href="${escapeHtml(concert.ticketLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer">🎫 Tickets</a>` 
                : 'N/A'}</td>
            <td>${concert.fbLink && concert.fbLink !== 'N/A' && !concert.fbLink.includes('xxxxxxxx') 
                ? `<a href="${escapeHtml(concert.fbLink)}" class="glitch-link" target="_blank" rel="noopener noreferrer">📘 Facebook</a>` 
                : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });

    // Initialize or reinitialize DataTables
    if (dataTable) {
        dataTable.destroy();
        dataTable = null;
    }

    // Check if jQuery and DataTables are available
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        dataTable = $('#concertsTable').DataTable({
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            order: [[0, 'asc']], // Sort by date column
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
            columnDefs: [
                { orderable: true, targets: [0, 1, 2, 3, 4] },
                { orderable: false, targets: [5, 6] } // Links columns not sortable
            ]
        });
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

