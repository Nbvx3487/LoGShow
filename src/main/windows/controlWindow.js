/**
 * controlWindow.js — creates the control window (the panel you operate).
 *
 * This is the only window that opens on launch. It loads the control page
 * from src/renderer/control/ and uses the preload bridge for messages.
 */

const { BrowserWindow } = require("electron");
const path = require("path");

/**
 * Open the control window and load its page.
 *
 * @returns {BrowserWindow} The new control window.
 */
function createControlWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 640,
        title: "LoGShow",
        webPreferences: {
            // The preload script runs before the page and exposes the safe
            // functions the page is allowed to call (see src/preload/preload.js).
            preload: path.join(__dirname, "..", "..", "preload", "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile(path.join(__dirname, "..", "..", "renderer", "control", "index.html"));
    return win;
}

module.exports = { createControlWindow };
