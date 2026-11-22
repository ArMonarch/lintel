# Testing

From fastest to most realistic. Each level catches what the one before cannot.

## 1. Unit tests

`odin test` on the parts with no I/O:

- **State machine:** scripted event sequences: normal login, wrong password, two prompts
  in a row (2FA), an info message, hitting `prompt_rounds_max`, and replies that cannot
  happen in the current state (must assert).
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
fakegreet 'odin run . -- --windowed'
```

It asks for a password, then a visible "7 + 2:" question whose answer is `9`, so a
two-prompt login is tested for free. Check its source for the username it expects.

## 4. Nested cage

Inside the running niri session, cage opens as a window and reproduces the real kiosk:
one fullscreen client, one output.

```sh
fakegreet 'cage -- ./target/lintel'
```

## 5. A real login in a VM

With a `displayManager/greetd/lintel` aspect in Nixify:

```sh
nixos-rebuild build-vm --flake .#seiren
```

The only level that tests real PAM, the polkit rule for power actions, the permissions
on `/var/lib/lintel`, render-node access for the `greeter` user, and the `lintel-launch`
fallback (break Vulkan on purpose, for example with `VK_DRIVER_FILES=/nonexistent`, and
check that `agreety` appears).

## 6. On hardware

greetd only owns VT1. If lintel breaks, Ctrl+Alt+F2 reaches a normal getty. Keep the
tuigreet and regreet aspects in Nixify so going back is a one-line change.
