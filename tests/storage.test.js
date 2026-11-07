/**
 * storage.test.js — checks that .show files load and save correctly.
 *
 * HOW TO RUN
 *   1. Point SHOW_TEST_DIR at a folder of .show files, e.g.
 *        SHOW_TEST_DIR="/path/to/all songs" npm test
 *   2. Without SHOW_TEST_DIR, the folder-based tests are skipped and only
 *      the small built-in checks run.
 *
 * WHAT IT CHECKS
 *   - Every .show file in the folder parses.
 *   - Saving a loaded file gives back exactly the original text.
 *   - Broken input produces a clear error instead of crashing silently.
 *
 * Uses Node's built-in test runner, so no extra packages are needed.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
    parseShowText,
    serializeShow,
    readShowFile,
} = require("../src/main/storage/showFile");

const testDir = process.env.SHOW_TEST_DIR;

// --- Built-in checks (no song files needed) ----------------------------

test("rejects text that is not JSON", () => {
    assert.throws(() => parseShowText("not json"), /Not valid JSON/);
});

test("rejects a file that is not a [id, show] pair", () => {
    assert.throws(() => parseShowText('{"name":"x"}'), /two-item array/);
});

test("rejects a show that is missing required fields", () => {
    assert.throws(
        () => parseShowText('["abc",{"name":"x"}]'),
        /missing required field "slides"/
    );
});

test("round-trips a minimal valid show", () => {
    const text =
        '["abc",{"name":"x","slides":{},"layouts":{},"settings":{},"meta":{}}]';
    const entry = parseShowText(text);
    assert.equal(entry.id, "abc");
    assert.equal(serializeShow(entry), text);
});

// --- Folder-based checks (need SHOW_TEST_DIR) ---------------------------

const skipReason = testDir
    ? false
    : "set SHOW_TEST_DIR to a folder of .show files to run these";

const showFiles = testDir
    ? fs.readdirSync(testDir).filter((f) => f.endsWith(".show"))
    : [];

test("every .show file in SHOW_TEST_DIR loads", { skip: skipReason }, () => {
    const failures = [];
    for (const file of showFiles) {
        try {
            readShowFile(path.join(testDir, file));
        } catch (err) {
            failures.push(err.message);
        }
    }
    assert.deepEqual(failures, [], `${failures.length} file(s) failed to load`);
});

test("every .show file saves back byte-for-byte identical", { skip: skipReason }, () => {
    const changed = [];
    for (const file of showFiles) {
        const fullPath = path.join(testDir, file);
        const original = fs.readFileSync(fullPath, "utf8");
        const saved = serializeShow(readShowFile(fullPath));
        if (saved !== original) changed.push(file);
    }
    assert.deepEqual(changed, [], "these files changed on re-save");
});
