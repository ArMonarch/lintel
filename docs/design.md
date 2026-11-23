# Design mockups

The look is chosen in HTML before anything is drawn with lyleen. Each mockup is a
working page: a live clock, a fake greetd conversation and every state a real login can
reach, on a fixed 1920×1080 canvas scaled to fit the window.

## Viewing

```sh
nix develop
python3 nix/serve.py
```

Open http://localhost:8473/. `nix/serve.py` serves `design/` with `Cache-Control: no-store`, so
the browser never keeps an old stylesheet or script after a mockup changes (plain
`python3 -m http.server` sends no cache headers and browsers then cache files for days).
`index.html` shows the one design, 54 Unlock Glide. It opens on a lock screen (clock and
date over the bare wallpaper); any key, click or scroll lifts it into the login, and Esc
on an empty field or 30 s idle drops it again. `shared/curtain.js` does this for any page
with a `[data-lock]` view and `is-locked` on the stage.

The earlier designs (01–53, 55 KDE Breeze, 56 Transitions, 57 Users), `archive.html` and
the fonts only they use are kept in a full copy of this repository at
`~/Project/lintel-archive`, outside the repository.

On the design page:

- Password `lintel` succeeds, anything else fails.
- Every shortcut is Ctrl+Alt plus a key, so none of them clash with the browser's:

  | Ctrl+Alt + | Does |
  |---|---|
  | ↓ / ↑ | next / previous state: idle, busy, error, info, success |
  | W | next wallpaper |
  | S | next session |
  | V | show or hide the password |
  | Z | suspend |
  | B | restart |
  | Q | power off |

  T, L, D, R, Delete and the F-keys are left out: desktops take T, L, D, Delete and
  Ctrl+Alt+F* (VT switching), Firefox takes R.
- The wallpaper choice is kept in `localStorage`, and the picker on `index.html` switches
  the preview too.
- The session button cycles example values.

## The design

**54 Unlock Glide.** A lock screen first: the 148px time and 30px date over the bare
wallpaper, no vignette, and a bold 20px hint. Any key, click or scroll lifts it into the
login: the time and date never fade but scale to 72% and glide up as one clock over
500 ms, keeping their proportions, while the wallpaper takes KDE's blur (50px, contrast
0.8, saturation 1.5, brightness 0.7, over 500 ms, in-out quad) and the login fades in
over 400 ms. Locking runs it backwards. The login part uses KDE Breeze's sizes and
styling from KDE's source: a 126px avatar, an 18.67px name, the italic notification line
above the field, a 251×32 field with 5px corners and a #3daee9 focus ring, a 32px square
button, 48px action icons, the ±15px reject shake over 600 ms and the footer 4px from the
screen edge. The first version shows only the one user, frenzfries; the avatar is the
plain `user-identity` icon.

## Files

```
design/
  index.html          the design, with the sources looked at
  54-unlock-glide.html the design
  shared/base.css     palette tokens, the 1920×1080 stage, shake animation
  shared/demo.js      stage scaling, clock formats, fake login, keyboard shortcuts
  shared/wallpapers.js the wallpaper list and the stored choice
  shared/icons.js     Breeze icons inlined so they take currentColor
  assets/wallpapers/  each wallpaper at 1920×1080, plus a blurred copy
  assets/icons/       Breeze icon SVGs
```

## Adding a design

1. Copy `54-unlock-glide.html` to the next number, `58-name.html`, so it does not
   clash with the numbers in `~/Project/lintel-archive`.
2. Keep the `data-*` hooks `demo.js` relies on: `data-stage`, `data-login`,
   `data-field="password"`, `data-message`, `data-capslock`, `data-session-name`,
   `data-user-name`, `data-user-initial`, `data-action`, `data-power`, `data-clock`.
   Make the password input `type="text" data-masked autocomplete="off" spellcheck="false"`,
   not `type="password"`: `base.css` draws it as dots and the reveal button toggles
   `is-revealed`, and the browser never offers to save the demo password.
3. Paint the wallpaper with `var(--wallpaper, url("assets/wallpapers/qi.jpg"))` (or
   `--wallpaper-blur` with `qi-blur.jpg`), so Ctrl+Alt+W reaches it and the page still has a
   background if the script never runs. Write the fallback `url()` in the file that uses
   `var()`, relative to that file: browsers resolve a `url()` inside a custom property
   against the stylesheet where `var()` is used, not where the property was set. Load
   `shared/wallpapers.js` before `shared/demo.js`, and give shared files the current
   `?v=` stamp (bump it in every page when a shared file changes) so a server without
   cache headers never pairs a new page with an old script.
4. Add the file to `DESIGNS` in `shared/demo.js` and a card to `index.html`. Pages
   need no stamp: the index, the `all` link and Ctrl+Alt+←→ (which steps through
   `DESIGNS`) open every page with a fresh `?t=` query, so a browser never shows its
   cached copy of a page that has since changed. Only a page URL typed or
   bookmarked without the query can still come from the cache.

## Adding a wallpaper

Crop to 1920×1080 and blur with radius 28, then add the name to `WALLPAPERS` in
`shared/wallpapers.js`:

```sh
nix shell nixpkgs#imagemagick -c sh -c '
  magick in.jpg -resize "1920x1080^" -gravity center -extent 1920x1080 -strip -quality 88 design/assets/wallpapers/NAME.jpg
  magick design/assets/wallpapers/NAME.jpg -blur 0x28 -strip -quality 85 design/assets/wallpapers/NAME-blur.jpg'
```

## Constraints

lyleen draws on the GPU, so blur is just a pass. What still matters:

- Everything must be drawable from one wallpaper, one sans font, the Breeze icons
  and flat or gradient fills.
- No widget may need data that does not exist before login (music, weather, network).
- Every state in the Ctrl+Alt+↓ cycle needs a look, and the error state must be
  readable over the brightest part of the wallpaper.

## Assets

- **Icons:** KDE Breeze (dark) from `kdePackages.breeze-icons`: `system-shutdown`,
  `system-reboot`, `system-suspend` (32 px) and `system-switch-user`, `view-visible`,
  `view-hidden`, `go-next`, `user-identity` (22 px), `system-user-prompt` (32 px). They
  are monochrome paths, so they convert cleanly to MSDF.
- **Fonts:** Adwaita Sans (Inter-based), from the system; none are vendored.
- **Wallpapers:** `assets/wallpapers/NAME.jpg` at 1920×1080 and `NAME-blur.jpg`
  blurred with radius 28. `qi` is the painting the design was made for, a copy of
  `~/Pictures/Wallpapers/default.jpg`; `koi`, `forest`, `cliff`, `lake`, `peaks`,
  `cumulus` and `fuji` were added to see how the layout holds up on other images.
- **Palette** (`shared/base.css`): ink `#0d0706`, lacquer `#c8402c`, lacquer-deep
  `#8e2a1f`, gold `#e6b35c`, jade `#3fae9a`, parchment `#f2e8d8`, lilac `#e4e0ff`,
  danger `#ff7a6b`.
