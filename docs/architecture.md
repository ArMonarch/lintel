# Architecture

How lintel is put together: which process runs what, how it talks to greetd and to PAM,
how a login moves through its states, and what lyleen has to grow before lintel can
draw. The lock screen is built first, then the greeter (see Phases). The greetd side
of this is settled; the lock side and the drawing side wait on lyleen and on the chosen
design.

## Two binaries

lintel is two programs built from one source tree:

- **`lintel`**, the login greeter. greetd runs it under cage as the `greeter` user, at
  boot and after every logout.
- **`lintel-lock`**, the lock screen. niri runs it as the logged-in user, from a key
  bind or from swayidle, and the niri session keeps running underneath.

Both draw the same design and share every part you see and type into. Each `main` owns
only its window and its way of checking the password.

```
src/
  core/      shared: drawing the design, password field and secret buffer, clock,
             wallpaper, caps lock, power actions, auth state machine
  greeter/   lintel:      greetd client, sessions, users, state file, SDL3 window under cage
  lock/      lintel-lock: PAM as the current user, ext-session-lock surfaces, one per output
```

`build.odin` builds `src/greeter` into `lintel` and `src/lock` into `lintel-lock`.
`core` never imports either.

| | `lintel` | `lintel-lock` |
|---|---|---|
| Runs as | `greeter`, started by greetd | the logged-in user, started by niri |
| Who checks the password | greetd, through PAM, as root | `lintel-lock`, through PAM, as the user |
| Auth transport | JSON over `GREETD_SOCK` | PAM on a worker thread (see Lock mode) |
| Username | typed or picked | always the current user, so that step is skipped |
| On success | `start_session`, then exit | unlock the session, then exit |
| Window | one SDL3 window under cage | one lock surface per output |
| Footer | Desktop Session (left), Keyboard Layout (right) | Keyboard Layout only |
| Other user | yes | no |

Neither binary runs as root. A login without greetd would need root for PAM, logind and
the VT, or a privileged helper that is greetd again, so greetd stays.

## Process model

```
systemd ─▶ greetd (root, VT1)
             └─▶ lintel-launch            as user `greeter`
                   └─▶ cage -s -- lintel  wlroots kiosk, one fullscreen client
                         └─▶ lintel       SDL3 window on Wayland, Vulkan via lyleen

niri (the user's session)
  ├─▶ key bind ─────────▶ lintel-lock     lock surfaces on niri, Vulkan via lyleen
  └─▶ swayidle ─────────▶ lintel-lock -f  same, returns once the session is locked
```

- greetd sets `GREETD_SOCK`; lintel talks to it over that Unix socket.
- When `start_session` succeeds, lintel **must exit**. greetd starts the user's session
  only once the greeter process is gone.
- `lintel-launch` is the fallback wrapper (see Failure and fallback).
- `lintel-lock` exits 0 only after it has unlocked the session.

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

## Auth state machine

Pure: `login_step(state, event) -> (next_state, request)`. No I/O, no drawing. The frame
loop sends the request and draws the state. It lives in `core` and both binaries run it.

greetd only relays PAM's conversation: its `secret`, `visible`, `info` and `error`
messages are PAM's `PAM_PROMPT_ECHO_OFF`, `PAM_PROMPT_ECHO_ON`, `PAM_TEXT_INFO` and
`PAM_ERROR_MSG`. So the events and requests are the same in both binaries and only the
transport differs: `lintel` turns a request into greetd JSON, `lintel-lock` hands it to
its PAM thread.

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
- In `lintel-lock`, `submit_username` is sent at start with the current user, and
  `start` means unlock instead of `start_session`. `cancel_session` ends the PAM
  transaction, and the next submit starts a new one.

## Lock mode

`lintel-lock` locks the running niri session with the Wayland `ext-session-lock-v1`
protocol and checks the password with PAM as the user it runs as.

**Locking.**

1. Connect to `WAYLAND_DISPLAY`, bind `ext_session_lock_manager_v1`, `wl_compositor`,
   `wl_seat` and every `wl_output`. A missing lock manager means exit with failure.
2. Initialise Vulkan through lyleen before asking for the lock, so a broken driver fails
   while the session is still unlocked and the fallback can run (see Failure and
   fallback).
3. Send `lock`. On `finished` without `locked` (another locker holds the session), exit
   with failure.
4. Create one lock surface per output, draw a frame on each straight after its
   `configure`, and add or drop surfaces as outputs come and go, up to `outputs_max`.
