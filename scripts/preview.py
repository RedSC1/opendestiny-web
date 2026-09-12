from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

ThreadingHTTPServer(('127.0.0.1', 4174), partial(PreviewHandler, directory='dist/client')).serve_forever()
