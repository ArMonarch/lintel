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
`python3 -m http.server` sends no cache headers and browsers then cache files for days). `index.html` shows the designs being refined, side by side:
01 Revival, 52 Revival Breeze, 51 Unlock and 54 Unlock Glide. All open on a lock
screen (clock and date over the bare
wallpaper); any key, click or scroll lifts it into the login, and Esc on an empty field or
30 s idle drops it again. `shared/curtain.js` does this for any page with a `[data-lock]`
view and `is-locked` on the stage. The rest are set aside in `archive.html` as plain links;
`DESIGNS` in `shared/demo.js` lists the ones in focus and `ARCHIVE` the others, and
Ctrl+Alt+←→ steps through whichever list the open page is in.

On a design page:

- Password `lintel` succeeds, anything else fails.
- Every shortcut is Ctrl+Alt plus a key, so none of them clash with the browser's:

  | Ctrl+Alt + | Does |
  |---|---|
  | ↓ / ↑ | next / previous state: idle, busy, error, info, success |
  | → / ← | next / previous design |
  | W | next wallpaper |
  | S | next session |
  | U | switch user |
  | V | show or hide the password |
  | I | paper / ink theme (design 11) |
  | Z | suspend |
  | B | restart |
  | Q | power off |

  A key does nothing on a design that has no button for its action. T, L, D, R,
  Delete and the F-keys are left out: desktops take T, L, D, Delete and Ctrl+Alt+F*
  (VT switching), Firefox takes R.
- The wallpaper choice is kept in `localStorage`, so it follows you between designs,
  and the picker on `index.html` switches every preview at once.
- The session and switch-user buttons cycle example values.

## The designs

