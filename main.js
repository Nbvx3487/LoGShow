const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const log = require("electron-log");

log.transports.file.resolvePathFn = () => {
    const date = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");

    return path.join(
        log.transports.file.getFile().parent.path,
        `${date}.log`
    );
};

autoUpdater.logger = log;

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    window.loadFile("index.html");
}

ipcMain.handle("get-version", () => {
    return app.getVersion();
});

app.whenReady().then(() => {
    createWindow();

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
