# 🎵 Groovy Racoon

**Your funky guide to live music!**

A responsive, static website that displays concerts from a Google Sheets source. Users can view events in Table View or Calendar View, filter by genre, venue, and date, and click links for tickets or Facebook events.

## 🌟 Features

- **Table View**: Sortable table with DataTables.js
- **Calendar View**: Interactive monthly calendar with FullCalendar.js
- **Advanced Filtering**: Filter by date, artist, genre, venue, and promoter
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Auto-Update**: Automatically fetches data from Google Sheets
- **Genre Color-Coding**: Events are color-coded by genre in calendar view

## 🚀 Live Demo

Visit the live site: [https://hukunda.github.io/Groovy-Racoon/](https://hukunda.github.io/Groovy-Racoon/)

## 📋 Data Source

The website fetches concert data from a Google Sheet:
- **Spreadsheet ID**: `1J6aInjzgf-_7PZO6I8TG4Ghvnx9e3Z_E5rVYImY2BC0`
- **Sheet GID**: `1445856825`

### Columns:
- **Datum** (Date)
- **Interpreti/Název akce** (Artist/Event Name)
- **Žánr** (Genre)
- **Klub/Místo** (Venue)
- **Promotér/Pořadatel** (Promoter)
- **Odkaz na vstupenky/Info** (Ticket Link)
- **Odkaz na FB událost** (Facebook Event Link)

## 🛠️ Tech Stack

- **HTML5/CSS3/JavaScript** (Vanilla JS)
- **FullCalendar.js** - Calendar view
- **DataTables.js** - Table view with sorting and pagination
- **jQuery** - Required for DataTables
- **Google Fonts** - Poppins font family
- **Fetch API** - For loading data from Google Sheets

## 📁 Project Structure

```
Groovy-Racoon/
│
├── index.html        # Main entry point
├── css/
│    └── style.css    # Custom styles
├── js/
│    ├── main.js      # Fetch & render logic
│    ├── table.js     # Table view logic
│    └── calendar.js  # Calendar view logic
├── assets/
│    └── logo.png     # Logo image (optional)
└── README.md         # This file
```

## 🚀 Deployment on GitHub Pages

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Groovy Racoon website"
git remote add origin git@github.com:hukunda/Groovy-Racoon.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. Scroll down to **Pages** section
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Your site will be available at: `https://hukunda.github.io/Groovy-Racoon/`

## 🔄 Updating the Google Sheet

The website automatically fetches data from the Google Sheet. To update concerts:

1. Edit your Google Sheet
2. The changes will be reflected on the website (may take a few minutes due to caching)

### Making the Sheet Public

If you encounter CORS errors:

1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to web**
3. Select the sheet tab
4. Choose **CSV** format
5. Click **Publish**

## 🎨 Color Palette

- **Primary**: `#FF6F61` (Coral)
- **Secondary**: `#4ECDC4` (Turquoise)
- **Accent**: `#FFE66D` (Yellow)
- **Dark**: `#2C3E50`
- **Light**: `#F8F9FA`

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔧 Local Development

To run locally:

1. Clone the repository:
```bash
git clone git@github.com:hukunda/Groovy-Racoon.git
cd Groovy-Racoon
```

2. Open `index.html` in your browser, or use a local server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000
```

3. Visit `http://localhost:8000`

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Credits

- **FullCalendar.js**: [https://fullcalendar.io/](https://fullcalendar.io/)
- **DataTables.js**: [https://datatables.net/](https://datatables.net/)
- **Google Fonts**: [https://fonts.google.com/](https://fonts.google.com/)

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors when loading data:
- Make sure your Google Sheet is published to web (see "Making the Sheet Public" above)
- Check that the spreadsheet ID and GID are correct in `js/main.js`

### Calendar Not Showing
- Make sure FullCalendar.js is loaded (check browser console for errors)
- Verify that `filteredConcerts` is populated with data

### Table Not Sorting
- Ensure jQuery and DataTables.js are loaded before `table.js`
- Check browser console for JavaScript errors

---

Made with ❤️ for music lovers everywhere! 🎸🎹🥁

