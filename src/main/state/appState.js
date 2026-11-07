/**
 * appState.js — the single source of truth for what is being shown.
 *
 * WHAT IT HOLDS
 *   - The loaded show (the { id, show } pair from storage/showFile.js).
 *   - The current slide position, as an index into the show's slide order.
 *
 * WHY ONE PLACE
 *   The PC control window and the phone remote both send commands here.
 *   Output windows only display what this module says. If two screens ever
 *   disagree, this is the only place to check.
 *
 * HOW CHANGES SPREAD
 *   Every change calls notify(), which tells all subscribers the new state.
 *   Subscribers (output windows, the phone remote) update themselves from it.
 *
 * This file does not import Electron, so it can be tested with plain Node.
 */

/**
 * Work out the order slides should be shown in.
 * Uses the active layout's slide list when it exists, because that is the
 * order the song's author set. Otherwise falls back to the slides' own order.
 *
 * @param {object} show  The show object (the second item in a .show file).
 * @returns {string[]}   Slide ids in display order.
 */
function getSlideOrder(show) {
    const layoutId = show.settings && show.settings.activeLayout;
    const layout = layoutId && show.layouts ? show.layouts[layoutId] : null;

    if (layout && Array.isArray(layout.slides)) {
        // Keep only ids that actually exist in show.slides, so a stale
        // layout entry can't point at a missing verse.
        return layout.slides
            .map((s) => s.id)
            .filter((id) => id in show.slides);
    }
    return Object.keys(show.slides || {});
}

/**
 * Create a state holder. Each call makes an independent state, which keeps
 * tests isolated. The app itself creates one and shares it.
 *
 * @returns {object} The state API described below.
 */
function createAppState() {
    let loaded = null;     // { id, show } or null when nothing is loaded
    let slideOrder = [];   // slide ids in display order for the loaded show
    let position = 0;      // index into slideOrder
    const listeners = new Set();

    /**
     * Build the snapshot that subscribers and callers receive.
     * Returns plain data only, so nothing outside this module can change
     * the state by mutating what it got back.
     *
     * @returns {{ showId: string|null, showName: string|null, slideIndex: number,
     *             slideCount: number, slideId: string|null }}
     */
    function snapshot() {
        return {
            showId: loaded ? loaded.id : null,
            showName: loaded ? loaded.show.name : null,
            slideIndex: loaded ? position : -1,
            slideCount: slideOrder.length,
            slideId: loaded && slideOrder.length ? slideOrder[position] : null,
        };
    }

    /**
     * Tell every subscriber the state changed. Each listener gets a fresh
     * snapshot. A listener that throws is logged and skipped, so one broken
     * window can't stop the others from updating.
     */
    function notify() {
        const current = snapshot();
        for (const listener of listeners) {
            callListener(listener, current);
        }
    }

    /**
     * Call one subscriber, catching its errors so it can't break the others.
     *
     * @param {(state: object) => void} listener
     * @param {object} state  The snapshot to pass in.
     */
    function callListener(listener, state) {
        try {
            listener(state);
        } catch (err) {
            console.error("State listener failed:", err);
        }
    }

    /**
     * Load a show and start at its first slide.
     *
     * @param {{ id: string, show: object }} entry  A parsed .show entry.
     */
    function loadShow(entry) {
        loaded = entry;
        slideOrder = getSlideOrder(entry.show);
        position = 0;
        notify();
    }

    /** Clear the loaded show. */
    function unloadShow() {
        loaded = null;
        slideOrder = [];
        position = 0;
        notify();
    }

    /**
     * Move to a specific slide by its position.
     * Positions outside the show are clamped to the first or last slide, so
     * a bad request never leaves the state pointing at nothing.
     *
     * @param {number} index  Zero-based position in the slide order.
     * @returns {boolean} true if the position changed.
     */
    function goToSlide(index) {
        if (!loaded || slideOrder.length === 0) return false;
        const clamped = Math.min(Math.max(index, 0), slideOrder.length - 1);
        if (clamped === position) return false;
        position = clamped;
        notify();
        return true;
    }

    /**
     * Move to the next slide. Does nothing on the last slide.
     * @returns {boolean} true if the position changed.
     */
    function nextSlide() {
        return goToSlide(position + 1);
    }

    /**
     * Move to the previous slide. Does nothing on the first slide.
     * @returns {boolean} true if the position changed.
     */
    function previousSlide() {
        return goToSlide(position - 1);
    }

    /**
     * Register a function to be called on every change.
     * It is called once right away with the current state, so a new window
     * can draw itself without waiting for the next change.
     *
     * @param {(state: object) => void} listener
     * @returns {() => void} Call the returned function to unsubscribe.
     */
    function subscribe(listener) {
        listeners.add(listener);
        callListener(listener, snapshot());
        return () => listeners.delete(listener);
    }

    /**
     * Get the current show's slide text, for an output window to draw.
     * Returns null when no show or no slide is loaded.
     *
     * @returns {object|null} The slide object from show.slides.
     */
    function currentSlide() {
        if (!loaded || !slideOrder.length) return null;
        return loaded.show.slides[slideOrder[position]] || null;
    }

    return {
        loadShow,
        unloadShow,
        goToSlide,
        nextSlide,
        previousSlide,
        subscribe,
        getState: snapshot,
        currentSlide,
    };
}

module.exports = { createAppState, getSlideOrder };
