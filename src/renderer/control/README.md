# src/renderer/control — PC control panel

- `index.html` — the layout: the main area and Outputs panel on top, the Lyrics / Scriptures panel at the bottom, the gear button hanging over the panel's top edge, and the full-screen settings menu.
- `styles.css` — the colours (dark and light themes), the layout, and the custom dialog look. Change colours here.
- `control.js` — behaviour. Sections in order: state, theme, outputs panel, bottom tabs (including collapse), settings menu, start-up.
- `confirmDialog.js` — custom popups that replace the system confirm() and alert(). `showConfirm` returns true or false; `showAlert` shows a message with OK.
- `icons/gear.png` — the gear icon on the Settings button. In light theme it is inverted to dark (see styles.css).

Something not working: find the element's id in index.html, then the matching handler in control.js. Errors show in a popup and in DevTools (View > Toggle Developer Tools).
