import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MEDIA_ROOT = os.environ.get("MEDIA_ROOT", os.path.join(BASE_DIR, "media"))
THUMBNAIL_DIR = os.path.join(MEDIA_ROOT, "thumbnails")
CHUNK_SIZE = 1024 * 1024  # 1 MB per streaming chunk

ALLOWED_VIDEO = {".mp4", ".mkv", ".webm", ".avi", ".mov"}
ALLOWED_AUDIO = {".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"}
ALLOWED_EXTENSIONS = ALLOWED_VIDEO | ALLOWED_AUDIO
