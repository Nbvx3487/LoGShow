/**
 * output.js — behaviour of one output window.
 *
 * For now it only shows the output's name, read from the URL query
 * (?id=...&name=...). Drawing the lyrics comes after the state wiring.
 */

const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "Output";
document.getElementById("screen").textContent = name;
