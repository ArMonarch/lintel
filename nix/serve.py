import datetime
import functools
import http.server
import pathlib
import sys

PORT_DEFAULT = 8473
REPO = pathlib.Path(__file__).resolve().parent.parent
ROOT = REPO / "design"
LOG = REPO / "serve.log"


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        line = f"{datetime.datetime.now().isoformat(timespec='seconds')} {self.address_string()} {format % args}"
        print(line, flush=True)
        with LOG.open("a") as log:
            log.write(line + "\n")


def main():
    assert ROOT.is_dir(), ROOT
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT_DEFAULT
    handler = functools.partial(Handler, directory=str(ROOT))
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    except OSError as error:
        sys.exit(f"cannot listen on port {port}: {error.strerror}. Pass another port: python3 nix/serve.py <port>")
    with server:
        print(f"serving {ROOT} at http://localhost:{port}/ (requests logged to {LOG})", flush=True)
        server.serve_forever()


main()
