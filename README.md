# ChartsWatcher Symbol Sync (Edge Extension)

This extension syncs the SYMBOL value between Edge windows that are open to
`https://app.chartswatcher.com/dashboard`. It targets the panel that has the
royalblue context color selected and forwards symbol changes to other windows.

## Features
- Detects the royalblue panel with a SYMBOL input.
- Syncs symbol changes to all other open windows on the same URL.
- Sends updates on blur/change/Enter (no per-keystroke spam).
- Ignores self-echo to avoid loops.

## Installation (Edge)
1) Open Edge and navigate to `edge://extensions`.
2) Enable "Developer mode".
3) Click "Load unpacked".
4) Select this folder: `ChartsWatcher_browser_extension`.

## Usage
1) Open multiple Edge windows to `https://app.chartswatcher.com/dashboard`.
2) Ensure the panel you want to sync is set to royalblue.
3) Change the SYMBOL and blur the field (or press Enter).
4) The SYMBOL will update in the other windows.

## Files
- `manifest.json` - Extension manifest (MV3).
- `background.js` - Relays symbols between tabs.
- `content.js` - Finds the royalblue SYMBOL input and syncs changes.

## Notes
- Only the royalblue panel is synchronized.
- If a page update changes the input element, the extension rebinds automatically.
- Use at own risk. No guarantees or warranties provided. Only tested on Microsoft Edge.