5. On `locked`, `-f` forks: the parent exits 0, so `swayidle -w` lets the machine sleep
   only once the screen is covered.

**Unlocking.** On `success` from PAM: `unlock_and_destroy`, `wl_display_roundtrip`,
exit 0. Nothing else unlocks. If `lintel-lock` dies, niri keeps the session locked and
shows a plain colour.

**PAM.** `pam_start("lintel-lock", user, &conversation, &handle)`, then
`pam_authenticate`, then `pam_setcred(PAM_REFRESH_CRED)`, whose failure is logged and
not shown, then `pam_end`. No `pam_acct_mgmt`: an account that expires during the
session must still be able to unlock it. The user comes from `getpwuid(getuid())`. On
NixOS `pam_unix` reads `/etc/shadow` through the setuid `unix_chkpwd` helper, so
`lintel-lock` itself needs no privilege.

- `pam_authenticate` blocks, about 2 s after a wrong password, so PAM runs on its own
  thread and the frame loop never waits on it, as with the non-blocking greetd socket.
- The conversation function runs on that thread. For each message it puts the prompt
  into a one-slot mailbox, which the frame loop polls once per frame and turns into an
  `auth_message` event, then waits on a semaphore for the reply. At most one request is
  in flight, so one slot each way is enough.
- Prompt text is copied into a fixed `[prompt_size_max]u8` buffer. Each response is a
  `calloc`'d buffer, because PAM frees it.
- The state machine is in `Awaiting` while the PAM thread reads the secret buffer, and
  nothing writes to it in that state (asserted).

**Input.** The lock surfaces are not SDL windows, so keyboard and pointer come from
`wl_keyboard` and `wl_pointer` through libxkbcommon, feeding the same input state that
SDL feeds in `lintel`. Text input, Caps Lock and the keyboard layout name come from the
xkb state.

## Limits

| Name | Value | At the limit |
|---|---|---|
| `message_size_max` | 64 KiB | Checked against the length prefix before reading the body; close and show an error. |
| `prompt_rounds_max` | 16 | Cancel the session; stops a PAM stack that prompts forever. |
| `sessions_max` | 32 | Ignore further `.desktop` files, log once. |
| `users_max` | 64 | Same, for `/etc/passwd`. |
| `username_size_max` | 256 B | Input stops accepting characters. |
| `secret_size_max` | 1 KiB | Same; asserted again before encoding. |
| `prompt_size_max` | 1 KiB | `lintel-lock`: a longer PAM prompt is cut at a UTF-8 boundary. |
| `outputs_max` | 16 | `lintel-lock`: further outputs get no lock surface and stay blank, log once. |

Relationships between them are asserted at compile time, for example
`#assert(secret_size_max < message_size_max)`.

## Secrets

- The password lives in one fixed `[secret_size_max]u8` buffer and a length, filled
  from text input events (SDL in `lintel`, xkb in `lintel-lock`). It is never turned
  into a heap string.
- It leaves that buffer for exactly one place:
  - `lintel`: encoded straight into the preallocated greetd write buffer. Right after
    the write, `mem.zero_explicit` on the password buffer and on the write buffer,
    length set to zero.
  - `lintel-lock`: copied into the `calloc`'d PAM response, then `mem.zero_explicit` on
    the password buffer, length set to zero. PAM owns the response: libpam wipes it
    before freeing it, and `pam_end` wipes its own copy in `PAM_AUTHTOK`.
- In each binary one procedure does the copy and the wipes, so no caller can skip one.
- Never logged, never drawn except as dots.

## Sessions, users, state

- **Sessions:** `*.desktop` in `/run/current-system/sw/share/wayland-sessions`, reading
  `Name`, `Exec`, `Hidden`, `NoDisplay` from `[Desktop Entry]`. Field codes (`%f`, `%U`)
  are removed and the command is sent as `["/bin/sh","-c",exec]`, which handles quoting
  without a shell-word parser.
- **Users:** the first version has one user, given on the command line
  (`lintel --user frenzfries`, set by the NixOS aspect), and no way to pick another.
  A later version lists `/etc/passwd` entries with uid ≥ 1000 and a real shell, up to
  `users_max`, revealed from the avatar (see Open decisions).
- **State:** last user and last session in `/var/lib/lintel/state`, written to a
  temporary file and renamed over the old one. Missing or unreadable means defaults.
- **Power:** `systemctl suspend|reboot|poweroff`. The `greeter` user needs a polkit
  rule for `org.freedesktop.login1.*`; check that Nixify's `security` aspect covers it.
  In `lintel-lock` the user's own active session already allows these.
