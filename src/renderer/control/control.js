/**
 * control.js — behaviour of the control window.
 *
 * Sections, in order:
 *   1. State       — the last known outputs and settings.
 *   2. Theme       — applies the chosen theme to <html data-theme>.
 *   3. Outputs     — the Outputs panel (right side) and its buttons.
 *   4. Bottom      — the Lyrics / Scriptures tabs.
 *   5. Settings    — the full-screen settings menu and its sections.
 *   6. Start-up    — connects everything when the page loads.
 *
 * Every button sends its request through window.outputsApi or window.settingsApi
 * (defined in src/preload/preload.js). Those return the new state, and the
 * matching onChange listener redraws the page.
 *
 * Debugging: open DevTools (View > Toggle Developer Tools) and look at the
 * Console for errors from these handlers.
 */

// ---------- 1. State ----------

/** Last outputs list received from the main process: [{ id, name, open }]. */
let outputStatuses = [];

/** Last settings received from the main process: { theme, ... }. */
let settings = {};

/** Which settings section is showing: "general" or "outputs". */
let activeSection = "general";

// ---------- 2. Theme ----------

/**
 * Apply a theme by setting data-theme on <html>. The colours come from styles.css.
 * @param {string} theme  "dark" or "light".
 */
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

/**
 * Show an error from a request in the console and in a custom popup
 * (see confirmDialog.js), so a failed button press is never silent.
 * @param {string} what  Short description of what failed.
 * @param {unknown} err
 */
function reportError(what, err) {
    console.error(what, err);
    showAlert({
        title: "Something went wrong",
        message: `${what}\n${err && err.message ? err.message : err}`,
    });
}

// ---------- 3. Outputs panel ----------

/**
 * Redraw the Outputs panel rows. Each row has a Start show button when the
 * output is closed, and an End show button when it is open.
 * @param {{ id: string, name: string, open: boolean }[]} statuses
 */
function renderOutputs(statuses) {
    outputStatuses = statuses;
    const list = document.getElementById("output-list");
    list.textContent = "";

    if (statuses.length === 0) {
        list.textContent = "No outputs. Add one in Settings > Outputs settings.";
        return;
    }

    for (const output of statuses) {
        const row = document.createElement("div");
        row.className = "output-row";

        const label = document.createElement("div");
        label.textContent = output.name;

        const status = document.createElement("div");
        status.className = output.open ? "output-status open" : "output-status";
        status.textContent = output.open ? "Open" : "Closed";

        const button = document.createElement("button");
        button.textContent = output.open ? "End show" : "Start show";
        button.addEventListener("click", () => {
            const request = output.open
                ? window.outputsApi.endOutput(output.id)
                : window.outputsApi.startOutput(output.id);
            request.catch((err) => reportError("Could not change this output.", err));
        });

        const text = document.createElement("div");
        text.appendChild(label);
        text.appendChild(status);

        row.appendChild(text);
        row.appendChild(button);
        list.appendChild(row);
    }
}

/**
 * Wire the Show all and End all buttons.
 */
function wireGroupButtons() {
    document.getElementById("show-all").addEventListener("click", () => {
        window.outputsApi.showAll().catch((err) => reportError("Could not show all outputs.", err));
    });
    document.getElementById("end-all").addEventListener("click", () => {
        window.outputsApi.endAll().catch((err) => reportError("Could not end all outputs.", err));
    });
}

// ---------- 4. Bottom panel tabs ----------

/**
 * Show one tab's content and highlight its button. Does not change whether
 * the panel is open or collapsed.
 * @param {string} name  "lyrics" or "scriptures".
 */
function selectTab(name) {
    for (const tab of document.querySelectorAll(".tab")) {
        tab.classList.toggle("active", tab.dataset.tab === name);
    }
    document.getElementById("tab-lyrics").hidden = name !== "lyrics";
    document.getElementById("tab-scriptures").hidden = name !== "scriptures";
}

/**
 * Collapse or expand the bottom panel. Collapsed, only the tab strip shows.
 * @param {boolean} collapsed
 */
function setBottomCollapsed(collapsed) {
    document.getElementById("bottom-panel").classList.toggle("collapsed", collapsed);
}

/**
 * Wire the Lyrics / Scriptures tabs:
 *   - Pressing a tab that is not selected shows it (and opens the panel if collapsed).
 *   - Pressing the tab that is already selected collapses the panel.
 *   - Pressing it again while collapsed opens the panel.
 */
function wireTabs() {
    for (const tab of document.querySelectorAll(".tab")) {
        tab.addEventListener("click", () => {
            const panel = document.getElementById("bottom-panel");
            const isSelected = tab.classList.contains("active");
            const isCollapsed = panel.classList.contains("collapsed");

            if (isSelected && !isCollapsed) {
                setBottomCollapsed(true);     // same tab again: collapse
                return;
            }
            selectTab(tab.dataset.tab);       // show this tab
            setBottomCollapsed(false);        // and make sure the panel is open
        });
    }
}

// ---------- 5. Settings menu ----------

