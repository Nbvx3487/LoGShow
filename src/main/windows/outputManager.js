/**
 * outputManager.js — owns the output list and the output windows.
 *
 * WHAT IT DOES
 *   - Keeps the list of outputs: add, rename, remove.
 *   - Opens an output window ("Start show"), closes it ("End show"), and
 *     closes or opens all of them ("End all" / "Show all").
 *   - Never opens two windows for the same output.
 *   - Notices when a window is closed by the user, so the panel updates.
 *   - Reports every change (list or status) and saves the list when it changes.
 *
 * WHY openWindow IS AN ARGUMENT
 *   Creating a real Electron window needs Electron running. Passing the
 *   window-creating function in means the logic can be tested with fake
 *   windows (see tests/outputManager.test.js).
 *
 * WHERE THE REAL WINDOWS ARE CREATED
 *   src/main/windows/outputWindow.js — openOutputWindow(output).
 */

/** Longest allowed output name. */
const MAX_NAME_LENGTH = 40;

/**
 * Check and tidy an output name.
 * @param {*} name
 * @returns {string} The trimmed name.
 * @throws {Error} If the name is not text or is empty after trimming.
 */
function cleanName(name) {
    if (typeof name !== "string" || name.trim() === "") {
        throw new Error("Output name cannot be empty");
    }
    return name.trim().slice(0, MAX_NAME_LENGTH);
}

/**
 * Create an output manager.
 *
 * @param {object} options
 * @param {{ id: string, name: string }[]} options.outputs
 *        The starting list of outputs (loaded from settings).
 * @param {(output: { id: string, name: string }) => object} options.openWindow
 *        Creates the window for one output. The returned object needs:
 *        on(event, fn), focus(), close(), and isDestroyed().
 * @param {(statuses: object[]) => void} [options.onChange]
 *        Called when an output opens/closes or the list changes. Used to refresh the panels.
 * @param {(outputs: object[]) => void} [options.onListChange]
 *        Called when the list itself changes (add/rename/remove). Used to save it.
 * @returns {object} The manager's functions (see the return statement at the bottom).
 */
function createOutputManager({
    outputs,
    openWindow,
    onChange = () => {},
    onListChange = () => {},
}) {
    // Our own copy, so outside code can't change the list by accident.
    const list = outputs.map((o) => ({ ...o }));

    // output id -> the open window for that output
    const windows = new Map();

    /**
     * Find an output by id.
     * @param {string} id
     * @returns {{ id: string, name: string }}
     * @throws {Error} If no output has that id.
     */
    function find(id) {
        const output = list.find((o) => o.id === id);
        if (!output) throw new Error(`Unknown output: ${id}`);
        return output;
    }

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
     * Copy of the output list, without open/closed status.
     * @returns {{ id: string, name: string }[]}
     */
    function getOutputs() {
        return list.map((o) => ({ ...o }));
    }

    /**
     * The list the panels display: each output with its open/closed status.
     * @returns {{ id: string, name: string, open: boolean }[]}
     */
    function getStatus() {
        return list.map((o) => ({ id: o.id, name: o.name, open: isOpen(o.id) }));
    }

    /**
     * Open the window for one output. If it is already open, bring it to the front.
     * @param {string} id
     */
    function start(id) {
        const output = find(id);

        if (isOpen(id)) {
            windows.get(id).focus();
            return;
        }

        const win = openWindow(output);
        windows.set(id, win);

        // When the window closes (by the user or by endShow), forget it and report.
        win.on("closed", () => {
            windows.delete(id);
            onChange(getStatus());
        });

        onChange(getStatus());
    }

    /**
     * Open every output whose window is closed. Open ones are not touched.
     */
    function showAll() {
        for (const output of list) {
            if (!isOpen(output.id)) start(output.id);
        }
    }

    /**
     * Close the window for one output ("End show"). Does nothing if it is closed.
     * @param {string} id
     */
    function endShow(id) {
        find(id); // validates the id
        const win = windows.get(id);
        if (win && !win.isDestroyed()) {
            win.close();
        }
    }

    /**
     * Close every open output window ("End all").
     */
    function endAll() {
        for (const output of list) endShow(output.id);
    }

    /**
     * Add a new output with a generated id.
     * @param {string} name
     * @returns {string} The new output's id.
     */
    function addOutput(name) {
        const clean = cleanName(name);

        // Pick the next free "output-N" id.
        let n = list.length + 1;
        while (list.some((o) => o.id === `output-${n}`)) n++;
        const id = `output-${n}`;

        list.push({ id, name: clean });
        onListChange(getOutputs());
        onChange(getStatus());
        return id;
    }

    /**
     * Rename an output. The id does not change, so its window stays linked.
     * @param {string} id
     * @param {string} name
     */
    function renameOutput(id, name) {
        const output = find(id);
        output.name = cleanName(name);
        onListChange(getOutputs());
        onChange(getStatus());
    }

    /**
     * Remove an output. Its window is closed first if it is open.
     * @param {string} id
     */
    function removeOutput(id) {
        find(id);
        endShow(id);
        const index = list.findIndex((o) => o.id === id);
        list.splice(index, 1);
        windows.delete(id);
        onListChange(getOutputs());
        onChange(getStatus());
    }

    return {
        start,
        showAll,
        endShow,
        endAll,
        addOutput,
        renameOutput,
        removeOutput,
        getOutputs,
        getStatus,
    };
}

module.exports = { createOutputManager, cleanName };
