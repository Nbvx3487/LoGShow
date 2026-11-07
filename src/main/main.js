/**
 * main.js — entry point of the Electron main process.
 *
 * Starts the app and connects the modules in src/main/:
 *   - windows/controlWindow.js  the control panel, opened on launch
 *   - windows/outputManager.js  tracks the output windows (opened on demand)
 *   - windows/outputWindow.js   builds one output window
 *   - ipc/handlers.js           answers requests from the windows
 *   - updater/updater.js        automatic updates
 *   - shared/outputs.js         the list of outputs
 *
 * Logs are written to Desktop/LoGShow Logs.
 */

const { app } = require("electron");
const path = require("path");
const os = require("os");
const log = require("electron-log");

const { createControlWindow } = require("./windows/controlWindow");
const { createOutputManager } = require("./windows/outputManager");
const { openOutputWindow } = require("./windows/outputWindow");
const { registerIpcHandlers, broadcastOutputs } = require("./ipc/handlers");
const { setupUpdater, checkForUpdates } = require("./updater/updater");
const { DEFAULT_OUTPUTS } = require("../shared/outputs");

// Log file location: Desktop/LoGShow Logs/<date-time>.log
log.transports.file.resolvePathFn = () => {
    const date = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");

    return path.join(os.homedir(), "Desktop", "LoGShow Logs", `${date}.log`);
};

setupUpdater();

// One manager for the life of the app. It opens output windows on request
// and tells every window when their open/closed status changes.
const outputManager = createOutputManager({
    outputs: DEFAULT_OUTPUTS,
    openWindow: openOutputWindow,
    onChange: broadcastOutputs,
});

app.whenReady().then(() => {
    registerIpcHandlers({ outputManager });
    createControlWindow();

    log.info("================ STARTED ================");
    log.info("Version:", app.getVersion());
    log.info("Packaged:", app.isPackaged);
    log.info("Platform:", process.platform);
    log.info("Architecture:", process.arch);
    log.info("Electron:", process.versions.electron);
    log.info("Node:", process.versions.node);

    checkForUpdates();
});

// Standard Electron behaviour: quit when the last window closes (not on macOS).
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
