/**
 * control.js — behaviour of the control window.
 *
 * Responsibilities:
 *   - Show the app version in the main area.
 *   - Draw the Outputs panel: one row per output, with its open/closed status
 *     and a "Start show" button.
 *   - Send button presses to the main process through window.outputsApi
 *     (defined in src/preload/preload.js).
 *   - Redraw the panel whenever an output window opens or closes.
 *
 * Debugging tip: open the DevTools (View > Toggle Developer Tools) to see
 * errors from this file.
 */

/**
 * Draw the outputs list from a list of statuses.
 * The list is rebuilt from scratch each time, which keeps it simple and
 * always in sync with the main process.
 *
 * @param {{ id: string, name: string, open: boolean }[]} statuses
 */
function renderOutputs(statuses) {
    const list = document.getElementById("output-list");
    list.textContent = ""; // remove the old rows

    for (const output of statuses) {
        const row = document.createElement("div");
        row.className = "output-row";

        const label = document.createElement("div");
        label.textContent = output.name;

        const status = document.createElement("div");
        status.className = output.open ? "output-status open" : "output-status";
        status.textContent = output.open ? "Open" : "Closed";

        const button = document.createElement("button");
        button.textContent = "Start show";
        button.addEventListener("click", () => {
            // Asks the main process to open this output. The reply is the new
            // status list; it's ignored here because onChange also delivers it.
            window.outputsApi.startOutput(output.id).catch((err) => {
                console.error("Could not start output:", err);
            });
        });

        const left = document.createElement("div");
        left.appendChild(label);
        left.appendChild(status);

        row.appendChild(left);
        row.appendChild(button);
        list.appendChild(row);
    }
}

/**
 * Wire up the page once it has loaded.
 */
function init() {
    // Version in the main area.
    window.appInfo.version().then((version) => {
        document.getElementById("version").textContent = `Version: ${version}`;
    });

    // "Show all" opens every output that is closed.
    document.getElementById("show-all").addEventListener("click", () => {
        window.outputsApi.showAll().catch((err) => {
            console.error("Could not show all outputs:", err);
        });
    });

    // Initial list, then a redraw every time an output opens or closes.
    window.outputsApi.getOutputs().then(renderOutputs);
    window.outputsApi.onChange(renderOutputs);
}

init();
