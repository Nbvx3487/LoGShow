/**
 * outputManager.js — keeps track of which output windows are open.
 *
 * WHAT IT DOES
 *   - Opens one output window per output, never two for the same output.
 *   - Notices when an output window is closed, so the panel shows it as closed.
 *   - Reports the open/closed status of every output.
 *
 * WHY IT TAKES openWindow AS AN ARGUMENT
 *   Creating a real Electron window needs the Electron app running. By taking
 *   the window-creating function as an argument, the tracking logic can be
 *   tested with fake windows (see tests/outputManager.test.js).
 *
 * WHERE THE REAL WINDOWS ARE CREATED
 *   src/main/windows/outputWindow.js — openOutputWindow(output).
 */

/**
 * Create an output manager.
 *
 * @param {object} options
 * @param {{ id: string, name: string }[]} options.outputs
 *        The outputs to manage (usually DEFAULT_OUTPUTS from src/shared/outputs.js).
 * @param {(output: { id: string, name: string }) => object} options.openWindow
 *        Creates the window for one output. The returned object needs:
 *        on(event, fn), focus(), and isDestroyed().
 * @param {(statuses: object[]) => void} [options.onChange]
 *        Called whenever an output opens or closes.
 * @returns {{ start: Function, showAll: Function, getStatus: Function }}
 */
function createOutputManager({ outputs, openWindow, onChange = () => {} }) {
    // output id -> the open window for that output
    const windows = new Map();

    /**
     * Is the window for this output currently open?
     * @param {string} id
     * @returns {boolean}
     */
    function isOpen(id) {
        const win = windows.get(id);
        return Boolean(win) && !win.isDestroyed();
    }

    /**
     * Build the list the control panel displays.
     * @returns {{ id: string, name: string, open: boolean }[]}
     */
    function getStatus() {
        return outputs.map((o) => ({ id: o.id, name: o.name, open: isOpen(o.id) }));
    }

    /**
     * Open the window for one output.
     * If it is already open, bring it to the front instead of opening another.
     *
     * @param {string} id  An output id from the list.
     * @throws {Error} If the id is not in the output list.
     */
    function start(id) {
        const output = outputs.find((o) => o.id === id);
        if (!output) {
            throw new Error(`Unknown output: ${id}`);
        }

        if (isOpen(id)) {
            windows.get(id).focus();
            return;
        }

        const win = openWindow(output);
        windows.set(id, win);

        // When the user closes the window, forget it and tell the panel.
        win.on("closed", () => {
            windows.delete(id);
            onChange(getStatus());
        });

        onChange(getStatus());
    }

    /**
     * Open every output whose window is not open yet.
     * Outputs that are already open are left alone (not focused or moved).
     */
    function showAll() {
        for (const output of outputs) {
            if (!isOpen(output.id)) {
                start(output.id);
            }
        }
    }

    return { start, showAll, getStatus };
}

module.exports = { createOutputManager };
