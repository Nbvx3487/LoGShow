/**
 * settingsStore.js — saves and loads app settings in a JSON file.
 *
 * WHAT IS STORED
 *   theme   — "dark" or "light". Applies to the control window.
 *   outputs — the list of outputs [{ id, name }]. The output manager
 *             writes this whenever an output is added, renamed or removed.
 *
 * WHERE THE FILE IS
 *   The main process passes in the path (see src/main/main.js). On Windows
 *   it sits in the app's user-data folder, named settings.json.
 *
 * IF THE FILE IS BROKEN
 *   Loading never crashes the app. A file that can't be read is logged and
 *   the defaults are used. The broken file is left alone so it can be fixed.
 */

const fs = require("fs");
const path = require("path");
const { DEFAULT_OUTPUTS } = require("../../shared/outputs");

/** Settings used when nothing has been saved yet. */
const DEFAULTS = {
    theme: "dark",
    outputs: DEFAULT_OUTPUTS,
};

const VALID_THEMES = ["dark", "light"];

/**
 * Create a settings store bound to one file.
 *
 * @param {string} filePath  Where settings.json lives.
 * @param {{ log?: { error: Function } }} [options]  Logger for load problems.
 * @returns {{ get: () => object, update: (partial: object) => object }}
 */
function createSettingsStore(filePath, { log = console } = {}) {
    let data = load();

    /**
     * Read the settings file. Missing file -> defaults. Broken file -> defaults
     * plus a log entry. Keys missing from the file get their default value.
     *
     * @returns {object}
     */
    function load() {
        try {
            if (!fs.existsSync(filePath)) return { ...DEFAULTS };
            const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
            return { ...DEFAULTS, ...parsed };
        } catch (err) {
            log.error(`Could not read settings file ${filePath}:`, err);
            return { ...DEFAULTS };
        }
    }

    /**
     * Write the current settings to disk, creating the folder if needed.
     */
    function save() {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }

    /**
     * Return a copy of all settings.
     * @returns {object}
     */
    function get() {
        return { ...data };
    }

    /**
     * Change some settings and save them.
     * Throws if a value is not allowed (for example an unknown theme name).
     *
     * @param {object} partial  The settings to change, e.g. { theme: "light" }.
     * @returns {object} All settings after the change.
     */
    function update(partial) {
        if ("theme" in partial && !VALID_THEMES.includes(partial.theme)) {
            throw new Error(`Unknown theme: ${partial.theme}`);
        }
        data = { ...data, ...partial };
        save();
        return get();
    }

    return { get, update };
}

module.exports = { createSettingsStore, DEFAULTS, VALID_THEMES };