| # | Name | Idea |
|---|---|---|
| 01 | Revival | The old SDDM layout, cleaned up: left column, big lilac clock, pill fields. Opens on a centred lilac lock clock that lifts into the column, as in 51. |
| 02 | Lacquer | Ink panel fading from the left, colours from the painting, red seal avatar. |
| 03 | Floor | One strip along the dark floor; the painting stays uncovered. |
| 04 | Plasma | Plasma lock-screen layout on a blurred wallpaper that sharpens on login. Archived: 51 Unlock covers it. |
| 05 | Ring | swaylock-style ring around the clock, one arc per keystroke, no text box. |
| 06 | Stacked | hyprlock: stacked hours over minutes, greeting, one rounded input. |
| 07 | Terminal | A monospace console with getty wording. |
| 08 | Scroll | Vertical kanji clock echoing the painting's inscription. |
| 09 | Glass | Frosted card with clock, avatar, form and power bar. |
| 10 | Dashboard | Widget cards: clock, calendar, system facts, sign-in. |
| 11 | Paper | From the "Paper & ink" niri rice: a red cover block, an EB Garamond clock, one rule as the field, paper and ink themes. No wallpaper. |
| 12 | Flap | A full-screen split-flap departure board: double-height HH:MM, STATION/DATE/GATE, amber user and session rows, READY/CHECKING/DENIED/SEE REMARKS/BOARDING status flaps, a 30-cell password row, a Remarks row and word-flap power buttons. |
| 13 | Nameboard | A white railway nameboard hung on a tiled platform wall: the user's name huge in wide gothic over a session-coloured line band, neighbours as the next stations, the password a hairline rule under the name. |
| 14 | One Bit | A 1-bit desktop: the wallpaper Bayer-dithered to ink and paper behind a striped-titlebar Log In window with a user list box, session pop-up, block-character password field and double-bordered default button, a menubar clock top-right, a Power palette bottom-right, and modal alert boxes for errors and info. |
| 15 | Console | A 1960s hi-fi front panel: a 24-hour tuning scale with a red needle at the current time, a perforated speaker grille that shows the wallpaper as dot brightness, round session keys, a user knob, a dark password aperture with a status lamp and one honey Enter button. |
| 16 | Readout | A 3x2 wall of black readout tiles with colour-banded three-letter codes (CLK, USR, PWD, PWR, SES, MSG) in extended Orbitron caps, stepwise motion only, and a status tile that turns yellow, red or blue per state. |
| 17 | Signage | A bone-coloured industrial signage panel with black label plates, a heavy white clock, a recessed access-code slot with an amber/red/green lamp strip, colour-field session tiles, hazard-striped power-off, and the wallpaper framed in a bolted porthole. |
| 18 | Decay | Amber-tinted, ghosted and scanlined specimen with a bracket-cursor user roster, burn-in password dots and a vertical clock; the image warps magenta on error and decays to the true wallpaper on success. |
| 19 | Bauhaus | Bauhaus poster geometry on cream: a blue disc masking the wallpaper, a red diamond holding the password, a black diagonal band and rule carrying the greeting and a 200px Jost clock, the user name set vertically, three shape markers for sessions and a red power block. |
| 20 | Sleeve | A 1950s jazz sleeve: a duotone indigo-and-ochre halftone square beside an off-white field with a catalogue-number clock, the user name in two weights running off the edge, a hairline password rule and a small-caps track list. |
| 21 | Slide | A conference title slide: diagonal red panel with a 168px Geist greeting, clock subtitle and hairline password, wallpaper as the figure, footer meta line and a black page-number plate; every state is a wiped or pushed slide. |
| 22 | Mascot | A round blue owl on a cream halo breathes, blinks and tracks the caret, covers its eyes when the password is shown, shakes its head with a red bubble on failure, points at the fingerprint reader, and cheers on success. |
| 23 | Ripple | Nothing but a slim translucent pill and plain text in the four corners; every keystroke, submit, error and success is a ring rippling out across the wallpaper from the field. |
| 24 | Fingerprint | A 320px white fingerprint of stroked arcs on a dark plum stage, the user name beneath with session and switch-user as quiet side labels, a slim password line that shows typed characters as small dots, and the print itself as the state language: it fills pink in order while busy, drains red on error, pulses in a dotted halo on info, and one arc straightens into a progress bar above the session name on success. |
| 25 | Circuit | A top-down PCB: the user name is the part number on a black QFP, 24 blue DIP switches flip on per typed character, a jumper header picks the session, tactile buttons are power, and copper traces pulse, light green or stamp ERR with the status LED. |
| 26 | Pinpad | Twelve big passcode dots over a 3x3 hairline grid of session, user and power cells on charcoal, the chosen session filled white; dots pulse when busy, ring crimson on error and bounce lime into a result card on success. |
| 27 | Acid | Neo-brutalist paper sheet with an outlined hostname and a 264px Archivo Black clock on the left, a hard-shadowed '/ login' card with an acid-yellow button on the right, mono tabs, and a WRONG PASSWORD sticker that slaps onto the card on error. |
| 28 | Spotlight | A dark command palette: one translucent 720x64 pill with a user chip and password, grouped rows with keycap hints dropping below it, a tiny clock pill at the bottom; busy sweeps the pill border, error tints the first row red, success stretches the pill into a full-width bar. |
| 29 | Dial | A brushed-rim combination dial half-sunk into the bottom edge carries users, sessions and power actions around its rim under a single orange pointer, with a light Plex clock and a plain password field above. |
| 30 | Dot Matrix | A black 8px dot grid with the wallpaper halftoned through it, a 300px 5x7 dot-matrix clock, the user name, password slots and every message drawn in dots, one red dot marking power off. |
| 31 | Quiet | Midnight field with a large Fraunces greeting at the left third, a small gold clock line above it, a recessed password well whose gold halo breathes while busy, cools to rose on error with "That's not it. Take your time.", and expands as a ring to the screen edges on success. |
| 32 | Corners | Every control pushed to a screen corner: a heavy periwinkle clock top-right, a round avatar over a stack of full-radius pills bottom-right, and two round buttons bottom-left that open dark panels, leaving the centre to the wallpaper. |
| 33 | Zero | Nothing but the wallpaper until you type: huge monospace dots and a thick block cursor dead centre, a 20% clock whispering at the bottom, and a red edge flash as the only word for a wrong password. |
| 34 | Slice | A wizard of 15-degree sheared chips in bold uppercase Roboto: breadcrumb host/session/user top-left, status chips bottom-left, power and date chips bottom-right, and a dark parallelogram box with the user name huge, a thin underline field, step tabs on its top edge and BACK/LOGIN hanging off its corner; busy fills LOGIN as a progress bar, error and info slide a red or yellow chip into the breadcrumb row, success sweeps every chip off the left edge. |
| 35 | CRT | A dimmed wallpaper behind scanlines, a rolling bar and a tube vignette, a dithered pink-and-tan sigil above a glitch-sliced Bodoni headline, black mono fields with a flat pink Log in, and a VCR-style OSD; errors tear the frame and stamp ACCESS DENIED, success collapses the picture to a line, a dot, then black. |
| 36 | Arcade | A pixel arcade attract screen: the wallpaper ordered-dithered into off-white, slate and blossom pink under a chunky Pixel Code clock, a blinking PRESS ANY KEY that becomes a pixel-bordered box of block dots, PLAYER 1 and STAGE readouts, and a slate cabinet bar with pixel power icons. |
| 37 | Shader | A dark generated field of slow violet-to-pink neon rings drawn on a low-res canvas, with a full-width translucent strip holding a thin Lexend Giga clock, the user name and a pill password field, session/user picks on the left and power words on the right; the greeter state drives the shader's speed, hue, blur and brightness, snapping red on error, amber on info and blowing out to white on success. |
| 38 | Profiles | A console-style 'Who's signing in?' gate: blurred wallpaper above a flat grey sheet of big colour-block profile tiles with a cyan selection frame that becomes a progress ring, a password step beside the chosen tile, and footer key hints. |
| 39 | E-Ink | An e-paper book cover: the Literata Light clock as the title, the user as the author line, a hairline password rule with ink dots, small-caps power words along the bottom edge and the wallpaper as a 16-grey dithered plate, every state change a 150ms inversion flash. |
| 40 | Bevel | A late-90s grey bevelled logon dialog with a navy banner clock, pixel user picture and combo box over a desktop with a Power taskbar; wrong passwords pop a modal message box, info arrives as a tray balloon, and success closes the window and fades through black. |
| 41 | Handheld | Handheld-console two-column screen: square avatar, name and password circles on the left, a controller-glyph menu of session, user and power rows on the right, button hints and clock in a footer bar. |
| 42 | Material | Material-You tonal greeter: a palette sampled from the wallpaper tints a rounded surface card with floating-label field, segmented sessions, a wavy busy bar and a quiet power FAB under a big Rubik clock, and the scrim darkens itself on bright images. |
| 43 | Light HUD | A bright sci-fi HUD: the wallpaper washed to white under hairline brackets and tick rulers, a thin clock inside a cyan seconds-arc gauge, a bracketed passphrase slot, a vertical session ruler with a pointer, and three hexagonal power buttons; busy clamps the slot, error flashes the lines orange-red with an AUTH FAILED stamp, info draws a callout from the slot, success retracts the lines and reveals the full wallpaper. |
| 44 | Blueprint | A blueprint sheet where the password slot is a dimensioned part with drilled-hole dots, the clock is a stroked-numeral detail callout, sessions are a parts table, power sits in a revision table inside a full title block, and the states are drawn as a construction-line sweep, a red revision cloud, a numbered note and an APPROVED stamp. |
| 45 | Boarding | An off-white boarding pass with a punched perforation: SRN to NIR in giant condensed caps, the clock as boarding time, a security-code field whose barcode grows as you type, and power actions as gate tiles on the tear-off stub. |
| 46 | Neon | A pink Beon tube clock and cyan script greeting on a glass plate hung over a dark brick wall tinted by the wallpaper, with a cyan neon outline for the password, unlit tube session labels, a red WRONG PASSWORD sign that buzzes on when the main sign sputters, and three neon power glyphs. |
| 47 | Polaroid | Two instant photos on a plank table: the wallpaper in a tilted white frame with the user's name in pen and the password as a handwritten line of ink dots, beside a kraft clock tag on twine, a yellow session sticky with a red tick, and three round power stickers. |
| 48 | Letter | A typewritten letter on a dark wood desk: Courier Prime letterhead and body, x's struck for each password character, a red margin rule, P.S. lines for power, red-pen 'wrong password' with XXXX overtype on error, and a signed letter that folds into an addressed envelope on success. |
| 49 | Scope | A phosphor oscilloscope: green graticule with the password as a glowing pulse train and ASCII bus cells, the clock drawn by the beam as vector numerals, CH1/CH2 channel readouts for user and session, and soft-key power labels on the bezel. |
| 50 | Topo | A topographic sheet on cream paper: the user is a map pin whose label card holds the password, sessions are coloured routes to a summit, lake shore and hut, and the clock is written as coordinates in a legend with scale bar, north arrow and map-symbol power keys. |
| 51 | Unlock | Windows-style lock screen first; any key, click or scroll lifts it into a KDE Breeze login. Esc on an empty field or 30 s idle drops it again. |
| 52 | Revival Breeze | 01 Revival with KDE Breeze input fields: 300×40 boxes with 4px corners and a thin border that turns Breeze blue on focus, text left-aligned, the switch-user icon at the field's right end, and a matching square-cornered Login button. |
| 53 | Unlock Steady | 51 Unlock with one clock: the lock screen's 148px time and 30px date stay in place on both screens while the hint fades and the Breeze login rises in beneath them over the blurring wallpaper. Archived in favour of 54. |
| 54 | Unlock Glide | 51 Unlock where the time and date never fade: they shrink and glide from the lock size to 51's login size while everything else fades and the wallpaper blurs. |

