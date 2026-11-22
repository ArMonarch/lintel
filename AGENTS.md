# lintel

A graphical login greeter for greetd, written in Odin and drawn with lyleen (the
user's Vulkan GFX and immediate-mode UI library, `~/Project/lyleen`). It runs
fullscreen inside the `cage` kiosk compositor. Built for the user's NixOS config
(Nixify, host `seiren`, session `niri-session`).

The user drives design. Implement each change as guided, and ask when direction is
unclear.

## Status

Design phase. The look is iterated as HTML mockups in `design/` before the greeter is
drawn. The greetd client and login state machine can be written now, headless, since
they do not need lyleen (`docs/architecture.md`, phase 1).

## Docs

- `docs/architecture.md`: process model, greetd protocol, state machine, limits,
  secrets, GPU choice, fallback, and what lyleen has to grow first.
- `docs/design.md`: the mockups, how to view and extend them, assets.
- `docs/testing.md`: from unit tests to a real login in a VM.

## Code

- Never write comments in the code; the user writes them. If a change makes an
  existing comment outdated, prefix it so it shows up in the diff:
  ```odin
  // TODO-UPDATE-COMMENT: <reason>
  // ---
  ```
- Write imperative, procedural code.
- Avoid elaborate architecture: no layers or abstractions the change doesn't need.
- Put a named limit on everything that grows (`docs/architecture.md`, Limits), and
  assert what must hold. An out-of-order greetd reply is a bug and asserts; a wrong
  password is expected and is shown.
- The password never leaves its fixed buffer except into the greetd write buffer, and
  both are wiped with `mem.zero_explicit` right after the send. Never log it.

## Layout

`build.odin` drives the build, as in lyleen. `design/` holds the HTML mockups and the
assets the greeter will reuse. `nix/` holds dev-shell helpers.

## Dev shell

`nix develop` gives python3, cage and greetd (`fakegreet`, `agreety`).
`python3 nix/serve.py` serves the mockups at http://localhost:8473/ with caching off.

## Commits

Never commit or push unless explicitly told to.

Messages are to the point and follow `feat|chore|refactor|fix(scope): <message>`.
No Co-Authored-By or other trailers.
