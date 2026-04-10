# StreamBox — Dynamic Media Streaming App

A self-hosted media streaming web app with a modern dark-themed UI. Stream video and audio files from your local machine through a clean, responsive browser interface.

## Features

- **Media Library** — Browse all your video and audio files in a responsive grid with search and type filters
- **Byte-Range Streaming** — Full seeking support for video/audio via HTTP 206 Partial Content responses
- **Custom Player** — Play/pause, progress bar (click-to-seek), volume control, keyboard shortcuts
- **Metadata Extraction** — Duration, bitrate, codec info via mutagen (audio) and ffprobe (video, optional)
- **Thumbnail Generation** — Auto-generated video thumbnails via ffmpeg (optional)
- **Dark Theme** — Fully themed UI with CSS custom properties
- **Responsive Layout** — Sidebar collapses on tablet, hides on mobile

## Tech Stack

| Layer    | Technology              |
|----------|------------------------|
| Frontend | HTML, CSS, Vanilla JS (ES Modules) |
| Backend  | Python, Flask           |
| Metadata | mutagen, ffprobe (optional) |
| Thumbnails | ffmpeg (optional)    |

## Quick Start

### Prerequisites

- Python 3.10+
- (Optional) [ffmpeg](https://ffmpeg.org/) for video thumbnails and full metadata

### Setup

```bash
# Clone the repo
git clone https://github.com/ahmadyar076/media-streamer.git
cd media-streamer

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

### Add Media

Drop your media files into the `media/` directory:

```
media/
├── video/    ← .mp4, .mkv, .webm, .avi, .mov
├── audio/    ← .mp3, .flac, .wav, .ogg, .aac, .m4a
└── thumbnails/  (auto-generated)
```

Click the refresh button in the app or hit `POST /api/refresh` to re-scan.

## Keyboard Shortcuts (Player)

| Key          | Action          |
|--------------|-----------------|
| `Space`      | Play / Pause    |
| `←` / `→`   | Seek -/+ 10s    |
| `↑` / `↓`   | Volume up/down  |
| `M`          | Mute toggle     |
| `F`          | Fullscreen      |

## API Endpoints

| Endpoint              | Method | Description                        |
|-----------------------|--------|------------------------------------|
| `/api/media`          | GET    | List all media (supports `?type=` and `?q=`) |
| `/api/media/<id>`     | GET    | Single item details                |
| `/api/refresh`        | POST   | Re-scan media directory            |
| `/stream/<id>`        | GET    | Stream media file (byte-range)     |
| `/thumbnail/<id>`     | GET    | Serve or generate thumbnail        |

## Project Structure

```
├── app.py                  # Flask entry point
├── config.py               # Configuration constants
├── requirements.txt        # Python dependencies
├── backend/
│   ├── routes/
│   │   ├── pages.py        # HTML page routes
│   │   ├── api.py          # JSON REST API
│   │   └── stream.py       # Byte-range streaming
│   ├── services/
│   │   ├── scanner.py      # Media directory scanner
│   │   ├── metadata.py     # Metadata extraction
│   │   └── thumbnail.py    # Thumbnail generation
│   └── utils/
│       └── mime.py         # MIME type detection
├── static/
│   ├── css/style.css       # Dark theme styles
│   └── js/                 # ES module scripts
│       ├── app.js          # Page router
│       ├── api.js          # API client
│       ├── library.js      # Library grid UI
│       ├── player.js       # Player controls
│       ├── home.js         # Home page
│       └── utils.js        # Helpers
├── templates/              # Jinja2 HTML templates
│   ├── index.html
│   ├── library.html
│   └── player.html
└── media/                  # Your media files (gitignored)
```

## License

MIT
