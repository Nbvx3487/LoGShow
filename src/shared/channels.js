/**
 * channels.js — the names of every message that passes between windows and
 * the main process. If a button does nothing, check that its channel name
 * here matches the one in the handler (src/main/ipc/handlers.js) and in the
 * preload (src/preload/preload.js).
 *
 * NOTE: preload.js cannot require this file (Electron's sandbox blocks it),
 * so preload.js repeats these values. Change both places together.
 */

module.exports = {
    /** Renderer asks: which outputs exist and which are open? */
    GET_OUTPUTS: "outputs:get",
    /** Renderer asks: open one output window. Argument: output id. */
    START_OUTPUT: "outputs:start",
    /** Renderer asks: open every output window that is not open yet. */
    SHOW_ALL_OUTPUTS: "outputs:show-all",
    /** Main tells every window: the open/closed status changed. */
    OUTPUTS_CHANGED: "outputs:changed",
    /** Renderer asks: what version is the app? */
    GET_VERSION: "get-version",
};
