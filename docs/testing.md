# Testing

From fastest to most realistic. Each level catches what the one before cannot.

## 1. Unit tests

`odin test` on the parts with no I/O:

- **State machine:** scripted event sequences: normal login, wrong password, two prompts
  in a row (2FA), an info message, hitting `prompt_rounds_max`, and replies that cannot
  happen in the current state (must assert). The same sequences again in lock mode: no
  username step, and success ends in unlock instead of `start_session`.
- **Secrets:** after each send, in both binaries, the password buffer is all zero and
  its length is zero; in `lintel`, the write buffer too.
- **Messages:** every request and response round-trips against the JSON in greetd's
  protocol docs. Malformed input (truncated, wrong `type`, missing field, invalid UTF-8)
  returns an error and never crashes; extra fields are accepted.
- **Parsers:** `.desktop` fixtures (normal, `Hidden=true`, no `Exec`, field codes,
  a `[Desktop Action …]` section, comment only) and `/etc/passwd` fixtures.

## 2. Mock greetd

A test opens a Unix socket in a temporary directory, plays a scripted conversation and
runs lintel's client against it. Covers framing, short reads, a length prefix above
`message_size_max` and greetd closing the socket mid-conversation, without PAM.

## 3. fakegreet

`fakegreet` ships with greetd and is in the dev shell. It creates a fake socket, sets
`GREETD_SOCK` and runs the greeter:

```sh
fakegreet 'odin run src/greeter -- --windowed'
```

It asks for a password, then a visible "7 + 2:" question whose answer is `9`, so a
two-prompt login is tested for free. Check its source for the username it expects.

## 4. pam_wrapper

The lock screen's PAM side, without touching the real password or `/etc/pam.d`.
`libpam-wrapper` (in nixpkgs) is preloaded and points PAM at a private service
directory; its `pam_matrix` module checks passwords against a plain text file and
`pam_chatty` sends info and error messages.

```sh
lib=$(nix build --no-link --print-out-paths nixpkgs#libpam-wrapper)/lib
dir=$(mktemp -d)
mkdir "$dir/services"
echo "$USER:hunter2:lintel-lock" > "$dir/passdb"
cat > "$dir/services/lintel-lock" <<EOF
auth required $lib/pam_wrapper/pam_matrix.so passdb=$dir/passdb verbose
EOF
LD_PRELOAD=$lib/libpam_wrapper.so PAM_WRAPPER=1 PAM_WRAPPER_SERVICE_DIR=$dir/services \
    odin run src/lock -- --text
```

Covers the PAM thread, the mailbox and semaphore, a wrong then a right password, the
info message on success and the error message on failure (`verbose`). Put
`pam_chatty.so num_lines=16 info error` before `pam_matrix` to test many messages in
one conversation and `prompt_rounds_max`. Run it under valgrind with
`PAM_WRAPPER_DISABLE_DEEPBIND=1` to check that every response PAM frees was allocated
with `calloc`.

## 5. Nested cage

Inside the running niri session, cage opens as a window and reproduces the real kiosk:
one fullscreen client, one output.

```sh
fakegreet 'cage -- ./target/lintel'
```

## 6. Nested niri

Inside the running niri session, a second niri opens as a window and can be locked
without locking the real session. If `lintel-lock` hangs or crashes, only the window
stays locked; close it.

```sh
niri -- ./target/lintel-lock
```

The PAM service must exist on the host for this (see On hardware), or run it with the
pam_wrapper environment from level 4.

- Lock, a wrong password (the reject shake, the password selected), the right
  password (unlock and exit 0).
- `lintel-lock` started twice: the second exits with failure and the first keeps the
  lock.
- `lintel-lock -f`: the parent returns only once the window is covered.
- `kill -9` while locked: the window stays locked. Then start `lintel-lock` again to
  learn whether niri lets a new locker take over (the relock open decision).
- Vulkan broken on purpose (`VK_DRIVER_FILES=/nonexistent`): `lintel-lock` fails before
  locking, and `lintel-lock || swaylock` gives swaylock.

The nested niri has one output, so several outputs and hotplug wait for level 8.

## 7. A real login in a VM

With a `displayManager/greetd/lintel` aspect in Nixify:

```sh
nixos-rebuild build-vm --flake .#seiren
```

The only level that tests real PAM, the polkit rule for power actions, the permissions
on `/var/lib/lintel`, render-node access for the `greeter` user, and the `lintel-launch`
fallback (break Vulkan on purpose, for example with `VK_DRIVER_FILES=/nonexistent`, and
check that `agreety` appears).

Log in to niri in the VM and lock it too: real `pam_unix` through `unix_chkpwd`, and
recovery from VT2 after `kill -9` on `lintel-lock`.

## 8. On hardware

greetd only owns VT1. If lintel breaks, Ctrl+Alt+F2 reaches a normal getty. Keep the
tuigreet and regreet aspects in Nixify so going back is a one-line change.

The lock screen needs its PAM service, and swaylock as the fallback, in NixOS:

```nix
security.pam.services.lintel-lock = {};
security.pam.services.swaylock = {};
environment.systemPackages = [ pkgs.swaylock pkgs.swayidle ];
```

and in niri's `config.kdl`:

```kdl
binds {
    Mod+Alt+L { spawn "sh" "-c" "lintel-lock || swaylock"; }
}

spawn-at-startup "swayidle" "-w" \
    "timeout" "300" "lintel-lock -f || swaylock -f" \
    "before-sleep" "lintel-lock -f || swaylock -f" \
    "lock" "lintel-lock -f || swaylock -f"
```

swayidle's `lock` event also makes `loginctl lock-session` lock the screen. Check
several outputs here: a lock surface on each, one plugged in while locked, one
unplugged while locked.
