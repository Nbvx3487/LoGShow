/**
 * updater.js — automatic updates from GitHub releases.
 *
 * On launch the app checks for a newer version. If one is downloaded, it
 * installs it and restarts. Every step is logged through electron-log, so
 * update problems show up in the logs on the Desktop (LoGShow Logs folder).
 */

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

/**
 * Connect the updater's events to the log. Call once at startup.
 */
function setupUpdater() {
    autoUpdater.logger = log;

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
}

/**
 * Ask GitHub whether a newer version exists.
 */
function checkForUpdates() {
    autoUpdater.checkForUpdates();
}

module.exports = { setupUpdater, checkForUpdates };
