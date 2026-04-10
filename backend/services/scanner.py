import os
import hashlib
from config import MEDIA_ROOT, ALLOWED_VIDEO, ALLOWED_AUDIO, ALLOWED_EXTENSIONS
from backend.services.metadata import extract_metadata, clear_cache as clear_meta_cache
from backend.services.thumbnail import generate_thumbnail

# In-memory catalog: {media_id: {…}}
_catalog = {}


def _make_id(relative_path):
    """Generate a stable short ID from the relative file path."""
    return hashlib.sha256(relative_path.encode("utf-8")).hexdigest()[:12]


def scan_media(root=None):
    """Walk the media directory and rebuild the catalog."""
    global _catalog
    root = root or MEDIA_ROOT
    new_catalog = {}

    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                continue

            abs_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(abs_path, root)
            media_id = _make_id(rel_path)

            media_type = "video" if ext in ALLOWED_VIDEO else "audio"
            stat = os.stat(abs_path)

            # Extract metadata (duration, codec, resolution)
            meta = extract_metadata(abs_path)

            # Try to generate thumbnail for videos
            thumb = generate_thumbnail(media_id, abs_path, media_type)

            new_catalog[media_id] = {
                "id": media_id,
                "filename": fname,
                "title": os.path.splitext(fname)[0],
                "type": media_type,
                "extension": ext,
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "relative_path": rel_path,
                "absolute_path": abs_path,
                "duration": meta.get("duration"),
                "bitrate": meta.get("bitrate"),
                "codec": meta.get("codec"),
                "width": meta.get("width"),
                "height": meta.get("height"),
                "has_thumbnail": thumb is not None,
            }

    clear_meta_cache()
    _catalog = new_catalog
    return _catalog


def get_catalog():
    """Return the full catalog dict."""
    return _catalog


def get_item(media_id):
    """Look up a single item by ID. Returns None if not found."""
    return _catalog.get(media_id)


def get_catalog_list(media_type=None, query=None):
    """Return the catalog as a sorted list, optionally filtered."""
    items = list(_catalog.values())

    if media_type and media_type in ("video", "audio"):
        items = [i for i in items if i["type"] == media_type]

    if query:
        q = query.lower()
        items = [i for i in items if q in i["title"].lower()]

    # Most recently modified first
    items.sort(key=lambda i: i["modified"], reverse=True)
    return items
