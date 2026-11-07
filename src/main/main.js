/**
 * main.js — entry point of the Electron main process.
 *
 * Starts the app and connects the modules in src/main/:
 *   - windows/controlWindow.js  the control panel, opened on launch
 *   - windows/outputManager.js  the output list and output windows
 *   - windows/outputWindow.js   builds one output window
 *   - settings/settingsStore.js saves theme and outputs to settings.json
 *   - ipc/handlers.js           answers requests from the windows
 *   - updater/updater.js        automatic updates
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
const { createSettingsStore } = require("./settings/settingsStore");
const { registerIpcHandlers, broadcastOutputs } = require("./ipc/handlers");
const { setupUpdater, checkForUpdates } = require("./updater/updater");

// Log file location: Desktop/LoGShow Logs/<date-time>.log
log.transports.file.resolvePathFn = () => {
    const date = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");

    return path.join(os.homedir(), "Desktop", "LoGShow Logs", `${date}.log`);
};

setupUpdater();

// Settings live in the app's user-data folder (settings.json).
const settingsStore = createSettingsStore(
    path.join(app.getPath("userData"), "settings.json"),
    { log }
);

// The output manager starts from the saved output list and saves every change.
const outputManager = createOutputManager({
    outputs: settingsStore.get().outputs,
    openWindow: openOutputWindow,
    onChange: broadcastOutputs,
    onListChange: (outputs) => settingsStore.update({ outputs }),
});

app.whenReady().then(() => {
    registerIpcHandlers({ outputManager, settingsStore });
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

// Quit when the last window closes (except on macOS, which keeps the app running).
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
