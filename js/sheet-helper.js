// ============================================
// Sheet Helper - Easy way to add new sheets
// ============================================

/**
 * Helper function to add a new historical sheet
 * 
 * Usage in browser console:
 * addSheet("Mar 2026", "1234567890", "2026-03")
 * 
 * Or just provide the GID and it will try to detect the month:
 * addSheet("Mar 2026", "1234567890")
 */
function addSheet(name, gid, month = null) {
    // Try to extract month from name if not provided
    if (!month) {
        const monthMatch = name.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})/i);
        if (monthMatch) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthMatch[1].toLowerCase());
            if (monthIndex !== -1) {
                const year = monthMatch[2];
                const monthNum = String(monthIndex + 1).padStart(2, '0');
                month = `${year}-${monthNum}`;
            }
        }
    }
    
    const newSheet = { name, gid, month };
    
    console.log('To add this sheet, update js/main.js:');
    console.log(`Add to HISTORICAL_SHEETS array:`);
    console.log(JSON.stringify(newSheet, null, 2));
    console.log('\nOr copy this line:');
    console.log(`{ name: "${name}", gid: "${gid}", month: "${month || 'null'}" },`);
    
    return newSheet;
}

// Make it available globally
window.addSheet = addSheet;
