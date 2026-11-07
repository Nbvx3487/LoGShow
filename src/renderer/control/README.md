# src/renderer/control — PC control panel

- `index.html` — the layout: the main area and Outputs panel on top, the Lyrics / Scriptures panel at the bottom, the Settings button above its right edge, and the full-screen settings menu.
- `styles.css` — the colours (dark and light themes) and the layout. Change colours here.
- `control.js` — behaviour. Sections in order: state, theme, outputs panel, bottom tabs, settings menu, start-up.

Something not working: find the element's id in index.html, then the matching handler in control.js. Errors show as an alert and in DevTools (View > Toggle Developer Tools).
