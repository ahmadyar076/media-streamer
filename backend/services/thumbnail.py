import os
import shutil
import subprocess
from config import THUMBNAIL_DIR


def _ffmpeg_available():
    return shutil.which("ffmpeg") is not None


def generate_thumbnail(media_id, filepath, media_type):
    """
    Generate a JPEG thumbnail for a video file using ffmpeg.
    Returns the thumbnail path if successful, or None.
    Audio files always return None (use a placeholder in the frontend).
    """
    if media_type != "video":
        return None

    thumb_path = os.path.join(THUMBNAIL_DIR, f"{media_id}.jpg")

    # Return cached thumbnail if it exists
    if os.path.isfile(thumb_path):
        return thumb_path

    if not _ffmpeg_available():
        return None

    try:
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg",
                "-i", filepath,
                "-ss", "00:00:03",       # Capture at 3 seconds
                "-vframes", "1",          # Single frame
                "-vf", "scale=320:-1",    # 320px wide, maintain aspect ratio
                "-q:v", "5",              # JPEG quality
                "-y",                     # Overwrite
                thumb_path,
            ],
            capture_output=True,
            timeout=15,
        )
        if os.path.isfile(thumb_path) and os.path.getsize(thumb_path) > 0:
            return thumb_path
        return None
    except Exception:
        # Clean up partial file
        if os.path.isfile(thumb_path):
            os.remove(thumb_path)
        return None


def get_thumbnail_path(media_id):
    """Check if a cached thumbnail exists. Returns path or None."""
    thumb_path = os.path.join(THUMBNAIL_DIR, f"{media_id}.jpg")
    if os.path.isfile(thumb_path):
        return thumb_path
    return None
