const CURTAIN_IDLE_MS = 30000;
const lock = document.querySelector("[data-lock]");
console.assert(lock !== null);

let curtain_timer = 0;

function curtain_is_down() {
    return stage.classList.contains("is-locked");
}

function curtain_arm() {
    clearTimeout(curtain_timer);
    curtain_timer = setTimeout(curtain_drop, CURTAIN_IDLE_MS);
}

function curtain_lift() {
    if (!curtain_is_down()) return;
    stage.classList.remove("is-locked");
    field_password.focus();
    curtain_arm();
}

function curtain_drop() {
    if (curtain_is_down()) return;
    if (stage.classList.contains("is-busy") || stage.classList.contains("is-success")) {
        curtain_arm();
        return;
    }
    field_password.value = "";
    state_set("idle", "");
    stage.classList.add("is-locked");
}

function on_curtain_key(event) {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock", "AltGraph"].includes(event.key)) return;
    if (!curtain_is_down()) {
        if (event.key === "Escape" && field_password.value.length === 0) {
            event.preventDefault();
            curtain_drop();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            field_password.value = "";
            state_set("idle", "");
        }
        curtain_arm();
        return;
    }
    const shortcut = event.ctrlKey && event.altKey;
    curtain_lift();
    if (shortcut) return;
    event.preventDefault();
    if (event.key.length === 1) field_password.value += event.key;
}

function on_curtain_pointer() {
    if (curtain_is_down()) curtain_lift();
    else curtain_arm();
}

document.addEventListener("keydown", on_curtain_key, true);
document.addEventListener("pointerdown", on_curtain_pointer, true);
document.addEventListener("wheel", on_curtain_pointer, { capture: true, passive: true });
field_password.addEventListener("input", curtain_arm);