## Files

```
design/
  index.html          all designs, with the sources looked at
  NN-name.html        one design each
  shared/base.css     palette tokens, the 1920×1080 stage, shake animation
  shared/demo.js      stage scaling, clock formats, fake login, keyboard shortcuts
  shared/wallpapers.js the wallpaper list and the stored choice
  shared/icons.js     Breeze icons inlined so they take currentColor
  assets/wallpapers/  each wallpaper at 1920×1080, plus a blurred copy
  assets/icons/       Breeze icon SVGs
  assets/fonts/       fonts vendored from nixpkgs for designs 11 and 13-50 (see Assets)
```

## Adding a design

1. Copy the closest `NN-name.html` to the next number.
2. Keep the `data-*` hooks `demo.js` relies on: `data-stage`, `data-login`,
   `data-field="password"`, `data-message`, `data-capslock`, `data-session-name`,
   `data-user-name`, `data-user-initial`, `data-action`, `data-power`, `data-clock`.
   Make the password input `type="text" data-masked autocomplete="off" spellcheck="false"`,
   not `type="password"`: `base.css` draws it as dots and the reveal button toggles
   `is-revealed`, and the browser never offers to save the demo password. Archived pages
   still use `type="password"`, which the reveal button also handles.
3. Paint the wallpaper with `var(--wallpaper, url("assets/wallpapers/qi.jpg"))` (or
   `--wallpaper-blur` with `qi-blur.jpg`), so Ctrl+Alt+W reaches it and the page still has a
   background if the script never runs. Write the fallback `url()` in the file that uses
   `var()`, relative to that file: browsers resolve a `url()` inside a custom property
   against the stylesheet where `var()` is used, not where the property was set. Load
   `shared/wallpapers.js` before `shared/demo.js`, and give shared files the current
   `?v=` stamp (bump it in every page when a shared file changes) so a server without
   cache headers never pairs a new page with an old script.
