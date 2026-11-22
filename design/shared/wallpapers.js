const WALLPAPERS = ["qi", "koi", "forest", "cliff", "lake", "peaks", "cumulus", "fuji"];
const WALLPAPER_DEFAULT = "qi";
const WALLPAPER_STORAGE_KEY = "lintel.wallpaper";

function wallpaper_url(name, variant) {
    console.assert(WALLPAPERS.includes(name), `unknown wallpaper ${name}`);
    console.assert(variant === "" || variant === "-blur", `unknown variant ${variant}`);
    return new URL(`assets/wallpapers/${name}${variant}.jpg`, document.baseURI).href;
}

function wallpaper_load() {
    let name = null;
    try {
        name = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    } catch {
        name = null;
    }
    return WALLPAPERS.includes(name) ? name : WALLPAPER_DEFAULT;
}

function wallpaper_store(name) {
    console.assert(WALLPAPERS.includes(name), `unknown wallpaper ${name}`);
    try {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, name);
    } catch {
        return;
    }
}
