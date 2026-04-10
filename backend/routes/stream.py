import os
import re
from flask import Blueprint, Response, request, abort, send_file
from backend.services.scanner import get_item
from backend.utils.mime import guess_mime
from config import CHUNK_SIZE, THUMBNAIL_DIR

stream_bp = Blueprint("stream", __name__)


@stream_bp.route("/stream/<media_id>")
def stream_media(media_id):
    item = get_item(media_id)
    if not item:
        abort(404)

    filepath = item["absolute_path"]
    if not os.path.isfile(filepath):
        abort(404)

    file_size = os.path.getsize(filepath)
    mime = guess_mime(filepath)
    range_header = request.headers.get("Range")

    if not range_header:
        # No Range requested — return full file with Accept-Ranges hint
        def generate_full():
            with open(filepath, "rb") as f:
                while True:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    yield chunk

        return Response(
            generate_full(),
            status=200,
            mimetype=mime,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            },
        )

    # Parse Range header: bytes=START-END or bytes=START-
    match = re.match(r"bytes=(\d+)-(\d*)", range_header)
    if not match:
        abort(416)  # Range Not Satisfiable

    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) else file_size - 1

    # Clamp to valid range
    if start >= file_size:
        abort(416)
    end = min(end, file_size - 1)
    length = end - start + 1

    def generate_range():
        with open(filepath, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                read_size = min(CHUNK_SIZE, remaining)
                chunk = f.read(read_size)
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    return Response(
        generate_range(),
        status=206,
        mimetype=mime,
        headers={
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
        },
    )


@stream_bp.route("/thumbnail/<media_id>")
def serve_thumbnail(media_id):
    from backend.services.thumbnail import generate_thumbnail

    item = get_item(media_id)
    if not item:
        abort(404)

    # Check cache first
    thumb_path = os.path.join(THUMBNAIL_DIR, f"{media_id}.jpg")
    if os.path.isfile(thumb_path):
        return send_file(thumb_path, mimetype="image/jpeg")

    # Try to generate on-the-fly (video only)
    result = generate_thumbnail(media_id, item["absolute_path"], item["type"])
    if result and os.path.isfile(result):
        return send_file(result, mimetype="image/jpeg")

    # No thumbnail available — return a 204 so the frontend uses a placeholder
    return Response(status=204)
