/**
 * outputWindow.js — creates the window for one output (a lyrics display).
 *
 * Output windows are plain display pages: they have no preload and no access
 * to Node. The page gets its output name from the URL it is loaded with.
 * Later, the page will receive the current verse from the state module.
 */

const { BrowserWindow } = require("electron");
const path = require("path");

/**
 * Open the display window for one output.
 *
 * @param {{ id: string, name: string }} output  The output to open.
 * @returns {BrowserWindow}
 */
function openOutputWindow(output) {
    const win = new BrowserWindow({
        width: 960,
        height: 540,
        title: output.name,
        backgroundColor: "#000000",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile(
        path.join(__dirname, "..", "..", "renderer", "output", "output.html"),
        { query: { id: output.id, name: output.name } }
    );
    return win;
}

module.exports = { openOutputWindow };
