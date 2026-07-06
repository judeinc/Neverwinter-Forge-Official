from app import HOST, PORT, AppHandler, initialize_app_storage
from http.server import ThreadingHTTPServer
import socket
import threading
import time
import webbrowser


MAX_PORT_ATTEMPTS = 25


def open_browser(url):
    time.sleep(0.8)
    webbrowser.open(url)


def is_port_open(port):
    try:
        with socket.create_connection((HOST, port), timeout=0.25):
            return True
    except OSError:
        return False


def create_server():
    last_error = None
    for port in range(PORT, PORT + MAX_PORT_ATTEMPTS):
        if is_port_open(port):
            continue
        try:
            return ThreadingHTTPServer((HOST, port), AppHandler), port
        except OSError as exc:
            last_error = exc
    raise RuntimeError(f"Could not start Neverwinter Forge on ports {PORT}-{PORT + MAX_PORT_ATTEMPTS - 1}: {last_error}")


def main():
    initialize_app_storage()

    server, port = create_server()
    app_url = f"http://{HOST}:{port}/"
    threading.Thread(target=open_browser, args=(app_url,), daemon=True).start()
    print(f"Neverwinter Forge running at {app_url}")
    print(f"Outputs folder: {__import__('app').OUTPUTS}")
    print("Close this window to stop the app.")
    server.serve_forever()


if __name__ == "__main__":
    main()
