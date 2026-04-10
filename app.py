import os
from flask import Flask
from config import MEDIA_ROOT, THUMBNAIL_DIR
from backend.routes.pages import pages_bp
from backend.routes.api import api_bp
from backend.routes.stream import stream_bp
from backend.services.scanner import scan_media


def create_app():
    app = Flask(__name__)

    # Ensure media directories exist
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    os.makedirs(os.path.join(MEDIA_ROOT, "video"), exist_ok=True)
    os.makedirs(os.path.join(MEDIA_ROOT, "audio"), exist_ok=True)
    os.makedirs(THUMBNAIL_DIR, exist_ok=True)

    # Register blueprints
    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(stream_bp)

    # Initial media scan
    with app.app_context():
        catalog = scan_media(MEDIA_ROOT)
        print(f"[StreamBox] Scanned {len(catalog)} media file(s)")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="127.0.0.1", port=5000)
