/**
 * main.js — entry point of the Electron main process.
 *
 * Starts the app, creates the control window, and connects the modules in
 * src/main/. Start reading the app here. Function-level details live in each
 * module. Logs are written to Desktop/LoGShow Logs.
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const os = require("os");
const log = require("electron-log");

log.transports.file.resolvePathFn = () => {
    const date = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");

    return path.join(
        os.homedir(),
        "Desktop",
        "LoGShow Logs",
        `${date}.log`
    );
};
autoUpdater.logger = log;

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "..", "preload", "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    window.loadFile(path.join(__dirname, "..", "renderer", "control", "index.html"));
}

ipcMain.handle("get-version", () => {
    return app.getVersion();
});

app.whenReady().then(() => {
    createWindow();

    log.info("================ STARTED ================");
    log.info("Version:", app.getVersion());
    log.info("Packaged:", app.isPackaged);
    log.info("Platform:", process.platform);
    log.info("Architecture:", process.arch);
    log.info("Electron:", process.versions.electron);
    log.info("Node:", process.versions.node);

    autoUpdater.checkForUpdates();
});

autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...");
});

autoUpdater.on("update-available", () => {
    log.info("Update found");
});

autoUpdater.on("update-not-available", () => {
    log.info("Already latest version");
});

autoUpdater.on("update-downloaded", () => {
    log.info("Update downloaded");
    autoUpdater.quitAndInstall();
});

autoUpdater.on("error", (error) => {
    log.error("Updater error:", error);
});
