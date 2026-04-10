/**
 * Format seconds into m:ss or h:mm:ss
 */
export function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Format bytes into human-readable size
 */
export function formatSize(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Debounce a function call
 */
export function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Shorthand for querySelector
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Shorthand for querySelectorAll
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Show a toast notification
 */
export function toast(message, type = "info") {
    let container = $(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const icons = {
        success: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
        error: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
        info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    };

    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => el.remove(), 3000);
}

/**
 * Save playback position to localStorage
 */
export function savePosition(mediaId, time) {
    const data = JSON.parse(localStorage.getItem("streambox_positions") || "{}");
    data[mediaId] = { time, saved: Date.now() };
    localStorage.setItem("streambox_positions", JSON.stringify(data));
}

/**
 * Get saved playback position from localStorage
 */
export function getPosition(mediaId) {
    const data = JSON.parse(localStorage.getItem("streambox_positions") || "{}");
    const entry = data[mediaId];
    if (!entry) return 0;
    // Expire after 30 days
    if (Date.now() - entry.saved > 30 * 24 * 60 * 60 * 1000) {
        delete data[mediaId];
        localStorage.setItem("streambox_positions", JSON.stringify(data));
        return 0;
    }
    return entry.time || 0;
}

/**
 * Check if a media item has a saved position
 */
export function hasPosition(mediaId) {
    return getPosition(mediaId) > 2; // Only show if more than 2 seconds in
}
