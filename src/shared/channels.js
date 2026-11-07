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
    // --- Outputs ---
    /** Renderer asks: list outputs and whether each is open. */
    GET_OUTPUTS: "outputs:get",
    /** Renderer asks: open one output window. Argument: output id. */
    START_OUTPUT: "outputs:start",
    /** Renderer asks: close one output window. Argument: output id. */
    END_OUTPUT: "outputs:end",
    /** Renderer asks: open every output window that is closed. */
    SHOW_ALL_OUTPUTS: "outputs:show-all",
    /** Renderer asks: close every open output window. */
    END_ALL_OUTPUTS: "outputs:end-all",
    /** Renderer asks: add an output. Argument: name. */
    ADD_OUTPUT: "outputs:add",
    /** Renderer asks: rename an output. Arguments: id, name. */
    RENAME_OUTPUT: "outputs:rename",
    /** Renderer asks: remove an output (closes its window first). Argument: id. */
    REMOVE_OUTPUT: "outputs:remove",
    /** Main tells every window: the output list or open/closed status changed. */
    OUTPUTS_CHANGED: "outputs:changed",

    // --- Settings ---
    /** Renderer asks: read the settings (theme, etc.). */
    GET_SETTINGS: "settings:get",
    /** Renderer asks: change some settings. Argument: partial settings object. */
    SET_SETTINGS: "settings:set",
    /** Main tells every window: the settings changed. */
    SETTINGS_CHANGED: "settings:changed",

    // --- App ---
    /** Renderer asks: what version is the app? */
    GET_VERSION: "get-version",
};