/**
 * Open the full-screen settings menu.
 */
function openSettings() {
    document.getElementById("settings-overlay").hidden = false;
    renderSettingsSection();
}

/**
 * Close the settings menu and go back to the control window.
 */
function closeSettings() {
    document.getElementById("settings-overlay").hidden = true;
}

/**
 * Draw the active settings section on the left.
 */
function renderSettingsSection() {
    const content = document.getElementById("settings-content");
    content.textContent = "";

    for (const button of document.querySelectorAll(".section-button")) {
        button.classList.toggle("active", button.dataset.section === activeSection);
    }

    const section = document.createElement("div");
    section.className = "settings-section";
    content.appendChild(section);

    if (activeSection === "general") {
        renderGeneralSettings(section);
    } else if (activeSection === "outputs") {
        renderOutputSettings(section);
    }
}

/**
 * General section: the theme choice.
 * @param {HTMLElement} section  Container to fill.
 */
function renderGeneralSettings(section) {
    const heading = document.createElement("h3");
    heading.textContent = "General";
    section.appendChild(heading);

    const row = document.createElement("div");
    row.className = "setting-row";

    const label = document.createElement("label");
    label.textContent = "Theme";

    const select = document.createElement("select");
    for (const [value, text] of [["dark", "Dark"], ["light", "Light"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    }
    select.value = settings.theme || "dark";
    select.addEventListener("change", () => {
        window.settingsApi.update({ theme: select.value })
            .catch((err) => reportError("Could not save the theme.", err));
    });

    row.appendChild(label);
    row.appendChild(select);
    section.appendChild(row);
}

/**
 * Outputs settings section: rename, remove, and add outputs.
 * @param {HTMLElement} section  Container to fill.
 */
function renderOutputSettings(section) {
    const heading = document.createElement("h3");
    heading.textContent = "Outputs settings";
    section.appendChild(heading);

    for (const output of outputStatuses) {
        const row = document.createElement("div");
        row.className = "setting-row";

        // Renaming: save when the field loses focus or Enter is pressed.
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = output.name;
        nameInput.maxLength = 40;
        nameInput.addEventListener("change", () => {
            window.outputsApi.renameOutput(output.id, nameInput.value)
                .catch((err) => reportError("Could not rename this output.", err));
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "danger";
        removeButton.addEventListener("click", async () => {
            const confirmed = await showConfirm({
                title: `Remove "${output.name}"?`,
                message: output.open
                    ? "Its window will close. This can't be undone."
                    : "This can't be undone.",
                confirmText: "Remove",
                cancelText: "Cancel",
                danger: true,
            });
            if (!confirmed) return;
            window.outputsApi.removeOutput(output.id)
                .catch((err) => reportError("Could not remove this output.", err));
        });

        row.appendChild(nameInput);
        row.appendChild(removeButton);
        section.appendChild(row);
    }

    // Add a new output.
    const addRow = document.createElement("div");
    addRow.className = "add-row";

    const newName = document.createElement("input");
    newName.type = "text";
    newName.placeholder = "New output name";
    newName.maxLength = 40;

    const addButton = document.createElement("button");
    addButton.textContent = "Add output";
    addButton.addEventListener("click", () => {
        window.outputsApi.addOutput(newName.value)
            .then(() => { newName.value = ""; })
            .catch((err) => reportError("Could not add the output.", err));
    });

    addRow.appendChild(newName);
    addRow.appendChild(addButton);
    section.appendChild(addRow);
}

/**
 * Wire the settings menu: open/close buttons and its section list.
 */
function wireSettings() {
    document.getElementById("settings-button").addEventListener("click", openSettings);
    document.getElementById("settings-close").addEventListener("click", closeSettings);

    for (const button of document.querySelectorAll(".section-button")) {
        button.addEventListener("click", () => {
            activeSection = button.dataset.section;
            renderSettingsSection();
        });
    }

    // Escape closes the settings menu, as most menus do. Not while a popup is
    // open: that popup takes the Escape key for itself.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !isDialogOpen()) closeSettings();
    });
}

// ---------- 6. Start-up ----------

/**
 * Connect everything once the page has loaded: version, theme, outputs,
 * settings, and the buttons.
 */
async function init() {
    wireGroupButtons();
    wireTabs();
    wireSettings();

    window.appInfo.version().then((version) => {
        document.getElementById("version").textContent = `Version: ${version}`;
    });

    // Settings first, so the theme is correct before anything is drawn.
    settings = await window.settingsApi.get();
    applyTheme(settings.theme);

    // Redraw when the main process reports a change.
    window.settingsApi.onChange((updated) => {
        settings = updated;
        applyTheme(settings.theme);
        if (!document.getElementById("settings-overlay").hidden) renderSettingsSection();
    });
    window.outputsApi.onChange((statuses) => {
        renderOutputs(statuses);
        if (!document.getElementById("settings-overlay").hidden) renderSettingsSection();
    });

    renderOutputs(await window.outputsApi.getOutputs());
}

init().catch((err) => reportError("The control window could not start.", err));
