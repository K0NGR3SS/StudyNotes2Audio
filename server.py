import http.server
import socketserver
import os

PORT = 5000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="Website_Files", **kwargs)

print(f"Starting server on port {PORT}")
print(f"Visit: http://0.0.0.0:{PORT}")

with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
    httpd.serve_forever()