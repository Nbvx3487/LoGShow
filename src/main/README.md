# src/main — the Electron main process

Runs with Node, not in a browser window. It owns the app's state, creates the windows, reads and writes files, and runs the phone remote server. If something works in a window but the data is wrong, look here.

- `main.js` — entry point. Starts the app and connects the subfolders.
- `state/` — the current show, the current verse, and what each output window shows.
- `windows/` — creates the control window and the output windows.
- `remote/` — the server for the phone remote, PIN checks, and the ngrok tunnel.
- `storage/` — reads and writes .show files (see storage/showFile.js).
- `ipc/` — the named message channels that windows use to talk to this process.
- `updater/` — automatic updates.
