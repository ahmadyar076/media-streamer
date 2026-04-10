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
    return getPosition(mediaId) > 2;
}

// ========== FAVORITES ==========

export function getFavorites() {
    return JSON.parse(localStorage.getItem("streambox_favorites") || "[]");
}

export function isFavorite(mediaId) {
    return getFavorites().includes(mediaId);
}

export function toggleFavorite(mediaId) {
    const favs = getFavorites();
    const idx = favs.indexOf(mediaId);
    if (idx === -1) {
        favs.push(mediaId);
    } else {
        favs.splice(idx, 1);
    }
    localStorage.setItem("streambox_favorites", JSON.stringify(favs));
    return idx === -1; // returns true if added
}

// ========== RECENTLY PLAYED ==========

export function addRecentlyPlayed(mediaId) {
    let list = JSON.parse(localStorage.getItem("streambox_recent") || "[]");
    list = list.filter(id => id !== mediaId);
    list.unshift(mediaId);
    if (list.length > 20) list = list.slice(0, 20);
    localStorage.setItem("streambox_recent", JSON.stringify(list));
}

export function getRecentlyPlayed() {
    return JSON.parse(localStorage.getItem("streambox_recent") || "[]");
}

// ========== THEME ==========

const THEMES = {
    red:    { accent: "#e94560", hover: "#ff6b81", glow: "rgba(233,69,96,0.2)",  soft: "rgba(233,69,96,0.08)" },
    purple: { accent: "#7c6cf0", hover: "#9d8ff5", glow: "rgba(124,108,240,0.2)", soft: "rgba(124,108,240,0.08)" },
    teal:   { accent: "#00d4c8", hover: "#33e0d6", glow: "rgba(0,212,200,0.2)",   soft: "rgba(0,212,200,0.08)" },
    blue:   { accent: "#4a9eff", hover: "#6eb4ff", glow: "rgba(74,158,255,0.2)",  soft: "rgba(74,158,255,0.08)" },
    green:  { accent: "#4cd964", hover: "#6ee380", glow: "rgba(76,217,100,0.2)",  soft: "rgba(76,217,100,0.08)" },
    amber:  { accent: "#f0a030", hover: "#f5b85a", glow: "rgba(240,160,48,0.2)",  soft: "rgba(240,160,48,0.08)" },
};

export function getThemeNames() { return Object.keys(THEMES); }

export function getCurrentTheme() {
    return localStorage.getItem("streambox_theme") || "red";
}

export function applyTheme(name) {
    const theme = THEMES[name];
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-hover", theme.hover);
    root.style.setProperty("--accent-glow", theme.glow);
    root.style.setProperty("--accent-soft", theme.soft);
    localStorage.setItem("streambox_theme", name);
}

export function initTheme() {
    applyTheme(getCurrentTheme());
}
