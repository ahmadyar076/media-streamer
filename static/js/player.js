import { fetchMediaById } from "./api.js";
import { formatTime, formatSize, $ } from "./utils.js";

let mediaEl = null; // <video> or <audio> element

function createMediaElement(item) {
    const stage = $(".player-stage");
    if (!stage) return;

    // Clear placeholder
    stage.innerHTML = "";

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

    bindMediaEvents(item);
}

function bindMediaEvents(item) {
    if (!mediaEl) return;

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

    // Set initial volume
    if (volumeSlider) {
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
    });

    // Time updates
    mediaEl.addEventListener("loadedmetadata", () => {
        if (timeTotal) timeTotal.textContent = formatTime(mediaEl.duration);
    });

    mediaEl.addEventListener("timeupdate", () => {
        if (timeCurrent) timeCurrent.textContent = formatTime(mediaEl.currentTime);
        if (progressFill && mediaEl.duration) {
            const pct = (mediaEl.currentTime / mediaEl.duration) * 100;
            progressFill.style.width = `${pct}%`;
        }
    });

    // Click-to-seek on progress bar
    if (progressBar) {
        progressBar.addEventListener("click", (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (mediaEl.duration) {
                mediaEl.currentTime = pct * mediaEl.duration;
            }
        });
    }

    // Volume
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            mediaEl.volume = e.target.value / 100;
        });
    }

    // Mute toggle
    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            mediaEl.muted = !mediaEl.muted;
        });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Don't hijack when typing in inputs
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
                mediaEl.currentTime = Math.min(mediaEl.duration, mediaEl.currentTime + 10);
                break;
            case "ArrowUp":
                e.preventDefault();
                mediaEl.volume = Math.min(1, mediaEl.volume + 0.05);
                if (volumeSlider) volumeSlider.value = Math.round(mediaEl.volume * 100);
                break;
            case "ArrowDown":
                e.preventDefault();
                mediaEl.volume = Math.max(0, mediaEl.volume - 0.05);
                if (volumeSlider) volumeSlider.value = Math.round(mediaEl.volume * 100);
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

    // Build type string with codec and resolution
    let typeStr = item.type.charAt(0).toUpperCase() + item.type.slice(1) + ` (${item.extension})`;
    if (item.codec) typeStr += ` — ${item.codec}`;
    if (item.width && item.height) typeStr += ` ${item.width}x${item.height}`;
    if (type) type.textContent = typeStr;

    if (size) size.textContent = formatSize(item.size);

    if (duration) {
        duration.textContent = item.duration ? formatTime(item.duration) : "--";
    }
}

export async function initPlayer(mediaId) {
    try {
        const item = await fetchMediaById(mediaId);
        createMediaElement(item);
        updateDetails(item);
    } catch (err) {
        console.error("[StreamBox] Failed to load media:", err);
        const stage = $(".player-stage");
        if (stage) {
            stage.innerHTML = `<div class="stage-placeholder"><h3>Media not found</h3><p>${err.message}</p></div>`;
        }
    }
}
