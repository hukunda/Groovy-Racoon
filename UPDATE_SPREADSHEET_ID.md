# Updating to New Google Sheet

You've provided a new Google Sheets link. Here's how to update everything:

## Your New Published Sheet URL
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQpT2Xd6Z2X_cjVHt1MVq_FybDvSUIQ5Gm2lQz9dZOZtZx_P3qgOxiNqf9WhwoguOk06lebCl0ZXEA-/pubhtml
```

## What's Already Updated

✅ **Fallback URLs** in `js/main.js` - Already updated with your new published sheet ID

## What You Need to Update

### 1. Update Google Apps Script (IMPORTANT!)

The Google Apps Script needs the **actual spreadsheet ID** (not the published view ID).

**To find the actual spreadsheet ID:**

1. Open your Google Sheet in **edit mode** (not the published view)
2. Look at the URL - it should be like:
   ```
   https://docs.google.com/spreadsheets/d/[ACTUAL_SPREADSHEET_ID]/edit
   ```
3. Copy that ID (the long string between `/d/` and `/edit`)

**Then update Google Apps Script:**

1. Go to [https://script.google.com](https://script.google.com)
2. Open your existing project (the one with URL: `AKfycbwpGXbnWSl0yA689jHmJIqec_iaOrbGYX9V0zytTLcPH0zOAbNIkk1Jdu4b4o8rIpqGxg`)
3. Find this line:
   ```javascript
   const SPREADSHEET_ID = '1J6aInjzgf-_7PZO6I8TG4Ghvnx9e3Z_E5rVYImY2BC0';
   ```
4. Replace it with your **actual spreadsheet ID** (from the edit URL)
5. Also check the `SHEET_NAME` - make sure it matches your sheet tab name:
   ```javascript
   const SHEET_NAME = 'Sheet1'; // Change to your actual sheet tab name
   ```
6. **Save** the script (Ctrl+S or Cmd+S)
7. **No need to redeploy** - the changes will take effect automatically!

### 2. Verify Sheet Tab Name

Make sure the `SHEET_NAME` in Google Apps Script matches the exact name of your sheet tab:
- Look at the bottom of your Google Sheet
- See what the tab is called (e.g., "Sheet1", "List 14", "All Gigs", etc.)
- Update `SHEET_NAME` in Google Apps Script to match exactly (case-sensitive!)

## Testing

After updating:

1. Test your Google Apps Script URL directly in browser:
   ```
   https://script.google.com/macros/s/AKfycbwpGXbnWSl0yA689jHmJIqec_iaOrbGYX9V0zytTLcPH0zOAbNIkk1Jdu4b4o8rIpqGxg/exec
   ```
2. You should see CSV data
3. If you see an error, check:
   - Spreadsheet ID is correct (from edit URL, not published URL)
   - Sheet name matches exactly
   - Sheet is accessible (not private)

## Quick Reference

- **Published View ID** (for fallback URLs): `2PACX-1vQpT2Xd6Z2X_cjVHt1MVq_FybDvSUIQ5Gm2lQz9dZOZtZx_P3qgOxiNqf9WhwoguOk06lebCl0ZXEA-` ✅ Already updated
- **Actual Spreadsheet ID** (for Google Apps Script): Get from edit URL ⚠️ Needs updating
- **Sheet Tab Name**: Check your sheet tabs ⚠️ Verify this matches
