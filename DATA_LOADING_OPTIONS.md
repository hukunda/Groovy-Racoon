# Data Loading Options for Non-Developers

If the table is not loading data from Google Sheets, here are several alternative options you can use:

## Current Setup
The website currently tries to load data from a Google Sheet. If this isn't working, it's likely because:
1. The Google Sheet is not published publicly
2. CORS (Cross-Origin Resource Sharing) restrictions are blocking the request
3. The Sheet ID or GID (tab ID) is incorrect

## Option 1: Publish Your Google Sheet (Easiest - Recommended)

### Steps:
1. Open your Google Sheet
2. Click **File** → **Share** → **Publish to web**
3. Select the tab you want to publish (usually the first/main tab)
4. Choose **CSV** as the format
5. Click **Publish**
6. Copy the link that appears
7. Update the `SPREADSHEET_ID` in `js/main.js` (line 6) with your Sheet ID
   - The Sheet ID is the long string in your Google Sheets URL: `https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`
8. Update the `GID` in `js/main.js` (line 7) if needed
   - To find the GID, look at the URL when you're on a specific tab - it will have `#gid=1234567890` at the end

### Pros:
- ✅ No coding required
- ✅ Data updates automatically when you edit the sheet
- ✅ Free and easy to use

### Cons:
- ⚠️ Sheet must be publicly viewable (anyone with the link can see it)

---

## Option 2: Use a CSV File Hosted Online

### Steps:
1. Export your Google Sheet as CSV (File → Download → CSV)
2. Upload the CSV file to a free hosting service:
   - **GitHub**: Create a free account, create a repository, upload the CSV file
   - **Google Drive**: Upload the file, right-click → Get link → Set to "Anyone with the link can view"
   - **Dropbox**: Upload the file, create a shareable link
3. Get the direct download link to your CSV file
4. Update `js/main.js` to use this link instead of Google Sheets

### How to Update the Code:
Open `js/main.js` and find line 12-20. Replace the `CSV_URLS` array with your CSV file URL:

```javascript
const CSV_URLS = [
    'https://your-hosting-service.com/path/to/your-file.csv'
];
```

### Pros:
- ✅ Simple file-based approach
- ✅ Works with any hosting service
- ✅ No Google Sheets dependency

### Cons:
- ⚠️ You need to manually re-upload the file when data changes
- ⚠️ Requires basic file hosting knowledge

---

## Option 3: Use a JSON File (More Flexible)

### Steps:
1. Convert your data to JSON format (you can use online converters)
2. Host the JSON file online (same options as Option 2)
3. Update the code to read JSON instead of CSV

### JSON Format Example:
```json
[
  {
    "date": "1. 11. 2025",
    "artist": "Band Name",
    "genre": "Punk",
    "venue": "Venue Name",
    "promoter": "Promoter Name",
    "ticketLink": "https://tickets.com",
    "fbLink": "https://facebook.com/event"
  }
]
```

### Pros:
- ✅ More structured data format
- ✅ Easier to validate and edit
- ✅ Better for complex data

### Cons:
- ⚠️ Requires JSON format knowledge
- ⚠️ Still need to manually update the file

---

## Option 4: Use a Simple Database Service (Advanced)

### Services to Consider:
- **Airtable**: Free tier available, has an API
- **Notion**: Can be used as a database with API access
- **Firebase**: Google's free database service
- **Supabase**: Free PostgreSQL database

### Pros:
- ✅ Real-time updates possible
- ✅ Better for large datasets
- ✅ More professional solution

### Cons:
- ⚠️ Requires API setup and configuration
- ⚠️ May need developer help for initial setup

---

## Option 5: Hardcode Data in JavaScript (Quick Fix)

If you have a small number of events and don't need frequent updates:

### Steps:
1. Open `js/main.js`
2. Find the `fetchConcerts()` function
3. Replace it with hardcoded data:

```javascript
async function fetchConcerts() {
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';

    // Hardcoded concerts data
    window.allConcerts = [
        {
            date: "1. 11. 2025",
            artist: "Band Name",
            genre: "Punk",
            venue: "Venue Name",
            promoter: "Promoter",
            ticketLink: "https://tickets.com",
            fbLink: "https://facebook.com/event",
            parsedDate: new Date(2025, 10, 1) // Year, Month-1, Day
        },
        // Add more events here...
    ];

    if (loading) loading.style.display = 'none';
    applyFilters();
}
```

### Pros:
- ✅ No external dependencies
- ✅ Works immediately
- ✅ No hosting needed

### Cons:
- ⚠️ Requires code editing for updates
- ⚠️ Not scalable for many events

---

## Troubleshooting

### If data still doesn't load:

1. **Check Browser Console**: 
   - Press F12 (or right-click → Inspect)
   - Go to the "Console" tab
   - Look for red error messages
   - These will tell you what's wrong

2. **Check Network Tab**:
   - In browser DevTools, go to "Network" tab
   - Refresh the page
   - Look for failed requests (they'll be red)
   - Click on them to see error details

3. **Common Issues**:
   - **CORS Error**: The server doesn't allow cross-origin requests. Try Option 1 or 2.
   - **404 Error**: The URL is wrong. Double-check your Sheet ID or file URL.
   - **403 Error**: The file/sheet is not publicly accessible. Make sure sharing is enabled.

---

## Recommendation

**For non-developers, I recommend Option 1 (Publish Google Sheet)** because:
- It's the easiest to set up
- Updates automatically
- Requires no code changes
- Free to use

If Option 1 doesn't work due to privacy concerns, **Option 2 (CSV file hosting)** is the next best choice.

---

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Google Sheet is published correctly
3. Make sure the Sheet ID and GID in `js/main.js` are correct
4. Try one of the alternative options above
