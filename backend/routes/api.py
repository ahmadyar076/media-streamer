from flask import Blueprint, jsonify, request
from backend.services.scanner import get_catalog_list, get_item, scan_media

api_bp = Blueprint("api", __name__)


def _serialize(item):
    """Return a JSON-safe representation (no absolute paths exposed)."""
    return {
        "id": item["id"],
        "title": item["title"],
        "type": item["type"],
        "extension": item["extension"],
        "size": item["size"],
        "modified": item["modified"],
        "duration": item.get("duration"),
        "bitrate": item.get("bitrate"),
        "codec": item.get("codec"),
        "width": item.get("width"),
        "height": item.get("height"),
        "has_thumbnail": item.get("has_thumbnail", False),
        "stream_url": f"/stream/{item['id']}",
        "thumbnail_url": f"/thumbnail/{item['id']}",
    }


@api_bp.route("/media")
def list_media():
    media_type = request.args.get("type")
    query = request.args.get("q")
    items = get_catalog_list(media_type=media_type, query=query)
    return jsonify([_serialize(i) for i in items])


@api_bp.route("/media/<media_id>")
def get_media(media_id):
    item = get_item(media_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_serialize(item))


@api_bp.route("/refresh", methods=["POST"])
def refresh():
    catalog = scan_media()
    return jsonify({"count": len(catalog)})
