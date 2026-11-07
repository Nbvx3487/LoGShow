/**
 * settingsStore.test.js — checks saving and loading of settings.json.
 *
 * Uses a temporary folder created by the test, so no real settings are touched.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createSettingsStore, DEFAULTS } = require("../src/main/settings/settingsStore");

/** A fresh temporary folder and the settings file path inside it. */
function tempFile() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "logshow-settings-"));
    return path.join(dir, "settings.json");
}

const silentLog = { error: () => {} };

test("a missing file gives the defaults", () => {
    const store = createSettingsStore(tempFile(), { log: silentLog });
    assert.deepEqual(store.get(), DEFAULTS);
    assert.equal(store.get().theme, "dark");
});

test("updates are saved and read back by a new store", () => {
    const file = tempFile();
    createSettingsStore(file, { log: silentLog }).update({ theme: "light" });
    const reloaded = createSettingsStore(file, { log: silentLog });
    assert.equal(reloaded.get().theme, "light");
});

test("an unknown theme is rejected and nothing changes", () => {
    const store = createSettingsStore(tempFile(), { log: silentLog });
    assert.throws(() => store.update({ theme: "neon" }), /Unknown theme/);
    assert.equal(store.get().theme, "dark");
});

test("a broken settings file falls back to defaults and is logged", () => {
    const file = tempFile();
    fs.writeFileSync(file, "{ not json", "utf8");
    const logged = [];
    const store = createSettingsStore(file, { log: { error: (...a) => logged.push(a) } });
    assert.deepEqual(store.get(), DEFAULTS);
    assert.equal(logged.length, 1, "the problem was logged");
    assert.equal(fs.readFileSync(file, "utf8"), "{ not json", "the broken file was left alone");
});

test("keys missing from the file get their default value", () => {
    const file = tempFile();
    fs.writeFileSync(file, JSON.stringify({ theme: "light" }), "utf8");
    const store = createSettingsStore(file, { log: silentLog });
    assert.equal(store.get().theme, "light");
    assert.deepEqual(store.get().outputs, DEFAULTS.outputs);
});
