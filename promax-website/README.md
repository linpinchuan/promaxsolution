# Pro Max Solution Marketing Agency - Website

A complete static website (plain HTML, CSS and JavaScript). No build step, no database, no WordPress.
Upload the whole folder to GitHub or any web server and it works.

## Folder structure

```
index.html              Homepage (hero, services, why us, process, latest posts, FAQ, lead form)
blog.html               Blog page - lists ALL articles automatically
posts/                  One HTML file per article
  _template.html        Copy this to start a new article
assets/css/style.css    All styling
assets/js/posts.js      The list of articles (edit this when you publish)
assets/js/main.js       Menu, blog list, filters, lead form (settings at the top)
sitemap.xml, robots.txt SEO files
```

## Before you go live (5 minutes)

1. **Find and replace `https://www.yourdomain.com`** with your real domain in every file
   (index.html, blog.html, posts/*.html, sitemap.xml, robots.txt).
2. ~~Replace the email~~ Done: the site uses **pinchuan95@promaxsolution.org**.
3. **Set up the lead form** (see below; the ready-made script is in `google-apps-script.gs`).
4. **Delete or replace the 3 sample articles** and their entries in `assets/js/posts.js` and `sitemap.xml`.

## Lead form -> Excel / Google Sheet (recommended, free)

Every submission (name, email, contact number, service) can be saved as a new row in a
Google Sheet, which you can open anytime, or download as a real Excel file
(File > Download > Microsoft Excel .xlsx). Setup takes about 5 minutes and needs no paid tools.

1. Go to [sheets.google.com](https://sheets.google.com) and create a new sheet. Rename it
   something like "Website Leads". In row 1, add these headers: `Timestamp | Name | Email | Phone | Service`.
2. In the sheet, go to **Extensions > Apps Script**. Delete any starter code and paste this:

   ```js
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var data = JSON.parse(e.postData.contents);
     sheet.appendRow([
       new Date(),
       data.name || "",
       data.email || "",
       data.phone || "",
       data.service || ""
     ]);
     return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Click **Deploy > New deployment**. Choose type **Web app**. Set "Execute as" to **Me** and
   "Who has access" to **Anyone**. Click Deploy and authorise it (it's your own script, so this is safe).
4. Copy the **Web app URL** it gives you.
5. Open `assets/js/main.js` and paste that URL into `CONFIG.sheetEndpoint` near the top of the file.
6. Publish. Every form submission now appears as a new row in your Google Sheet in real time,
   and you can export it to Excel whenever you like.

The form never opens an email app: visitors see a thank-you message and the details go straight into your sheet.

## WhatsApp button

A WhatsApp button appears in the header, the footer, and as a floating button on every page
(`assets/js` needs no changes for this - it's plain links). The number and pre-filled message
are set once, near the top of `build_site.py` under `WHATSAPP_NUMBER` and `WHATSAPP_MSG` if you
regenerate the site with that script, or you can just find-and-replace the number directly in
every HTML file if you're editing by hand:

- Current number: **+60 13-756 4701**
- Link format used: `https://wa.me/60137564701?text=...`

## How to publish a new blog article

1. Copy `posts/_template.html` to `posts/your-article-name.html`
   (lowercase, words joined by hyphens, this becomes the URL).
2. Edit the title, description, date, category and content. Keep the answer-first
   paragraph and question-style headings for SEO / GEO / AEO.
3. Open `assets/js/posts.js` and add one entry at the top of the list:

   ```js
   {
     slug: "your-article-name",
     title: "Your article title",
     excerpt: "One or two sentences shown on the card.",
     date: "2026-10-01",
     category: "SEO & GEO",
     readTime: "5 min read"
   },
   ```
4. Add the article URL to `sitemap.xml`.
5. Commit and push to GitHub (or upload to your server). The Blog page updates by itself:
   newest first, with category filter buttons created automatically and a "Show more" button
   after 9 articles.

## Hosting

- **GitHub Pages:** push to a repository, then Settings > Pages > deploy from the main branch (root).
  For a custom domain add a `CNAME` file containing your domain.
- **Your own server:** upload the folder contents to the web root (Nginx, Apache, cPanel, etc.).
- **Preview locally:** run `python3 -m http.server 8000` in this folder and open http://localhost:8000

## Good to know

- The font (Plus Jakarta Sans) loads from Google Fonts. To self-host them, download the font files
  and update the `<link>` tags.
- For social sharing previews, add an image (about 1200x630) and an `og:image` meta tag to each page.
- Colours are CSS variables at the top of `assets/css/style.css`, so a full re-theme is quick.
