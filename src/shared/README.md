# src/shared — code used by more than one part

- `channels.js` — the names of every message between windows and the main process. A button that does nothing: check its name here.
- `outputs.js` — the default output list, used when no settings file exists yet.

Nothing in here should depend on Electron.
