/**
 * resizer.js — lets you drag the panel edges to change their size.
 *
 * HOW IT WORKS
 *   Each resizable panel has a drag handle (see index.html) and a CSS variable
 *   that sets its size (see the LAYOUT block in styles.css). Dragging the handle
 *   changes that variable. Each handle sits on the left or top edge of the panel
 *   it resizes, so dragging toward the panel makes it bigger.
 *
 * SAVING
 *   The size is saved in localStorage under "layout:<name>", so it survives a
 *   restart. resetLayout() removes the saved sizes and puts back the defaults
 *   from styles.css.
 *
 * TO ADD A NEW RESIZABLE PANEL
 *   1. Add a handle element with a unique id (class "resize-handle vertical"
 *      for a side panel, "horizontal" for a top/bottom panel) in index.html.
 *   2. Add a CSS variable for its size in styles.css and use it in the panel.
 *   3. Add an entry to PANELS below.
 */

/**
 * The resizable panels. Each entry:
 *   handleId   — id of the drag handle element.
 *   variable   — CSS variable that holds the panel's size.
 *   axis       — "x" for width (side panels), "y" for height (top/bottom panels).
 *   min / max  — limits in pixels. Functions, so the max can depend on the window.
 *   storageKey — name used to save the size.
 *   isLocked   — optional. Returns true when the panel can't be resized right now.
 */
const PANELS = [
    {
        handleId: "outputs-resize",
        variable: "--outputs-width",
        axis: "x",
        min: () => 200,
        max: () => 600,
        storageKey: "layout:outputs",
    },
    {
        handleId: "bottom-resize",
        variable: "--bottom-height",
        axis: "y",
        min: () => 120,
        max: () => window.innerHeight - 200,
        storageKey: "layout:bottom",
        // A collapsed bottom panel has no height to change.
        isLocked: () => document.getElementById("bottom-panel").classList.contains("collapsed"),
    },
    {
        handleId: "settings-resize",
        variable: "--settings-nav-width",
        axis: "x",
        min: () => 160,
        max: () => 420,
        storageKey: "layout:settings-nav",
    },
];

/**
 * Read a CSS variable on <html> as a number of pixels.
 * @param {string} name  e.g. "--outputs-width"
 * @returns {number}
 */
function readPixels(name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}

/**
 * Set a CSS variable on <html> to a number of pixels.
 * @param {string} name
 * @param {number} pixels
 */
function writePixels(name, pixels) {
    document.documentElement.style.setProperty(name, `${Math.round(pixels)}px`);
}

/**
 * Keep a size inside the panel's allowed range.
 * @param {number} size
 * @param {object} panel  An entry from PANELS.
 * @returns {number}
 */
function clampSize(size, panel) {
    return Math.min(Math.max(size, panel.min()), panel.max());
}

/**
 * Connect one handle: pressing and dragging it resizes its panel.
 * Uses pointer events, so it works with a mouse, a trackpad or a touch screen.
 * @param {object} panel  An entry from PANELS.
 */
function setupHandle(panel) {
    const handle = document.getElementById(panel.handleId);
    if (!handle) return;

    // Restore the saved size, if any.
    const saved = Number(localStorage.getItem(panel.storageKey));
    if (saved) writePixels(panel.variable, clampSize(saved, panel));

    let dragging = false;
    let startPointer = 0;   // mouse position when the drag began
    let startSize = 0;      // panel size when the drag began

    handle.addEventListener("pointerdown", (event) => {
        if (panel.isLocked && panel.isLocked()) return;
        dragging = true;
        handle.setPointerCapture(event.pointerId);
        startPointer = panel.axis === "x" ? event.clientX : event.clientY;
        startSize = readPixels(panel.variable);
        handle.classList.add("dragging");
        document.body.dataset.resizing = panel.axis;
        event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const pointer = panel.axis === "x" ? event.clientX : event.clientY;
        // Moving toward the panel (left or up) makes it bigger, so the sign is negative.
        const change = -(pointer - startPointer);
        writePixels(panel.variable, clampSize(startSize + change, panel));
    });

    /** Finish a drag: clean up and save the new size. */
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove("dragging");
        delete document.body.dataset.resizing;
        localStorage.setItem(panel.storageKey, String(Math.round(readPixels(panel.variable))));
    }
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
}

/**
 * Put every panel back to its default size from styles.css, and forget the
 * saved sizes. Use it from the General section of Settings.
 */
function resetLayout() {
    for (const panel of PANELS) {
        localStorage.removeItem(panel.storageKey);
        document.documentElement.style.removeProperty(panel.variable);
    }
}

// Connect every handle as soon as this script loads (it sits at the end of <body>).
for (const panel of PANELS) setupHandle(panel);
