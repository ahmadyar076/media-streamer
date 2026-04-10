import mimetypes

# Fallbacks for types that mimetypes.guess_type() often misses
_FALLBACK = {
    ".mkv":  "video/x-matroska",
    ".flac": "audio/flac",
    ".m4a":  "audio/mp4",
    ".webm": "video/webm",
    ".ogg":  "audio/ogg",
    ".opus": "audio/opus",
    ".aac":  "audio/aac",
    ".avi":  "video/x-msvideo",
    ".mov":  "video/quicktime",
    ".mp4":  "video/mp4",
    ".mp3":  "audio/mpeg",
    ".wav":  "audio/wav",
}


def guess_mime(filepath):
    """Return the MIME type for a media file path."""
    import os
    ext = os.path.splitext(filepath)[1].lower()
    if ext in _FALLBACK:
        return _FALLBACK[ext]
    mime, _ = mimetypes.guess_type(filepath)
    return mime or "application/octet-stream"
