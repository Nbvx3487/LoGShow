/**
 * preload.js — runs before the control window loads.
 *
 * It exposes a few safe functions on window.* so the page can talk to the
 * main process without getting access to Node or Electron itself:
 *
 *   window.appInfo.version()
 *   window.outputsApi.getOutputs()          -> [{ id, name, open }]
 *   window.outputsApi.startOutput(id)       -> open an output window
 *   window.outputsApi.endOutput(id)         -> close an output window
 *   window.outputsApi.showAll()             -> open every closed output
 *   window.outputsApi.endAll()              -> close every open output
 *   window.outputsApi.addOutput(name)
 *   window.outputsApi.renameOutput(id, name)
 *   window.outputsApi.removeOutput(id)
 *   window.outputsApi.onChange(fn)          -> fn(statuses) on any output change
 *   window.settingsApi.get()                -> { theme, ... }
 *   window.settingsApi.update(partial)
 *   window.settingsApi.onChange(fn)         -> fn(settings) on any settings change
 *
 * Each function that changes something returns a promise with the new state.
 * The onChange functions return a function that stops listening.
 *
 * Channel names must match src/shared/channels.js. They are repeated here
 * because Electron's sandbox does not let preload scripts load local files.
 */

const { contextBridge, ipcRenderer } = require("electron");

// Must match src/shared/channels.js
const CH = {
    GET_OUTPUTS: "outputs:get",
    START_OUTPUT: "outputs:start",
    END_OUTPUT: "outputs:end",
    SHOW_ALL_OUTPUTS: "outputs:show-all",
    END_ALL_OUTPUTS: "outputs:end-all",
    ADD_OUTPUT: "outputs:add",
    RENAME_OUTPUT: "outputs:rename",
    REMOVE_OUTPUT: "outputs:remove",
    OUTPUTS_CHANGED: "outputs:changed",
    GET_SETTINGS: "settings:get",
    SET_SETTINGS: "settings:set",
    SETTINGS_CHANGED: "settings:changed",
    GET_VERSION: "get-version",
};

/**
 * Subscribe to a channel the main process broadcasts on.
 * @param {string} channel
 * @param {(payload: *) => void} fn
 * @returns {() => void} Call to stop listening.
 */
function listen(channel, fn) {
    const handler = (_event, payload) => fn(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("appInfo", {
    version: () => ipcRenderer.invoke(CH.GET_VERSION),
});

contextBridge.exposeInMainWorld("outputsApi", {
    getOutputs: () => ipcRenderer.invoke(CH.GET_OUTPUTS),
    startOutput: (id) => ipcRenderer.invoke(CH.START_OUTPUT, id),
    endOutput: (id) => ipcRenderer.invoke(CH.END_OUTPUT, id),
    showAll: () => ipcRenderer.invoke(CH.SHOW_ALL_OUTPUTS),
    endAll: () => ipcRenderer.invoke(CH.END_ALL_OUTPUTS),
    addOutput: (name) => ipcRenderer.invoke(CH.ADD_OUTPUT, name),
    renameOutput: (id, name) => ipcRenderer.invoke(CH.RENAME_OUTPUT, id, name),
    removeOutput: (id) => ipcRenderer.invoke(CH.REMOVE_OUTPUT, id),
    onChange: (fn) => listen(CH.OUTPUTS_CHANGED, fn),
});

contextBridge.exposeInMainWorld("settingsApi", {
    get: () => ipcRenderer.invoke(CH.GET_SETTINGS),
    update: (partial) => ipcRenderer.invoke(CH.SET_SETTINGS, partial),
    onChange: (fn) => listen(CH.SETTINGS_CHANGED, fn),
});
