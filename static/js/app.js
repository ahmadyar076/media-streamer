// StreamBox — Entry Point
import { initTheme, applyTheme, getThemeNames, getCurrentTheme, $ } from "./utils.js";

const page = document.body.dataset.page || "home";

// Apply saved theme immediately
initTheme();

// === Mobile sidebar toggle ===
function initMobileMenu() {
    const hamburger = document.querySelector(".hamburger-btn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!hamburger || !sidebar) return;

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("active");
    });

    if (overlay) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
        });
    }
}

// === Keyboard shortcuts modal ===
function initShortcutsModal() {
    const modal = document.getElementById("shortcutsModal");
    if (!modal) return;
    const openBtn = document.getElementById("shortcutsBtn");
    const closeBtn = document.getElementById("closeShortcuts");

    const toggle = (show) => modal.classList.toggle("active", show);

    if (openBtn) openBtn.addEventListener("click", () => toggle(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggle(false));
    modal.addEventListener("click", (e) => { if (e.target === modal) toggle(false); });

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === "?" || (e.shiftKey && e.code === "Slash")) {
            e.preventDefault();
            toggle(!modal.classList.contains("active"));
        }
        if (e.code === "Escape" && modal.classList.contains("active")) toggle(false);
    });
}

// === Theme picker modal ===
function initThemePicker() {
    const modal = document.getElementById("themeModal");
    if (!modal) return;
    const openBtn = document.getElementById("themeBtn");
    const closeBtn = document.getElementById("closeTheme");

    const toggle = (show) => modal.classList.toggle("active", show);

    if (openBtn) openBtn.addEventListener("click", () => toggle(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggle(false));
    modal.addEventListener("click", (e) => { if (e.target === modal) toggle(false); });

    // Build swatches
    const container = document.getElementById("themeSwatches");
    if (!container) return;

    const colors = {
        red: "#e94560", purple: "#7c6cf0", teal: "#00d4c8",
        blue: "#4a9eff", green: "#4cd964", amber: "#f0a030",
    };

    const current = getCurrentTheme();

    container.innerHTML = getThemeNames().map(name => `
        <button class="theme-swatch${name === current ? " active" : ""}" data-theme="${name}">
            <span class="swatch-dot" style="background:${colors[name]}"></span>
            ${name}
        </button>
    `).join("");

    container.querySelectorAll(".theme-swatch").forEach(btn => {
        btn.addEventListener("click", () => {
            applyTheme(btn.dataset.theme);
            container.querySelectorAll(".theme-swatch").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Escape to close
    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape" && modal.classList.contains("active")) toggle(false);
    });
}

initMobileMenu();
initShortcutsModal();
initThemePicker();

// === Page-specific initialization ===
if (page === "home") {
    const { initHome } = await import("./home.js");
    initHome();
} else if (page === "library") {
    const { initLibrary } = await import("./library.js");
    initLibrary();
} else if (page === "player") {
    const { initPlayer } = await import("./player.js");
    const mediaId = document.body.dataset.mediaId;
    if (mediaId) initPlayer(mediaId);
}
