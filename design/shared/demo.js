// Demo behaviour shared by every design: stage scaling, live clock and a fake
// greetd conversation. Password "lintel" succeeds, anything else fails.

const DESIGNS = [
    "54-unlock-glide.html",
    "55-kde.html",
];
const ARCHIVE = [
    "01-revival.html",
    "02-lacquer.html",
    "03-floor.html",
    "04-plasma.html",
    "05-ring.html",
    "06-stacked.html",
    "07-terminal.html",
    "08-scroll.html",
    "09-glass.html",
    "10-dashboard.html",
    "11-paper.html",
    "12-flap.html",
    "13-nameboard.html",
    "14-onebit.html",
    "15-console.html",
    "16-readout.html",
    "17-signage.html",
    "18-decay.html",
    "19-bauhaus.html",
    "20-sleeve.html",
    "21-slide.html",
    "22-mascot.html",
    "23-ripple.html",
    "24-fingerprint.html",
    "25-circuit.html",
    "26-pinpad.html",
    "27-acid.html",
    "28-spotlight.html",
    "29-dial.html",
    "30-dotmatrix.html",
    "31-quiet.html",
    "32-corners.html",
    "33-zero.html",
    "34-slice.html",
    "35-crt.html",
    "36-arcade.html",
    "37-shader.html",
    "38-profiles.html",
    "39-eink.html",
    "40-bevel.html",
    "41-handheld.html",
    "42-material.html",
    "43-hud.html",
    "44-blueprint.html",
    "45-boarding.html",
    "46-neon.html",
    "47-polaroid.html",
    "48-letter.html",
    "49-scope.html",
    "50-topo.html",
    "51-unlock.html",
    "52-revival-breeze.html",
    "53-unlock-steady.html",
];
const SESSIONS = ["niri", "Plasma (Wayland)", "Shell"];
const USERS = ["frenzfries", "guest"];
const PASSWORD_DEMO = "lintel";
const AUTH_DELAY_MS = 900;
const LOGIN_FAILED_TEXT = "Login failed. Check your password and try again.";
const SUCCESS_RESET_MS = 2600;
const STATES = ["idle", "busy", "error", "info", "success"];
const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

const stage = document.querySelector("[data-stage]");
const form = document.querySelector("[data-login]");
const field_password = document.querySelector('[data-field="password"]');
const message = document.querySelector("[data-message]");
console.assert(stage !== null, "design has no [data-stage]");
console.assert(form !== null, "design has no [data-login]");
console.assert(field_password !== null, "design has no password field");

let session_index = 0;
let user_index = 0;
let demo_state_index = 0;
let wallpaper_name = WALLPAPER_DEFAULT;

function stage_fit() {
    const scale = Math.min(innerWidth / STAGE_WIDTH, innerHeight / STAGE_HEIGHT);
    const left = (innerWidth - STAGE_WIDTH * scale) / 2;
    const top = (innerHeight - STAGE_HEIGHT * scale) / 2;
    stage.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
}

function clock_format(now, format) {
    switch (format) {
        case "time":
            return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        case "weekday-day":
            return `${now.toLocaleDateString("en-GB", { weekday: "long" })} ${now.getDate()}`;
        case "long":
            return now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
        case "short":
            return now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
        case "year":
            return String(now.getFullYear());
        case "hours":
            return String(now.getHours()).padStart(2, "0");
        case "minutes":
            return String(now.getMinutes()).padStart(2, "0");
        case "weekday":
            return now.toLocaleDateString("en-GB", { weekday: "long" });
        case "month-year":
            return now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        case "greeting":
            return clock_greeting(now.getHours());
        case "cjk-time":
            return `${kanji_number(now.getHours())}時${kanji_number(now.getMinutes())}分`;
        case "cjk-date":
            return `${kanji_number(now.getMonth() + 1)}月${kanji_number(now.getDate())}日`;
        case "cjk-weekday":
            return `${"日月火水木金土"[now.getDay()]}曜日`;
        case "cjk-date-weekday":
            return `${kanji_number(now.getMonth() + 1)}月${kanji_number(now.getDate())}日・${"日月火水木金土"[now.getDay()]}曜`;
        case "day-of-year":
            return String(day_of_year(now));
        case "roman-year":
            return roman_number(now.getFullYear());
        case "day-month-year":
            return now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        default:
            console.assert(false, `unknown clock format ${format}`);
            return "";
    }
}

