/**
 * preload.js — runs before the control window loads.
 *
 * Exposes one safe function, window.appInfo.version(), so the page can ask the
 * main process for the app version. Add new window-to-main functions here.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
    version: () => ipcRenderer.invoke("get-version")
});