- **Lock mode** reads no sessions, no user list and no state file. The name and avatar
  are the current user's.

## GPU choice

lyleen currently prefers the discrete GPU. On `seiren` (Intel + NVIDIA) the greeter
should use the integrated GPU, or whichever GPU drives the display cage is on, so the
NVIDIA card is not woken at every boot and no cross-GPU copy happens on present. lintel
needs a way to pass that preference to lyleen's device selection. `lintel-lock` should
use the GPU niri renders on, for the same reason.

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

The lock screen has the same problem, with a worse outcome: a lock that fails must
still leave the screen locked. So niri and swayidle run `lintel-lock || swaylock`:

- Vulkan or Wayland setup fails before `lock`, so the session is still unlocked:
  `lintel-lock` exits with failure and swaylock locks instead.
- `lintel-lock` dies after `locked`: niri keeps the session locked. swaylock then
  tries to take over the lock. Whether niri allows a new locker after the old one died
  is an open decision. If it does not, log in on VT2 and run `lintel-lock` again with
  niri's `WAYLAND_DISPLAY`.

## What lyleen needs first

| lintel needs | lyleen today | TODO entry |
|---|---|---|
| Wallpaper | No texture upload | Texture upload; JPEG decode via `vendor:stb/image` |
| Clock, labels, password dots | No text | Text rendering: MSDF atlas, font loading (`vendor:stb/truetype`) |
| Typing, clicks | No input state | Input state: keyboard, text input, mouse |
| Fields, buttons | No UI | Cached immediate-mode UI |
| Blurred wallpaper behind the login | Compute and scopes exist | Post-processing / a blur pass |
| Breeze icons | No SVG | Converted at build time to MSDF or images by `build.odin` |
| Lock surfaces (`lintel-lock`) | SDL3 windows only | Present to a `VkSurfaceKHR` made by the caller from a raw `wl_surface` (`vkCreateWaylandSurfaceKHR`) |
| One lock surface per output | One swapchain | Several swapchains on one device, created and dropped while running |
| Input on lock surfaces | Input from SDL3 | Input state fed from outside SDL: `wl_keyboard` through libxkbcommon, `wl_pointer` |

The Wayland side of `lintel-lock` (the lock protocol, outputs, seat, xkb) stays in
`src/lock`; lyleen only needs to draw to surfaces it did not create and accept input
it did not read.

## Phases

The lock screen comes first and the greeter second: the lock screen runs inside the
session that is already in use every day, so it is easy to try, and a broken one costs
a VT switch, not a boot.

1. **lyleen is finished first:** texture upload, text, input and UI, in that order,
   plus the three lock-screen rows in What lyleen needs first.
2. **The lock screen.**
   - `lintel-lock --text`: the shared state machine and the PAM thread and
     conversation, driven from the terminal, no Wayland. Testable against pam_wrapper.
   - Then drawn: the lock protocol, one surface per output, xkb input, `-f`, the
     chosen design, and the `|| swaylock` fallback. Tested in a nested niri, then on
     the real session.
3. **The greeter.**
   - `lintel --text`: the greetd client, sessions, users and state file on the same
     state machine, driven from the terminal like `agreety`. Testable against
     `fakegreet`.
   - Then drawn: window under cage, GPU choice, `lintel-launch`.
4. **NixOS.** A package with both binaries, a lock aspect (the `lintel-lock` PAM
   service, the niri bind and swayidle), then a `displayManager/greetd/lintel`
   aspect.

The headless parts do not need lyleen and can be written earlier, in the same order.

## Open decisions

- **Repository:** lintel as its own repo with lyleen as a pinned flake input
  (recommended: a system service should not follow lyleen's master), or as
  `lyleen/examples/lintel` until the UI settles.
- **User list (after the first version):** how the other users appear. The current
  idea is to reveal them when the pointer is over the avatar (mocked up as 57 Users in
  `~/Project/lintel-archive`); it also needs a keyboard way in, since the greeter is
  used without a mouse.
- **Monitors:** cage shows one output; is that enough.
- **Lock on several outputs:** which output shows the form (the focused one, the one
  under the pointer, or each one); the others show the wallpaper and clock.
- **Relock after a crash:** whether niri lets a new locker take over a session whose
  locker died. Decides if `|| swaylock` covers a crash or only a failed start.
- **Lock screen buttons:** whether `lintel-lock` keeps Sleep, Restart and Shut Down.
