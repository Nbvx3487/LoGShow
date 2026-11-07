/**
 * confirmDialog.js — custom popups that replace the system confirm() and alert().
 *
 * Two functions:
 *   showConfirm({ title, message, confirmText, cancelText, danger })
 *       -> Promise<boolean>   true if confirmed, false if cancelled.
 *   showAlert({ title, message })
 *       -> Promise<void>      resolves when the user presses OK.
 *
 * Both draw a dark box over the page (styles in styles.css, under
 * "Custom confirm / alert dialog"). Only one dialog is open at a time.
 *
 * Keyboard: Enter confirms, Escape cancels (for an alert, Escape acts as OK).
 * Clicking the dark background cancels too.
 *
 * Debugging: if a popup doesn't close, check that the promise is awaited and
 * that the button's click handler calls finish().
 */

/** The dialog currently on screen, or null. Used so only one opens at a time. */
let openDialog = null;

/**
 * Is a custom dialog open right now? Other key handlers (such as Escape for
 * the settings menu) use this to avoid acting while a popup is up.
 * @returns {boolean}
 */
function isDialogOpen() {
    return openDialog !== null;
}

/**
 * Build and show a dialog, then wait for the user to choose.
 *
 * @param {object} options
 * @param {string} options.title         Heading of the popup.
 * @param {string} options.message       Body text. Line breaks are kept.
 * @param {string[]} options.buttons     Button labels, left to right. The last one is the primary.
 * @param {boolean} [options.danger]     If true, the primary button is red (for deletes).
 * @param {number} options.cancelIndex   Index of the button Escape or a background click picks.
 * @returns {Promise<number>}            Index of the button the user picked.
 */
function openDialogBox({ title, message, buttons, danger = false, cancelIndex }) {
    // A new dialog replaces any dialog still open, so none get stuck.
    if (openDialog) openDialog.close(cancelIndex);

    return new Promise((resolve) => {
        const backdrop = document.createElement("div");
        backdrop.className = "dialog-backdrop";

        const box = document.createElement("div");
        box.className = "dialog";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");

        const heading = document.createElement("h3");
        heading.textContent = title;

        const text = document.createElement("p");
        text.textContent = message;

        const actions = document.createElement("div");
        actions.className = "dialog-actions";

        // Ends the dialog and resolves the promise with the chosen index.
        function finish(index) {
            document.removeEventListener("keydown", onKey, true);
            backdrop.remove();
            openDialog = null;
            resolve(index);
        }

        const primaryIndex = buttons.length - 1;
        buttons.forEach((label, index) => {
            const button = document.createElement("button");
            button.textContent = label;
            if (index === primaryIndex) {
                button.classList.add("primary");
                if (danger) button.classList.add("danger-action");
            }
            button.addEventListener("click", () => finish(index));
            actions.appendChild(button);
        });

        box.appendChild(heading);
        box.appendChild(text);
        box.appendChild(actions);
        backdrop.appendChild(box);

        // Clicking the dark area outside the box counts as cancel.
        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) finish(cancelIndex);
        });

        // Enter = primary, Escape = cancel. Captured so the page underneath
        // (for example the settings menu's Escape handler) doesn't also act.
        function onKey(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                finish(primaryIndex);
            } else if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                finish(cancelIndex);
            }
        }
        document.addEventListener("keydown", onKey, true);

        openDialog = { close: finish };
        document.body.appendChild(backdrop);
        actions.lastChild.focus();
    });
}

/**
 * Ask a yes/no question with a custom popup.
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText="OK"]
 * @param {string} [options.cancelText="Cancel"]
 * @param {boolean} [options.danger=false]  Red confirm button, for destructive actions.
 * @returns {Promise<boolean>}  true if confirmed.
 */
async function showConfirm({
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    danger = false,
}) {
    const index = await openDialogBox({
        title,
        message,
        buttons: [cancelText, confirmText],
        danger,
        cancelIndex: 0,
    });
    return index === 1;
}

/**
 * Show a message with one OK button.
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.message
 * @returns {Promise<void>}
 */
async function showAlert({ title, message }) {
    await openDialogBox({
        title,
        message,
        buttons: ["OK"],
        cancelIndex: 0,
    });
}
