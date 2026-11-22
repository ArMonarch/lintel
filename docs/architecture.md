# Architecture

How lintel is put together: which process runs what, how it talks to greetd, how a login
moves through its states, and what lyleen has to grow before lintel can draw. The greetd
side of this is settled; the drawing side waits on lyleen and on the chosen design.

## Process model

```
systemd ─▶ greetd (root, VT1)
             └─▶ lintel-launch            as user `greeter`
                   └─▶ cage -s -- lintel  wlroots kiosk, one fullscreen client
                         └─▶ lintel       SDL3 window on Wayland, Vulkan via lyleen
```

- greetd sets `GREETD_SOCK`; lintel talks to it over that Unix socket.
- When `start_session` succeeds, lintel **must exit**. greetd starts the user's session
  only once the greeter process is gone.
- `lintel-launch` is the fallback wrapper (see Failure and fallback).

## greetd protocol

Each message is a `u32` length in native byte order followed by that many bytes of JSON.

Requests:

```json
{"type":"create_session","username":"…"}
{"type":"post_auth_message_response","response":"…"}      (or null)
{"type":"start_session","cmd":["/bin/sh","-c","niri-session"],"env":[]}
{"type":"cancel_session"}
```

Responses:

```json
{"type":"success"}
{"type":"error","error_type":"auth_error"|"error","description":"…"}
{"type":"auth_message","auth_message_type":"visible"|"secret"|"info"|"error","auth_message":"…"}
```

- Socket: `core:sys/posix` (`socket`, `connect`, `read`, `write`) on `AF_UNIX`.
- JSON: `core:encoding/json`, given one arena per message that is reset after decoding.
  An unknown `type` or a missing field is a protocol error, not a crash. Extra fields are
  ignored so a newer greetd does not break lintel.
- The socket is non-blocking and polled once per frame. The frame never waits on greetd,
  which matters during PAM's ~2 s delay after a wrong password.

## Login state machine

Pure: `login_step(state, event) -> (next_state, request)`. No I/O, no drawing. The frame
loop sends the request and draws the state.

```
Idle ──submit_username──▶ Awaiting ──auth_message(secret|visible)──▶ Prompting
                            │   ▲                                      │
                            │   └─────────────submit_response──────────┘
                            ├──auth_message(info|error)──▶ Notice ──acknowledge──▶ Awaiting
                            ├──success──▶ Authenticated ──start──▶ Starting ──success──▶ Exit
                            └──error──▶ Failed ──cancel_session──▶ Idle
```

- At most one request is in flight.
- A secret is sent only from `Prompting` with a secret prompt.
- `start_session` is sent only from `Authenticated`.
- Leaving a live session for `Idle` always sends `cancel_session`.
- A wrong password, an unknown user or a locked account is an expected outcome: shown,
  back to `Idle`. A reply that cannot happen in the current state is a bug: assert.
  greetd restarts a greeter that dies.

## Limits

| Name | Value | At the limit |
|---|---|---|
| `message_size_max` | 64 KiB | Checked against the length prefix before reading the body; close and show an error. |
| `prompt_rounds_max` | 16 | Cancel the session; stops a PAM stack that prompts forever. |
| `sessions_max` | 32 | Ignore further `.desktop` files, log once. |
| `users_max` | 64 | Same, for `/etc/passwd`. |
| `username_size_max` | 256 B | Input stops accepting characters. |
| `secret_size_max` | 1 KiB | Same; asserted again before encoding. |

Relationships between them are asserted at compile time, for example
`#assert(secret_size_max < message_size_max)`.

## Secrets

- The password lives in one fixed `[secret_size_max]u8` buffer and a length, filled
  from SDL text input events. It is never turned into a heap string.
- It is encoded straight into the preallocated greetd write buffer.
- Right after the write: `mem.zero_explicit` on the password buffer and on the write
  buffer, length set to zero. One procedure does all three so no caller can skip one.
- Never logged, never drawn except as dots.

## Sessions, users, state

- **Sessions:** `*.desktop` in `/run/current-system/sw/share/wayland-sessions`, reading
  `Name`, `Exec`, `Hidden`, `NoDisplay` from `[Desktop Entry]`. Field codes (`%f`, `%U`)
  are removed and the command is sent as `["/bin/sh","-c",exec]`, which handles quoting
  without a shell-word parser.
- **Users:** `/etc/passwd` entries with uid ≥ 1000 and a real shell.
- **State:** last user and last session in `/var/lib/lintel/state`, written to a
  temporary file and renamed over the old one. Missing or unreadable means defaults.
- **Power:** `systemctl suspend|reboot|poweroff`. The `greeter` user needs a polkit
  rule for `org.freedesktop.login1.*`; check that Nixify's `security` aspect covers it.

## GPU choice

lyleen currently prefers the discrete GPU. On `seiren` (Intel + NVIDIA) the greeter
should use the integrated GPU, or whichever GPU drives the display cage is on, so the
NVIDIA card is not woken at every boot and no cross-GPU copy happens on present. lintel
needs a way to pass that preference to lyleen's device selection.

Under NixOS the Vulkan drivers come from `/run/opengl-driver`; lintel sets no
`VK_DRIVER_FILES` of its own. The greeter session gets `/dev/dri/renderD*` access from
logind; confirm this in the VM test.

## Failure and fallback

A broken Vulkan stack (for example the NVIDIA kernel module and userspace out of step
after a rebuild without a reboot) would make lintel fail on every start, and greetd would
restart it forever. So greetd runs `lintel-launch` instead of cage directly:

1. Run `cage -s -- lintel`.
2. If it exits with failure before a session started, run `agreety` (text greeter,
   ships with greetd) on the same VT.

VT2 (Ctrl+Alt+F2) always has a normal getty, and Nixify keeps the tuigreet and regreet
aspects for a one-line rollback.

## What lyleen needs first

| lintel needs | lyleen today | TODO entry |
|---|---|---|
| Wallpaper | No texture upload | Texture upload; JPEG decode via `vendor:stb/image` |
| Clock, labels, password dots | No text | Text rendering: MSDF atlas, font loading (`vendor:stb/truetype`) |
| Typing, clicks | No input state | Input state: keyboard, text input, mouse |
| Fields, buttons | No UI | Cached immediate-mode UI |
| Blurred panels (designs 04, 09) | Compute and scopes exist | Post-processing / a blur pass |
| Breeze icons | No SVG | Converted at build time to MSDF or images by `build.odin` |
| Kanji (design 08) | — | CJK glyphs in the atlas, from Noto Serif CJK |

## Phases

1. **Headless core.** greetd client, state machine, sessions, users, state file, as a
   command-line greeter like `agreety`. Testable against `fakegreet` now.
2. **lyleen grows** texture upload, text, input and UI, in that order. Each step lets
   lintel draw a little more of the chosen design.
3. **The greeter.** Window under cage, the chosen design, GPU choice, `lintel-launch`.
4. **NixOS.** A package, and a `displayManager/greetd/lintel` aspect in Nixify.

## Open decisions

- **Repository:** lintel as its own repo with lyleen as a pinned flake input
  (recommended: a system service should not follow lyleen's master), or as
  `lyleen/examples/lintel` until the UI settles.
- **Design:** which mockup, or which combination.
- **User list:** show users from `/etc/passwd`, or always type a username.
- **Monitors:** cage shows one output; is that enough.
