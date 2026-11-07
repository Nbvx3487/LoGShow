/**
 * outputManager.test.js — checks the logic that opens and tracks output windows.
 *
 * Uses fake windows, so no Electron or display is needed. See
 * src/main/windows/outputManager.js for the code under test.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { createOutputManager } = require("../src/main/windows/outputManager");

const OUTPUTS = [
    { id: "a", name: "Output A" },
    { id: "b", name: "Output B" },
];

/**
 * Make a fake window that records focus calls and lets the test "close" it.
 */
function fakeWindow() {
    const listeners = {};
    const win = {
        focusCount: 0,
        destroyed: false,
        on(event, fn) { listeners[event] = fn; },
        focus() { win.focusCount++; },
        isDestroyed() { return win.destroyed; },
        close() { win.destroyed = true; if (listeners.closed) listeners.closed(); },
    };
    return win;
}

/** Build a manager whose openWindow records every window it creates. */
function setup() {
    const created = [];
    const changes = [];
    const manager = createOutputManager({
        outputs: OUTPUTS,
        openWindow: (output) => {
            const win = fakeWindow();
            win.output = output;
            created.push(win);
            return win;
        },
        onChange: (statuses) => changes.push(statuses),
    });
    return { manager, created, changes };
}

test("every output starts closed", () => {
    const { manager } = setup();
    assert.deepEqual(manager.getStatus(), [
        { id: "a", name: "Output A", open: false },
        { id: "b", name: "Output B", open: false },
    ]);
});

test("start opens only the chosen output", () => {
    const { manager, created } = setup();
    manager.start("a");
    assert.equal(created.length, 1);
    assert.equal(created[0].output.id, "a");
    assert.deepEqual(
        manager.getStatus().map((s) => s.open),
        [true, false]
    );
});

test("starting an already-open output focuses it and opens no new window", () => {
    const { manager, created } = setup();
    manager.start("a");
    manager.start("a");
    assert.equal(created.length, 1, "no second window");
    assert.equal(created[0].focusCount, 1, "existing window was focused");
});

test("start rejects an unknown output id", () => {
    const { manager } = setup();
    assert.throws(() => manager.start("nope"), /Unknown output: nope/);
});

test("showAll opens every closed output and leaves open ones alone", () => {
    const { manager, created } = setup();
    manager.start("a");
    manager.showAll();
    assert.equal(created.length, 2, "only output b was newly opened");
    assert.equal(created[0].focusCount, 0, "already-open output was not focused");
    assert.deepEqual(
        manager.getStatus().map((s) => s.open),
        [true, true]
    );
});

test("closing a window marks the output closed and reports the change", () => {
    const { manager, created, changes } = setup();
    manager.start("a");
    const before = changes.length;
    created[0].close();
    assert.equal(manager.getStatus()[0].open, false);
    assert.equal(changes.length, before + 1, "one change reported for the close");
    assert.equal(changes.at(-1)[0].open, false);
});

test("an output can be opened again after its window was closed", () => {
    const { manager, created } = setup();
    manager.start("a");
    created[0].close();
    manager.start("a");
    assert.equal(created.length, 2);
    assert.equal(manager.getStatus()[0].open, true);
});

test("onChange is reported when a window opens", () => {
    const { manager, changes } = setup();
    manager.start("b");
    assert.equal(changes.length, 1);
    assert.equal(changes[0][1].open, true);
});
