/**
 * outputs.js — the list of outputs (screens the lyrics can be shown on).
 *
 * Each output has:
 *   id   — a stable name used in messages and to track its window.
 *   name — the label shown in the control panel and the window title.
 *
 * To add or remove outputs, edit this list. Nothing else needs changing.
 */

const DEFAULT_OUTPUTS = [
    { id: "output-1", name: "Output 1" },
    { id: "output-2", name: "Output 2" },
];

module.exports = { DEFAULT_OUTPUTS };
