/**
 * state.test.js — checks the app state (what is currently being shown).
 *
 * HOW TO RUN
 *   npm test
 *   Uses only small test data built in this file, so no song files are needed.
 *   If SHOW_TEST_DIR is set, one extra test checks a real song.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { createAppState, getSlideOrder } = require("../src/main/state/appState");
const { readShowFile } = require("../src/main/storage/showFile");

/**
 * Build a small show with three verses. Its layout lists them as
 * c, a, b, so the layout order (not the object key order) must win.
 */
function makeEntry() {
    return {
        id: "test1",
        show: {
            name: "Test song",
            settings: { activeLayout: "L1" },
            layouts: {
                L1: { name: "Default", slides: [{ id: "c" }, { id: "a" }, { id: "b" }] },
            },
            slides: {
                a: { items: [], notes: "verse 1" },
                b: { items: [], notes: "verse 2" },
                c: { items: [], notes: "chorus" },
            },
            meta: {},
        },
    };
}

test("getSlideOrder follows the active layout, not object key order", () => {
    assert.deepEqual(getSlideOrder(makeEntry().show), ["c", "a", "b"]);
});

test("getSlideOrder skips layout entries that point at missing slides", () => {
    const show = makeEntry().show;
    show.layouts.L1.slides.push({ id: "ghost" });
    assert.deepEqual(getSlideOrder(show), ["c", "a", "b"]);
});

test("getSlideOrder falls back to slide keys when there is no layout", () => {
    const show = makeEntry().show;
    show.settings.activeLayout = "missing";
    assert.deepEqual(getSlideOrder(show).sort(), ["a", "b", "c"]);
});

test("loading a show starts at the first slide", () => {
    const state = createAppState();
    state.loadShow(makeEntry());
    const s = state.getState();
    assert.equal(s.showName, "Test song");
    assert.equal(s.slideIndex, 0);
    assert.equal(s.slideId, "c");
    assert.equal(s.slideCount, 3);
});

test("next and previous move through the slides and stop at the ends", () => {
    const state = createAppState();
    state.loadShow(makeEntry());

    assert.equal(state.nextSlide(), true);
    assert.equal(state.getState().slideId, "a");
    assert.equal(state.nextSlide(), true);
    assert.equal(state.getState().slideId, "b");
    assert.equal(state.nextSlide(), false, "already on the last slide");
    assert.equal(state.getState().slideId, "b");

    assert.equal(state.previousSlide(), true);
    assert.equal(state.previousSlide(), true);
    assert.equal(state.previousSlide(), false, "already on the first slide");
    assert.equal(state.getState().slideId, "c");
});

test("goToSlide clamps out-of-range positions", () => {
    const state = createAppState();
    state.loadShow(makeEntry());
    state.goToSlide(99);
    assert.equal(state.getState().slideIndex, 2);
    state.goToSlide(-5);
    assert.equal(state.getState().slideIndex, 0);
});

test("navigation does nothing when no show is loaded", () => {
    const state = createAppState();
    assert.equal(state.nextSlide(), false);
    assert.equal(state.getState().slideId, null);
    assert.equal(state.currentSlide(), null);
});

test("subscribers get the current state at once, then every change", () => {
    const state = createAppState();
    state.loadShow(makeEntry());

    const seen = [];
    const unsubscribe = state.subscribe((s) => seen.push(s.slideId));
    state.nextSlide();
    state.nextSlide();
    unsubscribe();
    state.nextSlide();

    assert.deepEqual(seen, ["c", "a", "b"], "one call on subscribe, then one per move");
});

test("a broken subscriber does not stop the others", () => {
    const state = createAppState();
    const originalError = console.error;
    console.error = () => {};
    try {
        state.subscribe(() => { throw new Error("boom"); });
        let calls = 0;
        state.subscribe(() => calls++);
        state.loadShow(makeEntry());
        assert.equal(calls, 2, "second subscriber still ran on the load");
    } finally {
        console.error = originalError;
    }
});

test("currentSlide returns the slide at the current position", () => {
    const state = createAppState();
    state.loadShow(makeEntry());
    assert.equal(state.currentSlide().notes, "chorus");
    state.nextSlide();
    assert.equal(state.currentSlide().notes, "verse 1");
});

test("a real song from SHOW_TEST_DIR loads into state", {
    skip: process.env.SHOW_TEST_DIR ? false : "set SHOW_TEST_DIR to run",
}, () => {
    const dir = process.env.SHOW_TEST_DIR;
    const file = fs.readdirSync(dir).find((f) => f.endsWith(".show"));
    const state = createAppState();
    state.loadShow(readShowFile(path.join(dir, file)));
    const s = state.getState();
    assert.ok(s.slideCount > 0, `${file} should have at least one slide`);
    assert.notEqual(s.slideId, null);
});
