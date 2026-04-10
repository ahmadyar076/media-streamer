import { fetchMediaById } from "./api.js";
import { formatTime, formatSize, $, toast, savePosition, getPosition, addRecentlyPlayed } from "./utils.js";

let mediaEl = null;
let currentItem = null;
let saveInterval = null;
let audioCtx = null;
let analyser = null;
let animFrameId = null;

function createMediaElement(item) {
    const stage = $(".player-stage");
    if (!stage) return;

    stage.innerHTML = `<div class="buffering-spinner"></div>`;

    if (item.type === "video") {
        mediaEl = document.createElement("video");
        // Hide audio visualizer for video
        const viz = $("#audioVisualizer");
        if (viz) viz.style.display = "none";
    } else {
        mediaEl = document.createElement("audio");
        mediaEl.style.width = "100%";
        // Show audio visualizer
        const viz = $("#audioVisualizer");
        if (viz) viz.style.display = "block";
        // Make stage smaller for audio
        stage.style.aspectRatio = "auto";
        stage.style.height = "80px";
        stage.style.background = "var(--bg-card)";
        stage.style.borderRadius = "var(--radius-md)";
    }

    mediaEl.src = item.stream_url;
    mediaEl.preload = "metadata";
    mediaEl.controls = false;
    mediaEl.crossOrigin = "anonymous";
    stage.appendChild(mediaEl);

    currentItem = item;
    bindMediaEvents(item);

    // Setup audio visualizer for audio files
    if (item.type === "audio") {
        setupVisualizer();
    }
}

function setupVisualizer() {
    const canvas = $("#visualizerCanvas");
    if (!canvas || !mediaEl) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;

        const source = audioCtx.createMediaElementSource(mediaEl);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const ctx = canvas.getContext("2d");

        function draw() {
            animFrameId = requestAnimationFrame(draw);

            const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.clearRect(0, 0, w, h);

            analyser.getByteFrequencyData(dataArray);

            const barWidth = w / bufferLength;
            const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
            const purple = getComputedStyle(document.documentElement).getPropertyValue("--purple").trim();

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * h * 0.9;
                const x = i * barWidth;

                const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
                gradient.addColorStop(0, accent);
                gradient.addColorStop(1, purple);

                ctx.fillStyle = gradient;
                ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
            }
        }

        draw();
    } catch (e) {
        console.warn("[StreamBox] Audio visualizer not supported:", e);
    }
}

function bindMediaEvents(item) {
    if (!mediaEl) return;

    const stage = $(".player-stage");
    const playBtn = $("#playBtn");
    const iconPlay = playBtn ? $(".icon-play", playBtn) : null;
    const iconPause = playBtn ? $(".icon-pause", playBtn) : null;
    const progressBar = $("#progressBar");
    const progressFill = $("#progressFill");
    const progressBuffer = $("#progressBuffer");
    const timeCurrent = $(".time-current");
    const timeTotal = $(".time-total");
    const volumeSlider = $("#volumeSlider");
    const muteBtn = $("#muteBtn");

    // Update track info
    const trackTitle = $(".player-bar .track-title");
    const trackArtist = $(".player-bar .track-artist");
    if (trackTitle) trackTitle.textContent = item.title;
    if (trackArtist) trackArtist.textContent = item.type.charAt(0).toUpperCase() + item.type.slice(1);

    // Sidebar now playing
    const npSection = $("#sidebarNP");
    const npTitle = $("#npTitle");
    if (npSection) npSection.style.display = "block";
    if (npTitle) npTitle.textContent = item.title;

    // Restore volume
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
            if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
            mediaEl.paused ? mediaEl.play() : mediaEl.pause();
        });
    }

    mediaEl.addEventListener("play", () => {
        if (iconPlay) iconPlay.style.display = "none";
        if (iconPause) iconPause.style.display = "block";
    });

    mediaEl.addEventListener("pause", () => {
        if (iconPlay) iconPlay.style.display = "block";
        if (iconPause) iconPause.style.display = "none";
        if (currentItem && mediaEl.currentTime > 2) {
            savePosition(currentItem.id, mediaEl.currentTime);
        }
    });

    // Buffering
    mediaEl.addEventListener("waiting", () => { if (stage) stage.classList.add("buffering"); });
    mediaEl.addEventListener("canplay", () => { if (stage) stage.classList.remove("buffering"); });
    mediaEl.addEventListener("playing", () => { if (stage) stage.classList.remove("buffering"); });

    // Time
    mediaEl.addEventListener("loadedmetadata", () => {
        if (timeTotal) timeTotal.textContent = formatTime(mediaEl.duration);
        const savedTime = getPosition(item.id);
        if (savedTime > 2 && savedTime < mediaEl.duration - 5) {
            mediaEl.currentTime = savedTime;
            toast(`Resuming from ${formatTime(savedTime)}`, "info");
        }
    });

    mediaEl.addEventListener("timeupdate", () => {
        if (timeCurrent) timeCurrent.textContent = formatTime(mediaEl.currentTime);
        if (progressFill && mediaEl.duration) {
            progressFill.style.width = `${(mediaEl.currentTime / mediaEl.duration) * 100}%`;
        }
    });

    // Buffer progress
    mediaEl.addEventListener("progress", () => {
        if (progressBuffer && mediaEl.buffered.length > 0 && mediaEl.duration) {
            const bufferedEnd = mediaEl.buffered.end(mediaEl.buffered.length - 1);
            progressBuffer.style.width = `${(bufferedEnd / mediaEl.duration) * 100}%`;
        }
    });

    // Ended
    mediaEl.addEventListener("ended", () => {
        if (iconPlay) iconPlay.style.display = "block";
        if (iconPause) iconPause.style.display = "none";
        if (currentItem) savePosition(currentItem.id, 0);
    });

    // Error
    mediaEl.addEventListener("error", () => {
        const err = mediaEl.error;
        let msg = "Playback error";
        if (err) {
            switch (err.code) {
                case 1: msg = "Playback aborted"; break;
                case 2: msg = "Network error"; break;
                case 3: msg = "Decoding failed — format may not be supported"; break;
                case 4: msg = "Format not supported by this browser"; break;
            }
        }
        toast(msg, "error");
        if (stage) {
            stage.classList.remove("buffering");
            stage.innerHTML = `<div class="stage-placeholder"><svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><p>${msg}</p></div>`;
        }
    });

    // Progress bar seek (drag)
    if (progressBar) {
        let isDragging = false;
        const seek = (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (mediaEl.duration) mediaEl.currentTime = pct * mediaEl.duration;
        };
        progressBar.addEventListener("mousedown", (e) => { isDragging = true; seek(e); });
        document.addEventListener("mousemove", (e) => { if (isDragging) seek(e); });
        document.addEventListener("mouseup", () => { isDragging = false; });
    }

    // Volume
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            mediaEl.volume = e.target.value / 100;
            localStorage.setItem("streambox_volume", mediaEl.volume);
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", () => { mediaEl.muted = !mediaEl.muted; });
    }

    // Periodic save
    saveInterval = setInterval(() => {
        if (currentItem && mediaEl && !mediaEl.paused && mediaEl.currentTime > 2) {
            savePosition(currentItem.id, mediaEl.currentTime);
        }
    }, 5000);

    // Speed control
    initSpeedControl();

    // Picture-in-Picture
    initPiP();

    // Keyboard
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        switch (e.code) {
            case "Space":
                e.preventDefault();
                if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
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
            case "BracketRight": // ] = speed up
                cycleSpeed(1);
                break;
            case "BracketLeft": // [ = speed down
                cycleSpeed(-1);
                break;
            case "KeyP":
                if (e.shiftKey) togglePiP();
                break;
        }
    });
}

