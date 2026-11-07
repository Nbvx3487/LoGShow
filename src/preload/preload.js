/**
 * preload.js — runs before the control window loads.
 *
 * It exposes a few safe functions on window.* so the page can talk to the
 * main process without getting access to Node or Electron itself:
 *   window.appInfo.version()        -> app version
 *   window.outputsApi.getOutputs()  -> list of outputs and whether they are open
 *   window.outputsApi.startOutput(id)
 *   window.outputsApi.showAll()
 *   window.outputsApi.onChange(fn)  -> call fn(statuses) whenever a window opens or closes
 *
 * Channel names must match src/shared/channels.js. They are repeated here
 * because Electron's sandbox does not let preload scripts load local files.
 */

const { contextBridge, ipcRenderer } = require("electron");

// Must match src/shared/channels.js
const CH = {
    GET_OUTPUTS: "outputs:get",
    START_OUTPUT: "outputs:start",
    SHOW_ALL_OUTPUTS: "outputs:show-all",
    OUTPUTS_CHANGED: "outputs:changed",
    GET_VERSION: "get-version",
};

contextBridge.exposeInMainWorld("appInfo", {
    /** Returns a promise with the app version string. */
    version: () => ipcRenderer.invoke(CH.GET_VERSION),
});

contextBridge.exposeInMainWorld("outputsApi", {
    /** Returns a promise with [{ id, name, open }] for every output. */
    getOutputs: () => ipcRenderer.invoke(CH.GET_OUTPUTS),

    /** Opens one output window. Returns a promise with the new status list. */
    startOutput: (id) => ipcRenderer.invoke(CH.START_OUTPUT, id),

    /** Opens every output that is not open yet. Returns a promise with the new status list. */
    showAll: () => ipcRenderer.invoke(CH.SHOW_ALL_OUTPUTS),

    /**
     * Calls fn(statuses) every time an output opens or closes.
     * Returns a function that stops listening.
     */
    onChange: (fn) => {
        const handler = (_event, statuses) => fn(statuses);
        ipcRenderer.on(CH.OUTPUTS_CHANGED, handler);
        return () => ipcRenderer.removeListener(CH.OUTPUTS_CHANGED, handler);
    },
});
