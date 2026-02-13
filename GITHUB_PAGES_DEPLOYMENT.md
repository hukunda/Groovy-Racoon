# GitHub Pages Deployment Guide

## Quick Deployment Steps

### 1. Push Your Code to GitHub

If you haven't already, make sure all your changes are committed and pushed:

```bash
git add .
git commit -m "Update Groovy Racoon app"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/Groovy-Racoon`
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**

### 3. Your Site Will Be Live At

Your site will be available at:
```
https://YOUR_USERNAME.github.io/Groovy-Racoon/
```

It may take a few minutes for the site to be available after enabling GitHub Pages.

## Important Notes

### Google Apps Script Backend

Make sure your Google Apps Script Web App URL is correctly set in:
- `js/main.js` - Update `GOOGLE_APPS_SCRIPT_URL` constant

The backend must be deployed with "Anyone" access for it to work on GitHub Pages.

### Custom Domain (Optional)

If you want to use a custom domain:
1. Add a `CNAME` file in the root with your domain name
2. Configure DNS settings as per GitHub Pages documentation

## Troubleshooting

- **Site not loading?** Check that `index.html` is in the root directory
- **Images not showing?** Verify all asset paths are relative (e.g., `assets/logo.png`)
- **Backend not working?** Ensure Google Apps Script is deployed with "Anyone" access