4. Add the file to `DESIGNS` (or `ARCHIVE`) in `shared/demo.js` and a card to `index.html`
   (or an entry to `archive.html`). Pages need no stamp: the index, the archive, the
   `all` link and Ctrl+Alt+←→ open every page with a fresh `?t=` query, so a browser never
   shows its cached copy of a page that has since changed. Only a page URL typed or
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

The mockups were first written for GTK4, so some comments in them mention GTK CSS
limits (no backdrop blur, no vertical writing). Those limits no longer apply: lyleen
draws on the GPU, so real blur and vertical text are just passes and layout. What still
matters:

- Everything must be drawable from one wallpaper, one sans font, one CJK serif font,
  the Breeze icons and flat or gradient fills.
- No widget may need data that does not exist before login (music, weather, network).
- Every state in the Ctrl+Alt+↓ cycle needs a look, and the error state must be readable over the
  brightest part of the painting.

## Assets

- **Icons:** KDE Breeze (dark) from `kdePackages.breeze-icons`: `system-shutdown`,
  `system-reboot`, `system-suspend` (32 px) and `system-switch-user`, `view-visible`,
  `view-hidden`, `go-next`, `user-identity` (22 px). They are monochrome paths, so they
  convert cleanly to MSDF.
- **Fonts:** Adwaita Sans (Inter-based) for text, Iosevka for design 07, Noto Serif CJK
  JP for kanji. Vendored in `assets/fonts/`, all from nixpkgs and OFL unless noted:
  EB Garamond (11), Lexend Exa (13, 18), Departure Mono (14), Orbitron (16),
  Barlow Condensed (17, 20), Jost (19), Geist (21), Quicksand (22), Archivo Black and
  Space Mono (27), IBM Plex Sans and Mono (29), Fraunces (31), Atkinson Hyperlegible
  Next (32), Roboto (34, Apache-2.0), Bodoni Moda (35), Pixel Code (36), Lexend Giga
  and Deca (37), Nunito (38), Literata (39), Red Hat Display (41), Rubik (42), B612
  (44), Beon and Dancing Script (46), Nanum Pen cut down to Latin (47), Courier Prime
  and Caveat (48), Overpass (50, OFL / LGPL-2.1). Design 25 uses the system Iosevka
  Nerd Font Mono.
- **Wallpapers:** `assets/wallpapers/NAME.jpg` at 1920×1080 and `NAME-blur.jpg`
  blurred with radius 28. `qi` is the painting the designs were made for, a copy of
  `~/Pictures/Wallpapers/default.jpg`; `koi`, `forest`, `cliff`, `lake`, `peaks`,
  `cumulus` and `fuji` were added to see how each layout holds up on other images.
- **Palette** (`shared/base.css`): ink `#0d0706`, lacquer `#c8402c`, lacquer-deep
  `#8e2a1f`, gold `#e6b35c`, jade `#3fae9a`, parchment `#f2e8d8`, lilac `#e4e0ff`,
  danger `#ff7a6b`.
