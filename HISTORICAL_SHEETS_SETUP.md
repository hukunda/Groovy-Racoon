# Setting Up Historical Sheets

The app now supports loading data from multiple sheets (current + historical months).

## Quick Add Method (Easiest!)

1. **Find the GID**
   - Open your Google Sheet
   - Click on the sheet tab (e.g., "Mar 2026")
   - Look at the URL - find `#gid=1234567890` at the end
   - Copy that number

2. **Use the Helper (in Browser Console)**
   - Open your website
   - Press F12 to open browser console
   - Type: `addSheet("Mar 2026", "1234567890")`
   - It will show you the exact code to copy!

3. **Paste into Code**
   - Copy the output from the helper
   - Open `js/main.js`
   - Find `HISTORICAL_SHEETS` array (around line 16)
   - Paste the new line

**That's it!** No need to figure out the month format - the helper does it for you.

## Manual Method

If you prefer to add manually:

1. **Find the GID** (same as above)

2. **Update `js/main.js`**
   ```javascript
   const HISTORICAL_SHEETS = [
       { name: "Feb 2026", gid: "965605906", month: "2026-02" },
       { name: "Mar 2026", gid: "YOUR_GID", month: "2026-03" }, // Add here
   ];
   ```

3. **Month Format**: `"YYYY-MM"` (e.g., "2026-03" for March 2026)

## Sheet Structure

All sheets must follow this structure:
- **Column A**: Date
- **Column B**: Name (Artist/Event)
- **Column C**: Style (Genre)
- **Column D**: Place (Venue)
- **Column E**: Type
- **Column F**: Link

## Publishing

- Make sure all sheets are published (File → Share → Publish to web)
- Sheet names don't matter - the app uses structure, not names
- Each sheet tab needs to be published separately

## Do I Need to Update GIDs Every Time?

**Yes, but it's easy!** Just:
1. Get the GID from the URL (takes 5 seconds)
2. Use the helper function: `addSheet("Sheet Name", "GID")` in browser console
3. Copy the output and paste into code

The helper makes it super quick - no need to figure out date formats or syntax!
