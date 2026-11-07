/**
 * handlers.js — answers the requests that windows send to the main process.
 *
 * Each ipcMain.handle(...) below is one request a window can make, named by a
 * channel from src/shared/channels.js. The preload bridge
 * (src/preload/preload.js) is what windows use to send them.
 *
 * To debug a button: find its channel name, then find the matching
 * handle below. Errors thrown here are shown in the terminal running the app.
 */

const { ipcMain, BrowserWindow, app } = require("electron");
const CH = require("../../shared/channels");

/**
 * Register every request handler. Call once at startup.
 *
 * @param {{ outputManager: object }} deps  The output manager from outputManager.js.
 */
function registerIpcHandlers({ outputManager }) {
    /** Returns the app version. Used for the footer of the control window. */
    ipcMain.handle(CH.GET_VERSION, () => app.getVersion());

    /** Returns [{ id, name, open }] for every output. */
    ipcMain.handle(CH.GET_OUTPUTS, () => outputManager.getStatus());

    /**
     * Opens one output window. The argument is the output id.
     * Returns the new status list so the caller can refresh at once.
     */
    ipcMain.handle(CH.START_OUTPUT, (_event, id) => {
        if (typeof id !== "string") {
            throw new Error("START_OUTPUT needs an output id string");
        }
        outputManager.start(id);
        return outputManager.getStatus();
    });

    /** Opens every output window that is not open yet. Returns the new status list. */
    ipcMain.handle(CH.SHOW_ALL_OUTPUTS, () => {
        outputManager.showAll();
        return outputManager.getStatus();
    });
}

/**
 * Send the output status list to every open window.
 * Passed to the output manager as its onChange callback.
 *
 * @param {object[]} statuses  The list from outputManager.getStatus().
 */
function broadcastOutputs(statuses) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(CH.OUTPUTS_CHANGED, statuses);
        }
    }
}

module.exports = { registerIpcHandlers, broadcastOutputs };