function clock_greeting(hour) {
    console.assert(hour >= 0 && hour < 24);
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

// Kanji numerals for 0..99, as written on clocks: 十六, 二十, 五.
function kanji_number(value) {
    console.assert(Number.isInteger(value) && value >= 0 && value < 100, value);
    const digits = "〇一二三四五六七八九";
    if (value < 10) return digits[value];
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${tens > 1 ? digits[tens] : ""}十${ones > 0 ? digits[ones] : ""}`;
}

function day_of_year(now) {
    const start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    console.assert(day >= 1 && day <= 366, day);
    return day;
}

function roman_number(value) {
    console.assert(Number.isInteger(value) && value > 0 && value < 4000, value);
    const symbols = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
        [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
    ];
    let text = "";
    let rest = value;
    for (const [amount, symbol] of symbols) {
        while (rest >= amount) {
            text += symbol;
            rest -= amount;
        }
    }
    console.assert(rest === 0);
    return text;
}

// [data-vertical] gets one span per character, the way GTK would stack one
// label per glyph in a vertical GtkBox (GTK CSS has no writing-mode).
function clock_tick() {
    const now = new Date();
    for (const node of document.querySelectorAll("[data-clock]")) {
        const text = clock_format(now, node.dataset.clock);
        if (node.dataset.vertical === undefined) {
            node.textContent = text;
        } else {
            node.innerHTML = [...text].map((glyph) => `<span>${glyph}</span>`).join("");
        }
    }
}

function state_set(state, text) {
    console.assert(STATES.includes(state), `unknown state ${state}`);
    for (const each of STATES) stage.classList.toggle(`is-${each}`, each === state);
    if (message !== null) message.textContent = text;
    field_password.disabled = state === "busy" || state === "success";
}

// Restarting the class retriggers the shake animation on a repeated failure.
function state_fail(text) {
    stage.classList.remove("is-error");
    void stage.offsetWidth;
    state_set("error", text);
}

function login_submit() {
    if (stage.classList.contains("is-busy")) return;
    if (field_password.value.length === 0) {
        field_password.focus();
        return;
    }
    state_set("busy", "Authenticating…");
    setTimeout(login_finish, AUTH_DELAY_MS);
}

function login_finish() {
    console.assert(stage.classList.contains("is-busy"));
    const correct = field_password.value === PASSWORD_DEMO;
    field_password.value = "";
    if (correct) {
        state_set("success", `Starting ${SESSIONS[session_index]}…`);
        setTimeout(() => {
            state_set("idle", "");
            field_password.focus();
        }, SUCCESS_RESET_MS);
    } else {
        state_fail(stage.dataset.loginFailed ?? LOGIN_FAILED_TEXT);
        field_password.focus();
    }
}

function text_set(selector, text) {
    for (const node of document.querySelectorAll(selector)) node.textContent = text;
}

function session_next() {
    session_index = (session_index + 1) % SESSIONS.length;
    text_set("[data-session-name]", SESSIONS[session_index]);
}

function user_next() {
    user_index = (user_index + 1) % USERS.length;
    const name = USERS[user_index];
    text_set("[data-user-name]", name);
    text_set("[data-user-initial]", name[0].toUpperCase());
    for (const input of document.querySelectorAll('[data-field="username"]')) input.value = name;
    state_set("idle", "");
    field_password.focus();
}

function theme_toggle() {
    const ink = stage.classList.toggle("is-ink");
    text_set("[data-theme-name]", ink ? "Paper" : "Ink");
}

function password_is_hidden() {
    if (field_password.hasAttribute("data-masked")) return !field_password.classList.contains("is-revealed");
    return field_password.type === "password";
}

function icon_centre(svg) {
    const box = svg.getBBox();
    if (box.width === 0 || box.height === 0) return;
    const view = svg.viewBox.baseVal;
    console.assert(view.width > 0 && view.height > 0, "icon has no viewBox");
    const x = box.x + box.width / 2 - view.width / 2;
    const y = box.y + box.height / 2 - view.height / 2;
    svg.setAttribute("viewBox", `${x} ${y} ${view.width} ${view.height}`);
}

function reveal_toggle(button) {
    const hidden = password_is_hidden();
    if (field_password.hasAttribute("data-masked")) field_password.classList.toggle("is-revealed", hidden);
    else field_password.type = hidden ? "text" : "password";
    const icon = button.querySelector("[data-icon]");
    icon.dataset.icon = hidden ? "view-hidden" : "view-visible";
    icon.innerHTML = ICONS[icon.dataset.icon];
    icon_centre(icon.querySelector("svg"));
    field_password.focus();
}

const POWER_TEXT = {
    suspend: "Suspending… (demo)",
    reboot: "Restarting… (demo)",
    shutdown: "Shutting down… (demo)",
};

// TODO-UPDATE-COMMENT: the states are now stepped with Ctrl+Alt+Up / Down, not F2
// ---
// F2 walks the states a real greetd conversation can put the screen in.
function demo_state_step(offset) {
    const demo = [
        ["idle", ""],
        ["busy", "Authenticating…"],
        ["error", stage.dataset.loginFailed ?? LOGIN_FAILED_TEXT],
        ["info", "Touch the fingerprint reader"],
        ["success", `Starting ${SESSIONS[session_index]}…`],
    ];
    console.assert(offset === 1 || offset === -1, offset);
    demo_state_index = (demo_state_index + offset + demo.length) % demo.length;
    const [state, text] = demo[demo_state_index];
    if (state === "error") state_fail(text);
    else state_set(state, text);
}

function wallpaper_set(name) {
    console.assert(WALLPAPERS.includes(name), `unknown wallpaper ${name}`);
    const root = document.documentElement.style;
    root.setProperty("--wallpaper", `url("${wallpaper_url(name, "")}")`);
    root.setProperty("--wallpaper-blur", `url("${wallpaper_url(name, "-blur")}")`);
    wallpaper_name = name;
    text_set("[data-wallpaper-name]", name);
    wallpaper_check(name);
}

function wallpaper_check(name) {
    for (const variant of ["", "-blur"]) {
        const url = wallpaper_url(name, variant);
        const image = new Image();
        image.onerror = () => {
            if (wallpaper_name !== name) return;
            text_set("[data-wallpaper-name]", `${name} failed to load: ${url}`);
            console.error(`wallpaper failed to load: ${url}`);
        };
        image.src = url;
    }
}

function wallpaper_next() {
    const index = WALLPAPERS.indexOf(wallpaper_name);
    console.assert(index !== -1);
    const name = WALLPAPERS[(index + 1) % WALLPAPERS.length];
    wallpaper_store(name);
    wallpaper_set(name);
}

function on_storage(event) {
    if (event.key !== WALLPAPER_STORAGE_KEY) return;
    wallpaper_set(wallpaper_load());
}

function page_url(name) {
    return `${name}?t=${Date.now()}`;
}

function page_links_fresh() {
    for (const link of document.querySelectorAll('a[href$=".html"]')) {
        link.href = page_url(link.getAttribute("href"));
    }
}

function design_go(offset) {
    const name = location.pathname.split("/").pop();
    const list = DESIGNS.includes(name) ? DESIGNS : ARCHIVE;
    const index = list.indexOf(name);
    console.assert(index !== -1, `${name} missing from DESIGNS and ARCHIVE`);
    location.href = page_url(list[(index + offset + list.length) % list.length]);
}

function on_click(event) {
    const target = event.target.closest("[data-action], [data-power]");
    if (target === null) return;
    if (target.dataset.power !== undefined) {
        console.assert(target.dataset.power in POWER_TEXT);
        state_set("info", POWER_TEXT[target.dataset.power]);
        return;
    }
    switch (target.dataset.action) {
        case "session": session_next(); break;
        case "switch-user": user_next(); break;
        case "reveal": reveal_toggle(target); break;
        case "theme": theme_toggle(); break;
        case "login": login_submit(); break;
        default: console.assert(false, `unknown action ${target.dataset.action}`);
    }
}

function button_press(selector) {
    const button = document.querySelector(selector);
    if (button === null) return;
    button.click();
}

const KEYMAP = {
    ArrowDown: () => demo_state_step(1),
    ArrowUp: () => demo_state_step(-1),
    ArrowRight: () => design_go(1),
    ArrowLeft: () => design_go(-1),
    KeyW: () => wallpaper_next(),
    KeyS: () => button_press('[data-action="session"]'),
    KeyU: () => button_press('[data-action="switch-user"]'),
    KeyV: () => button_press('[data-action="reveal"]'),
    KeyI: () => button_press('[data-action="theme"]'),
    KeyZ: () => button_press('[data-power="suspend"]'),
    KeyB: () => button_press('[data-power="reboot"]'),
    KeyQ: () => button_press('[data-power="shutdown"]'),
};

function on_key(event) {
    const caps = event.getModifierState?.("CapsLock") === true;
    for (const node of document.querySelectorAll("[data-capslock]")) node.hidden = !caps;
    if (event.type !== "keydown") return;
    if (!event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey) return;
    const run = KEYMAP[event.code];
    if (run === undefined) return;
    event.preventDefault();
    if (event.repeat) return;
    run();
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    login_submit();
});
field_password.addEventListener("input", () => {
    if (stage.classList.contains("is-error")) state_set("idle", "");
});
document.addEventListener("click", on_click);
document.addEventListener("keydown", on_key);
document.addEventListener("keyup", on_key);
addEventListener("resize", stage_fit);
addEventListener("storage", on_storage);

wallpaper_set(wallpaper_load());
text_set("[data-session-name]", SESSIONS[session_index]);
text_set("[data-user-name]", USERS[user_index]);
text_set("[data-user-initial]", USERS[user_index][0].toUpperCase());
for (const node of document.querySelectorAll("[data-capslock]")) node.hidden = true;
for (const node of document.querySelectorAll(".demo-hint")) node.hidden = window.top !== window;
page_links_fresh();
for (const svg of document.querySelectorAll("i[data-icon] > svg")) icon_centre(svg);
stage_fit();
clock_tick();
setInterval(clock_tick, 1000);
state_set("idle", "");
field_password.focus();
