"""HTTP/SSE server exposing the living organism's state for the frontend.

Runs the world+brain loop in a background thread and serves the latest state:

  GET /state                 -> JSON snapshot (one frame of the organism's state)
  GET /stream                -> text/event-stream, the state pushed ~12x/s
  GET /trap?impossible=1     -> a crowdsourced trap (force the next event)
  GET /                      -> the frontend (if --frontend points at it)

Pure standard library, CPU, no extra dependencies. Everything the frontend draws
comes from the trained model via organism.brain; nothing here is scripted.
"""

from __future__ import annotations

import argparse
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from organism.brain import LivingBrain


TRAP_COOLDOWN_S = 3.0
MAX_STREAM_CLIENTS = 6


class Organism:
    def __init__(self, run_dir: str, fps: int = 20, seed: int | None = None) -> None:
        self.brain = LivingBrain(run_dir=run_dir, seed=seed)
        self.fps = fps
        self.lock = threading.Lock()
        self.state = self.brain.build_state(None)
        self._stop = False
        self._last_trap = 0.0
        self.stream_clients = 0

    def run(self) -> None:
        dt = 1.0 / self.fps
        while not self._stop:
            start = time.monotonic()
            state = self.brain.step(dt)
            with self.lock:
                self.state = state
            self.brain.life.save()  # throttled internally (~30 s)
            time.sleep(max(0.0, dt - (time.monotonic() - start)))
        self.brain.life.save(force=True)

    def snapshot(self) -> dict:
        with self.lock:
            return dict(self.state)

    def trap(self, impossible: bool) -> dict:
        now = time.monotonic()
        if now - self._last_trap < TRAP_COOLDOWN_S:
            return {"ok": False, "cooldown_s": round(TRAP_COOLDOWN_S - (now - self._last_trap), 1)}
        self._last_trap = now
        self.brain.world.request_trial(impossible)
        return {"ok": True, "impossible": impossible}


ORG: Organism | None = None
FRONTEND: Path | None = None


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def _json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        assert ORG is not None
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/state":
            self._json(ORG.snapshot())
        elif path == "/trap":
            query = parse_qs(parsed.query)
            impossible = query.get("impossible", ["0"])[0] == "1"
            self._json(ORG.trap(impossible))
        elif path == "/stream":
            if ORG.stream_clients >= MAX_STREAM_CLIENTS:
                self._json({"error": "too many stream clients"}, status=429)
                return
            ORG.stream_clients += 1
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self._cors()
            self.end_headers()
            try:
                while not ORG._stop:
                    payload = json.dumps(ORG.snapshot())
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(1.0 / 12)
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                ORG.stream_clients -= 1
        elif path in ("/", "/index.html") and FRONTEND is not None and FRONTEND.exists():
            body = FRONTEND.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        else:
            self._json({"error": "not found"}, status=404)

    def log_message(self, *args) -> None:  # quiet
        return


def main() -> None:
    global ORG, FRONTEND
    parser = argparse.ArgumentParser(description="Serve the living organism over HTTP/SSE.")
    parser.add_argument("--run-dir", default="runs/gravity_v3")
    parser.add_argument("--port", type=int, default=8200)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--fps", type=int, default=20)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--frontend", default=None, help="path to index.html to serve at /")
    args = parser.parse_args()

    if args.frontend:
        FRONTEND = Path(args.frontend)
    ORG = Organism(run_dir=args.run_dir, fps=args.fps, seed=args.seed)
    threading.Thread(target=ORG.run, daemon=True).start()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"organism live on http://{args.host}:{args.port}  (/state /stream /trap?impossible=1)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        ORG._stop = True
        server.shutdown()


if __name__ == "__main__":
    main()
