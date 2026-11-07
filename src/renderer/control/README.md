# src/renderer/control — PC control panel

## Where the layout lives (and how to change it)

| To change... | Edit this |
|---|---|
| Which panels exist and where they sit | `index.html` (each part has a comment) |
| Panel widths and heights, button sizes, spacing | `styles.css`, the **LAYOUT** block at the top |
| Colours | `styles.css`, the **dark** and **light** theme blocks |
| How dragging works, or to add a resizable panel | `resizer.js` (the `PANELS` list) |
| What buttons do | `control.js` |
| The confirm and alert popups | `confirmDialog.js` |

Sizes you drag are saved on this computer and override the LAYOUT defaults. The General section of Settings has a **Reset panel sizes** button to put them back.

## Files

- `index.html` — the structure, with a comment map at the top.
- `styles.css` — the LAYOUT block (sizes), the colours, and the look of each part.
- `control.js` — behaviour: outputs buttons, tabs and collapse, the settings menu.
- `resizer.js` — drag handles between panels. Sizes are saved in localStorage.
- `confirmDialog.js` — custom popups that replace the system confirm() and alert().
- `icons/gear.png` — the Settings icon. Replace this file to change the icon. The dark theme flips its colours automatically.

Something not working: find the element's id in `index.html`, then the matching code in `control.js` or `resizer.js`. Errors show in a popup and in DevTools (View > Toggle Developer Tools).
