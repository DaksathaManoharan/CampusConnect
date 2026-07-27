"""
Campus Connect — Event Management System
server.py  |  Python HTTP server with proper folder routing

Folder structure served:
    /               → templates/index.html
    /static/css/*   → static/css/
    /static/js/*    → static/js/

Usage:
    python server.py

Then open:  http://localhost:8000
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse

# ── Config ───────────────────────────────────────────────────────
PORT      = 8000
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
# ─────────────────────────────────────────────────────────────────


class CampusConnectHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path

        # Root  →  templates/index.html
        if path in ('/', ''):
            self._serve_file(os.path.join(BASE_DIR, 'templates', 'index.html'), 'text/html')

        # /static/*  →  static/ folder
        elif path.startswith('/static/'):
            rel      = path.lstrip('/')               # e.g. "static/css/style.css"
            abs_path = os.path.join(BASE_DIR, rel)
            mime     = self._mime(abs_path)
            self._serve_file(abs_path, mime)

        else:
            self.send_error(404, 'Not Found')

    # ── helpers ──────────────────────────────────────────────────
    def _serve_file(self, abs_path, mime):
        if not os.path.isfile(abs_path):
            self.send_error(404, f'File not found: {abs_path}')
            return
        with open(abs_path, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type',   mime)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    @staticmethod
    def _mime(path):
        ext = os.path.splitext(path)[1].lower()
        return {
            '.html': 'text/html; charset=utf-8',
            '.css' : 'text/css',
            '.js'  : 'application/javascript',
            '.json': 'application/json',
            '.png' : 'image/png',
            '.jpg' : 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg' : 'image/svg+xml',
            '.ico' : 'image/x-icon',
            '.woff2':'font/woff2',
        }.get(ext, 'application/octet-stream')

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()}  {fmt % args}")


def run():
    url = f"http://localhost:{PORT}"
    print("=" * 55)
    print("  [Campus Connect] — Local Dev Server")
    print("=" * 55)
    print(f"  Root     : {BASE_DIR}")
    print(f"  Templates: templates/index.html")
    print(f"  Static   : static/css/  |  static/js/")
    print(f"  URL      : {url}")
    print("  Press    : Ctrl+C to stop")
    print("=" * 55)
    webbrowser.open(url)
    with socketserver.TCPServer(("", PORT), CampusConnectHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n  [OK]  Server stopped.")


if __name__ == "__main__":
    run()