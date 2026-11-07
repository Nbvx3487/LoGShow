/**
 * handlers.js — answers the requests that windows send to the main process.
 *
 * Each ipcMain.handle(...) below is one request a window can make, named by a
 * channel from src/shared/channels.js. The preload bridge
 * (src/preload/preload.js) is what windows use to send them.
 *
 * To debug a button: find its channel name, then find the matching handle
 * below. Errors thrown here show up in the terminal running the app, and
 * the window receives them as a rejected promise.
 */

const { ipcMain, BrowserWindow, app } = require("electron");
const CH = require("../../shared/channels");

/**
 * Make sure a request argument is text. Throws a clear error if not.
 * @param {*} value
 * @param {string} what  Name used in the error message.
 * @returns {string}
 */
function requireString(value, what) {
    if (typeof value !== "string") {
        throw new Error(`${what} must be a string`);
    }
    return value;
}

/**
 * Send a message to every open window.
 * @param {string} channel
 * @param {*} payload
 */
function broadcast(channel, payload) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(channel, payload);
        }
    }
}

/**
 * Send the output status list to every window. Passed to the output manager
 * as its onChange callback.
 * @param {object[]} statuses
 */
function broadcastOutputs(statuses) {
    broadcast(CH.OUTPUTS_CHANGED, statuses);
}

/**
 * Register every request handler. Call once at startup.
 *
 * @param {{ outputManager: object, settingsStore: object }} deps
 */
function registerIpcHandlers({ outputManager, settingsStore }) {
    // --- App ---

    /** Returns the app version. */
    ipcMain.handle(CH.GET_VERSION, () => app.getVersion());

    // --- Outputs ---

    /** Returns [{ id, name, open }] for every output. */
    ipcMain.handle(CH.GET_OUTPUTS, () => outputManager.getStatus());

    /** Open one output window ("Start show"). Returns the new status list. */
    ipcMain.handle(CH.START_OUTPUT, (_e, id) => {
        outputManager.start(requireString(id, "Output id"));
        return outputManager.getStatus();
    });

    /** Close one output window ("End show"). Returns the new status list. */
    ipcMain.handle(CH.END_OUTPUT, (_e, id) => {
        outputManager.endShow(requireString(id, "Output id"));
        return outputManager.getStatus();
    });

    /** Open every closed output ("Show all"). Returns the new status list. */
    ipcMain.handle(CH.SHOW_ALL_OUTPUTS, () => {
        outputManager.showAll();
        return outputManager.getStatus();
    });

    /** Close every open output ("End all"). Returns the new status list. */
    ipcMain.handle(CH.END_ALL_OUTPUTS, () => {
        outputManager.endAll();
        return outputManager.getStatus();
    });

    /** Add an output with the given name. Returns the new status list. */
    ipcMain.handle(CH.ADD_OUTPUT, (_e, name) => {
        outputManager.addOutput(name);
        return outputManager.getStatus();
    });

    /** Rename an output. Arguments: id, name. Returns the new status list. */
    ipcMain.handle(CH.RENAME_OUTPUT, (_e, id, name) => {
        outputManager.renameOutput(requireString(id, "Output id"), name);
        return outputManager.getStatus();
    });

    /** Remove an output and close its window if open. Returns the new status list. */
    ipcMain.handle(CH.REMOVE_OUTPUT, (_e, id) => {
        outputManager.removeOutput(requireString(id, "Output id"));
        return outputManager.getStatus();
    });

    // --- Settings ---

    /** Returns all settings (theme, etc.). */
    ipcMain.handle(CH.GET_SETTINGS, () => settingsStore.get());

    /**
     * Change some settings. Returns all settings after the change, and tells
     * every window so they can update their look (for example the theme).
     */
    ipcMain.handle(CH.SET_SETTINGS, (_e, partial) => {
        if (typeof partial !== "object" || partial === null) {
            throw new Error("Settings must be an object");
        }
        const updated = settingsStore.update(partial);
        broadcast(CH.SETTINGS_CHANGED, updated);
        return updated;
    });
}

module.exports = { registerIpcHandlers, broadcastOutputs };
