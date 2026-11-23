# lintel

A login screen for [greetd](https://sr.ht/~kennylevinsen/greetd/), written in Odin and
drawn on the GPU with [lyleen](../lyleen), running fullscreen inside
[cage](https://github.com/cage-kiosk/cage).

```
greetd ──runs──▶ cage ──runs──▶ lintel ──greetd IPC──▶ greetd ──starts──▶ niri-session
niri   ──runs──▶ lintel-lock ──PAM──▶ unlocks the same niri session
```

`lintel-lock` is the lock screen: the same design, checked with PAM as the logged-in
user, so locking keeps the niri session running.

Not usable yet: the design is still being chosen, see `design/`.

## Getting started

```sh
nix develop                        # python3, cage, greetd
python3 nix/serve.py             # mockups at http://localhost:8473/, never cached
```

## Docs

- [Architecture](docs/architecture.md)
- [Design mockups](docs/design.md)
- [Testing](docs/testing.md)
