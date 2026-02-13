# Setting Up Google Apps Script Backend

This is the **easiest and most reliable** way to get your Google Sheets data working without CORS issues!

## Why Google Apps Script?

- ✅ **Free** - No cost
- ✅ **No server needed** - Runs on Google's servers
- ✅ **No CORS issues** - Proper headers included
- ✅ **Easy to set up** - 5 minutes
- ✅ **Automatic updates** - Data updates when you edit sheets

## Step-by-Step Setup

### 1. Create the Script

1. Go to **[https://script.google.com](https://script.google.com)**
2. Click **"New Project"** (or the **+** button)
3. Delete any existing code
4. Open the file `google-apps-script-backend.js` from this project
5. Copy **ALL** the code
6. Paste it into the Google Apps Script editor

### 2. Update the Spreadsheet ID

1. In the script, find this line:
   ```javascript
   const SPREADSHEET_ID = '1J6aInjzgf-_7PZO6I8TG4Ghvnx9e3Z_E5rVYImY2BC0';
   ```
2. Replace it with your actual spreadsheet ID
   - Your spreadsheet ID is in the URL: `https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`

### 3. Update Sheet Name

1. Find this line in the code:
   ```javascript
   const SHEET_NAME = 'Sheet1';
   ```
2. Replace `'Sheet1'` with the exact name of your sheet tab
   - This is the tab name at the bottom of your Google Sheet (e.g., "Sheet1", "List 14", etc.)
   - Make sure the name matches exactly (case-sensitive)

### 4. Deploy as Web App

1. Click **"Deploy"** → **"New deployment"**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Fill in:
   - **Description**: "Groovy Racoon Backend" (optional)
   - **Execute as**: **"Me"**
   - **Who has access**: **"Anyone"** (important!)
5. Click **"Deploy"**
6. **Copy the Web App URL** - you'll need this!

### 5. Update Your Website

1. Open `js/main.js`
2. Find this line (around line 10):
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = '';
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
4. Save the file - that's it!

## Example Web App URL

After deployment, you'll get a URL like:
```
https://script.google.com/macros/s/AKfycby.../exec
```

## How It Works

The app will automatically:
- Fetch all data from your single sheet
- Filter to show only the **current month** by default
- Allow users to browse other months using the month filter dropdown

No parameters needed - just the Web App URL!

## Single Sheet Setup

**All your gigs should be in one sheet!** The app will automatically:
- Load all concerts from that single sheet
- Filter to show only the current month by default
- Allow users to browse historical months using the month filter dropdown

You don't need to manage multiple sheets or GIDs anymore - just put everything in one sheet and the app handles the rest!

## Testing

1. After deployment, test the URL in your browser:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
2. You should see CSV data from your sheet
3. If you see an error, check:
   - Spreadsheet ID is correct
   - Sheet name matches exactly (case-sensitive)
   - Sheet is accessible (not private)

## Troubleshooting

**"Authorization required"**
- Make sure "Who has access" is set to "Anyone"
- You may need to authorize the script first (click "Review permissions")

**"Sheet not found"**
- Check that the sheet name matches exactly (case-sensitive)
- Make sure the sheet exists in your spreadsheet
- The error message will show available sheet names to help you

**"No data"**
- Check that the sheet has data
- Verify the sheet structure matches: A=Date, B=Name, C=Style, D=Place, E=Type, F=Link

## Security Note

The Web App URL is public, but it only reads data from your spreadsheet. It cannot modify or delete anything. Your spreadsheet itself should still be set to "Anyone with the link can view" for the data to be accessible.
