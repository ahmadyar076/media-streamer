import json
import os
import shutil
import subprocess

# Cache: {absolute_path: metadata_dict}
_cache = {}


def _ffprobe_available():
    return shutil.which("ffprobe") is not None


def _extract_with_ffprobe(filepath):
    """Use ffprobe to extract duration, resolution, codec, and bitrate."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                filepath,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return None

        data = json.loads(result.stdout)
        fmt = data.get("format", {})
        streams = data.get("streams", [])

        meta = {
            "duration": float(fmt.get("duration", 0)) or None,
            "bitrate": int(fmt.get("bit_rate", 0)) or None,
            "codec": None,
            "width": None,
            "height": None,
        }

        # Find the first video stream for resolution, or first audio stream for codec
        for stream in streams:
            codec_type = stream.get("codec_type")
            if codec_type == "video" and not meta["width"]:
                meta["width"] = stream.get("width")
                meta["height"] = stream.get("height")
                meta["codec"] = stream.get("codec_name")
            elif codec_type == "audio" and not meta["codec"]:
                meta["codec"] = stream.get("codec_name")
                if not meta["duration"]:
                    meta["duration"] = float(stream.get("duration", 0)) or None

        return meta
    except Exception:
        return None


def _extract_with_mutagen(filepath):
    """Fallback: use mutagen for audio files to get duration."""
    try:
        from mutagen import File as MutagenFile
        audio = MutagenFile(filepath)
        if audio is None:
            return None
        return {
            "duration": audio.info.length if hasattr(audio.info, "length") else None,
            "bitrate": getattr(audio.info, "bitrate", None),
            "codec": type(audio).__name__.lower(),
            "width": None,
            "height": None,
        }
    except Exception:
        return None


def extract_metadata(filepath):
    """
    Extract metadata for a media file. Uses ffprobe if available,
    falls back to mutagen for audio files. Returns a dict with:
    duration, bitrate, codec, width, height (any may be None).
    """
    if filepath in _cache:
        return _cache[filepath]

    meta = None

    if _ffprobe_available():
        meta = _extract_with_ffprobe(filepath)

    # Fallback for audio files
    if meta is None:
        ext = os.path.splitext(filepath)[1].lower()
        if ext in {".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a", ".opus"}:
            meta = _extract_with_mutagen(filepath)

    if meta is None:
        meta = {
            "duration": None,
            "bitrate": None,
            "codec": None,
            "width": None,
            "height": None,
        }

    _cache[filepath] = meta
    return meta


def clear_cache():
    """Clear the metadata cache."""
    _cache.clear()
