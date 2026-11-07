# src/main/windows — window creation

- `controlWindow.js` — the control panel. The only window that opens on launch.
- `outputWindow.js` — builds one output (lyrics display) window.
- `outputManager.js` — keeps track of which output windows are open. Opens an output once, focuses it if it's already open, and reports open/closed status to the panel.

Window size or position problems: look in the two window builder files. Outputs not opening or opening twice: look in outputManager.js.
