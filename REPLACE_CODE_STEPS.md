# How to Fix the setHeaders Error

## The Problem
Your Google Apps Script still has OLD code with `.setHeaders()` which doesn't work.

## The Solution
Replace ALL the code in your Google Apps Script project.

## Step-by-Step Instructions

### Step 1: Open Google Apps Script
1. Go to: https://script.google.com
2. Find and open your project (the one showing the error)

### Step 2: Select ALL Code
1. Click inside the code editor
2. Press **Ctrl+A** (Windows) or **Cmd+A** (Mac) to select everything
3. You should see ALL code highlighted

### Step 3: Delete the Old Code
1. Press **Delete** or **Backspace**
2. The editor should now be completely empty

### Step 4: Copy the NEW Code
1. Open the file `google-apps-script-backend.js` from this project
2. Select ALL the code (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

### Step 5: Paste into Google Apps Script
1. Go back to your Google Apps Script editor
2. Paste the code (Ctrl+V or Cmd+V)
3. You should now see the new code

### Step 6: Verify the Code
Make sure you see these lines at the top:
```javascript
const SPREADSHEET_ID = '1BpLPUiT8B61RakDzjcHw5213VHtvQJNxJ4I_mPCJO0M';
const SHEET_NAME = 'All Gigs';
```

And make sure you DON'T see `.setHeaders()` anywhere in the code.

### Step 7: Save
1. Press **Ctrl+S** (Windows) or **Cmd+S** (Mac)
2. Or click the floppy disk icon 💾

### Step 8: Test
1. Click the **Run** button (▶️) at the top
2. Select `doGet` from the function dropdown
3. Click Run
4. You should NOT see any errors now!

## What Changed?

**OLD CODE (doesn't work):**
```javascript
function createErrorResponse(message) {
  return ContentService
    .createTextOutput('Error: ' + message)
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({ ... });  // ❌ This line causes the error!
}
```

**NEW CODE (works):**
```javascript
function createErrorResponse(message) {
  return ContentService
    .createTextOutput('Error: ' + message)
    .setMimeType(ContentService.MimeType.TEXT);  // ✅ No .setHeaders()!
}
```

## Still Having Issues?

If you still see the error after following these steps:
1. Make sure you deleted ALL the old code
2. Make sure you pasted ALL the new code
3. Try refreshing the page (F5)
4. Make sure you're looking at the right project