// ========== SPEED CONTROL ==========
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
let currentSpeedIdx = 2; // 1x

function initSpeedControl() {
    const container = $(".speed-control");
    if (!container || !mediaEl) return;

    const btn = $(".speed-btn", container);
    const menu = $(".speed-menu", container);
    if (!btn || !menu) return;

    btn.addEventListener("click", () => menu.classList.toggle("open"));

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) menu.classList.remove("open");
    });

    // Render options
    menu.innerHTML = SPEEDS.map((s, i) => `
        <button class="speed-option${i === currentSpeedIdx ? " active" : ""}" data-idx="${i}">${s}x</button>
    `).join("");

    menu.querySelectorAll(".speed-option").forEach(opt => {
        opt.addEventListener("click", () => {
            currentSpeedIdx = parseInt(opt.dataset.idx);
            setSpeed(SPEEDS[currentSpeedIdx]);
            menu.classList.remove("open");
            // Update active state
            menu.querySelectorAll(".speed-option").forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
        });
    });
}

function setSpeed(speed) {
    if (!mediaEl) return;
    mediaEl.playbackRate = speed;
    const btn = $(".speed-btn");
    if (btn) {
        btn.textContent = `${speed}x`;
        btn.classList.toggle("highlight", speed !== 1);
    }
}

function cycleSpeed(dir) {
    currentSpeedIdx = Math.max(0, Math.min(SPEEDS.length - 1, currentSpeedIdx + dir));
    setSpeed(SPEEDS[currentSpeedIdx]);
    toast(`Speed: ${SPEEDS[currentSpeedIdx]}x`, "info");
    // Update menu if open
    const menu = $(".speed-menu");
    if (menu) {
        menu.querySelectorAll(".speed-option").forEach((o, i) => {
            o.classList.toggle("active", i === currentSpeedIdx);
        });
    }
}

// ========== PICTURE-IN-PICTURE ==========
function initPiP() {
    const pipBtn = $(".pip-btn");
    if (!pipBtn || !mediaEl) return;
    if (!document.pictureInPictureEnabled || mediaEl.tagName !== "VIDEO") {
        pipBtn.style.display = "none";
        return;
    }
    pipBtn.addEventListener("click", togglePiP);
}

async function togglePiP() {
    if (!mediaEl || mediaEl.tagName !== "VIDEO") return;
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await mediaEl.requestPictureInPicture();
        }
    } catch (e) {
        toast("PiP not available", "error");
    }
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
        document.title = `${item.title} — StreamBox`;
        addRecentlyPlayed(mediaId);
        createMediaElement(item);
        updateDetails(item);
    } catch (err) {
        console.error("[StreamBox] Failed to load media:", err);
        toast("Failed to load media", "error");
        const stage = $(".player-stage");
        if (stage) {
            stage.innerHTML = `<div class="stage-placeholder"><svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><p>Media not found</p></div>`;
        }
    }
}
