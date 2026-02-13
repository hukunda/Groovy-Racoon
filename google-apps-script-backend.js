// ============================================
// Google Apps Script - Backend for Groovy Racoon
// ============================================
// 
// INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Click "New Project"
// 3. Paste this entire code
// 4. Replace SPREADSHEET_ID with your actual spreadsheet ID
// 5. Replace SHEET_NAME with the name of your sheet tab (e.g., "Sheet1" or "List 14")
// 6. Click "Deploy" → "New deployment"
// 7. Choose "Web app"
// 8. Set "Execute as" to "Me"
// 9. Set "Who has access" to "Anyone"
// 10. Click "Deploy"
// 11. Copy the Web App URL
// 12. Update the URL in js/main.js

const SPREADSHEET_ID = '1BpLPUiT8B61RakDzjcHw5213VHtvQJNxJ4I_mPCJO0M'; // Your spreadsheet ID
const SHEET_NAME = 'All Gigs'; // Your sheet tab name

/**
 * Main function - handles all requests
 * Returns all data from the specified sheet
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createErrorResponse('Sheet "' + SHEET_NAME + '" not found. Available sheets: ' + 
        spreadsheet.getSheets().map(s => s.getName()).join(', '));
    }
    
    const data = getSheetData(sheet);
    
    return createSuccessResponse(data);
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Get all data from sheet as CSV
 */
function getSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) {
    return ''; // No data
  }
  
  const range = sheet.getRange(1, 1, lastRow, lastCol);
  const values = range.getValues();
  
  // Convert to CSV
  const csvLines = values.map(row => {
    return row.map(cell => {
      const cellValue = cell ? cell.toString() : '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return '"' + cellValue.replace(/"/g, '""') + '"';
      }
      return cellValue;
    }).join(',');
  });
  
  return csvLines.join('\n');
}

/**
 * Create success response with CORS headers
 * Note: CORS headers are automatically handled by Google Apps Script Web Apps
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(data)
    .setMimeType(ContentService.MimeType.CSV);
}

/**
 * Create error response
 * Note: CORS headers are automatically handled by Google Apps Script Web Apps
 */
function createErrorResponse(message) {
  return ContentService
    .createTextOutput('Error: ' + message)
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Handle OPTIONS request for CORS preflight
 * Note: CORS is automatically handled by Google Apps Script Web Apps
 */
function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
