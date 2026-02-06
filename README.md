# Typing Practice – Minimal Web App

This is a simple, fully client-side typing practice website you can open directly in your browser.

## Features

- **Live stats**: Shows WPM, accuracy, and total characters as you type.
- **Configurable**: Choose difficulty (easy/medium/hard) and test duration (30/60/120 seconds).
- **Visual feedback**: Target text is highlighted per character (correct, incorrect, and current position).
- **No backend**: Pure HTML/CSS/JS; works offline once loaded.

## Files

- `index.html` – Main page layout and structure.
- `style.css` – Styling and layout for the app.
- `script.js` – Typing logic, timing, and statistics.

## Running It

### Option 1: Open directly

Just open `index.html` in your browser (double-click from your file manager or drag it into a browser window).

### Option 2: Run a local server (recommended)

From the project folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Customization Ideas

- Change the word lists in `script.js` to match your interests.
- Adjust styling in `style.css` (colors, fonts, layout).
- Add a history of previous tests or a high-score tracker.

