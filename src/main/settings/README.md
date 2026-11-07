# src/main/settings — saved settings

`settingsStore.js` reads and writes `settings.json` in the app's user-data folder. It holds the theme (dark or light) and the output list. If settings don't stick after a restart, check this file. Broken settings files are logged and replaced with defaults, not crashed on.
