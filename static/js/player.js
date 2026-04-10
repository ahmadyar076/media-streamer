import { fetchMediaById } from "./api.js";
import { formatTime, formatSize, $, toast, savePosition, getPosition } from "./utils.js";

let mediaEl = null;
let currentItem = null;
let saveInterval = null;

function createMediaElement(item) {
    const stage = $(".player-stage");
    if (!stage) return;

    stage.innerHTML = `<div class="buffering-spinner"></div>`;

    if (item.type === "video") {
        mediaEl = document.createElement("video");
    } else {
        mediaEl = document.createElement("audio");
        mediaEl.style.width = "100%";
    }

    mediaEl.src = item.stream_url;
    mediaEl.preload = "metadata";
    mediaEl.controls = false;
    stage.appendChild(mediaEl);

    currentItem = item;
    bindMediaEvents(item);
}

function bindMediaEvents(item) {
    if (!mediaEl) return;

    const stage = $(".player-stage");
    const playBtn = $("#playBtn");
    const iconPlay = playBtn ? $(".icon-play", playBtn) : null;
    const iconPause = playBtn ? $(".icon-pause", playBtn) : null;
    const progressBar = $("#progressBar");
    const progressFill = $("#progressFill");
    const timeCurrent = $(".time-current");
    const timeTotal = $(".time-total");
    const volumeSlider = $("#volumeSlider");
    const muteBtn = $("#muteBtn");

    // Update track info in the bottom bar
    const trackTitle = $(".player-bar .track-title");
    const trackArtist = $(".player-bar .track-artist");
    if (trackTitle) trackTitle.textContent = item.title;
    if (trackArtist) trackArtist.textContent = item.type.charAt(0).toUpperCase() + item.type.slice(1);

    // Restore volume from localStorage
    const savedVolume = localStorage.getItem("streambox_volume");
    if (savedVolume !== null) {
        mediaEl.volume = parseFloat(savedVolume);
        if (volumeSlider) volumeSlider.value = Math.round(mediaEl.volume * 100);
    } else if (volumeSlider) {
        mediaEl.volume = volumeSlider.value / 100;
    }

    // Play / Pause
    if (playBtn) {
        playBtn.addEventListener("click", () => {
            if (mediaEl.paused) {
                mediaEl.play();
            } else {
                mediaEl.pause();
            }
        });
    }

    mediaEl.addEventListener("play", () => {
        if (iconPlay) iconPlay.style.display = "none";
        if (iconPause) iconPause.style.display = "block";
    });

    mediaEl.addEventListener("pause", () => {
        if (iconPlay) iconPlay.style.display = "block";
        if (iconPause) iconPause.style.display = "none";
        // Save position on pause
        if (currentItem && mediaEl.currentTime > 2) {
            savePosition(currentItem.id, mediaEl.currentTime);
        }
    });

    // Buffering states
    mediaEl.addEventListener("waiting", () => {
        if (stage) stage.classList.add("buffering");
    });

    mediaEl.addEventListener("canplay", () => {
        if (stage) stage.classList.remove("buffering");
    });

    mediaEl.addEventListener("playing", () => {
        if (stage) stage.classList.remove("buffering");
    });

    // Time updates
    mediaEl.addEventListener("loadedmetadata", () => {
        if (timeTotal) timeTotal.textContent = formatTime(mediaEl.duration);

        // Resume from saved position
        const savedTime = getPosition(item.id);
        if (savedTime > 2 && savedTime < mediaEl.duration - 5) {
            mediaEl.currentTime = savedTime;
            toast(`Resuming from ${formatTime(savedTime)}`, "info");
        }
    });

    mediaEl.addEventListener("timeupdate", () => {
        if (timeCurrent) timeCurrent.textContent = formatTime(mediaEl.currentTime);
        if (progressFill && mediaEl.duration) {
            const pct = (mediaEl.currentTime / mediaEl.duration) * 100;
            progressFill.style.width = `${pct}%`;
        }
    });

    // Ended
    mediaEl.addEventListener("ended", () => {
        if (iconPlay) iconPlay.style.display = "block";
        if (iconPause) iconPause.style.display = "none";
        // Clear saved position on completion
        if (currentItem) {
            savePosition(currentItem.id, 0);
        }
    });

    // Error handling
    mediaEl.addEventListener("error", () => {
        const err = mediaEl.error;
        let msg = "Playback error";
        if (err) {
            switch (err.code) {
                case 1: msg = "Playback aborted"; break;
                case 2: msg = "Network error during playback"; break;
                case 3: msg = "Media decoding failed — format may not be supported"; break;
                case 4: msg = "Media format not supported by this browser"; break;
            }
        }
        toast(msg, "error");
        if (stage) {
            stage.classList.remove("buffering");
            stage.innerHTML = `
                <div class="stage-placeholder">
                    <svg viewBox="0 0 24 24" width="64" height="64"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    <p>${msg}</p>
                </div>
            `;
        }
    });

    // Click-to-seek on progress bar
    if (progressBar) {
        let isDragging = false;

        const seek = (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (mediaEl.duration) {
                mediaEl.currentTime = pct * mediaEl.duration;
            }
        };

        progressBar.addEventListener("mousedown", (e) => {
            isDragging = true;
            seek(e);
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) seek(e);
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }

    // Volume
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            mediaEl.volume = e.target.value / 100;
            localStorage.setItem("streambox_volume", mediaEl.volume);
        });
    }

    // Mute toggle
    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            mediaEl.muted = !mediaEl.muted;
        });
    }

    // Periodic position save (every 5 seconds during playback)
    saveInterval = setInterval(() => {
        if (currentItem && mediaEl && !mediaEl.paused && mediaEl.currentTime > 2) {
            savePosition(currentItem.id, mediaEl.currentTime);
        }
    }, 5000);

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        switch (e.code) {
            case "Space":
                e.preventDefault();
                mediaEl.paused ? mediaEl.play() : mediaEl.pause();
                break;
            case "ArrowLeft":
                e.preventDefault();
                mediaEl.currentTime = Math.max(0, mediaEl.currentTime - 10);
                break;
            case "ArrowRight":
                e.preventDefault();
                mediaEl.currentTime = Math.min(mediaEl.duration || 0, mediaEl.currentTime + 10);
                break;
            case "ArrowUp":
                e.preventDefault();
                mediaEl.volume = Math.min(1, mediaEl.volume + 0.05);
                if (volumeSlider) volumeSlider.value = Math.round(mediaEl.volume * 100);
                localStorage.setItem("streambox_volume", mediaEl.volume);
                break;
            case "ArrowDown":
                e.preventDefault();
                mediaEl.volume = Math.max(0, mediaEl.volume - 0.05);
                if (volumeSlider) volumeSlider.value = Math.round(mediaEl.volume * 100);
                localStorage.setItem("streambox_volume", mediaEl.volume);
                break;
            case "KeyM":
                mediaEl.muted = !mediaEl.muted;
                break;
            case "KeyF":
                if (mediaEl.requestFullscreen) mediaEl.requestFullscreen();
                break;
        }
    });
}

function updateDetails(item) {
    const title = $(".detail-title");
    const type = $(".detail-type");
    const size = $(".detail-size");
    const duration = $(".detail-duration");

    if (title) title.textContent = item.title;

    let typeStr = item.type.charAt(0).toUpperCase() + item.type.slice(1) + ` (${item.extension})`;
    if (item.codec) typeStr += ` — ${item.codec}`;
    if (item.width && item.height) typeStr += ` ${item.width}x${item.height}`;
    if (type) type.textContent = typeStr;

    if (size) size.textContent = formatSize(item.size);
    if (duration) duration.textContent = item.duration ? formatTime(item.duration) : "--";
}

export async function initPlayer(mediaId) {
    try {
        const item = await fetchMediaById(mediaId);
        createMediaElement(item);
        updateDetails(item);
    } catch (err) {
        console.error("[StreamBox] Failed to load media:", err);
        toast("Failed to load media", "error");
        const stage = $(".player-stage");
        if (stage) {
            stage.innerHTML = `
                <div class="stage-placeholder">
                    <svg viewBox="0 0 24 24" width="64" height="64"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    <p>Media not found</p>
                </div>
            `;
        }
    }
}
