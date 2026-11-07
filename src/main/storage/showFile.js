/**
 * showFile.js — reads and writes .show files (the song/lyrics format).
 *
 * WHAT A .show FILE IS
 *   A .show file is a single line of compact JSON. Its top level is a
 *   two-item array:  [ showId, showObject ]
 *   - showId:     a short string identifying the show (e.g. "8bea3e57497")
 *   - showObject: the song itself. Important fields:
 *       name, category, settings, timestamps, meta (title/author/copyright),
 *       slides (each slide holds its text lines), layouts (slide order),
 *       media, and one optional key: "origin" OR "reference" (or neither).
 *
 * WHY THIS FILE EXISTS
 *   Everything that touches .show files goes through here, so if a song
 *   fails to load or save, this is the first place to look.
 *
 * BACKWARD COMPATIBILITY
 *   The files in the original lyrics collection are the test set. Running
 *   tests/storage.test.js checks that they load and save back unchanged.
 *
 * NOTE ON FILE CONTENT
 *   The file's text is produced by JSON.stringify with no spaces. This is
 *   what makes a load-then-save round trip byte-for-byte identical.
 */

const fs = require("fs");

/**
 * Parse the text of a .show file into { id, show }.
 * Throws a descriptive Error if the text is not a valid .show structure.
 *
 * @param {string} text  The raw file contents (UTF-8).
 * @returns {{ id: string, show: object }}
 */
function parseShowText(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error(`Not valid JSON: ${err.message}`);
    }

    // Expect [ id, showObject ]
    if (!Array.isArray(data) || data.length !== 2) {
        throw new Error("Expected a two-item array [id, show]");
    }

    const [id, show] = data;
    if (typeof id !== "string") {
        throw new Error("The show id (first item) must be a string");
    }
    if (typeof show !== "object" || show === null || Array.isArray(show)) {
        throw new Error("The show (second item) must be an object");
    }

    // Fields every .show file has. Missing ones mean the file is damaged
    // or not a .show file at all.
    const required = ["name", "slides", "layouts", "settings", "meta"];
    for (const field of required) {
        if (!(field in show)) {
            throw new Error(`Show is missing required field "${field}"`);
        }
    }

    return { id, show };
}

/**
 * Turn a { id, show } pair back into .show file text.
 * Uses compact JSON (no spaces) to match the original files exactly.
 *
 * @param {{ id: string, show: object }} entry
 * @returns {string}
 */
function serializeShow({ id, show }) {
    return JSON.stringify([id, show]);
}

/**
 * Read a .show file from disk.
 *
 * @param {string} filePath  Absolute path to the .show file.
 * @returns {{ id: string, show: object }}
 */
function readShowFile(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    try {
        return parseShowText(text);
    } catch (err) {
        // Add the file name so the error points to the broken song.
        throw new Error(`Could not read ${filePath}: ${err.message}`);
    }
}

/**
 * Write a { id, show } pair to disk as a .show file.
 *
 * @param {string} filePath  Absolute path to write to.
 * @param {{ id: string, show: object }} entry
 */
function writeShowFile(filePath, entry) {
    fs.writeFileSync(filePath, serializeShow(entry), "utf8");
}

module.exports = {
    parseShowText,
    serializeShow,
    readShowFile,
    writeShowFile,
};
