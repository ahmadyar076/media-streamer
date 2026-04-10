// StreamBox — Entry Point

const page = document.body.dataset.page || "home";

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
    const openBtn = document.getElementById("shortcutsBtn");
    const closeBtn = document.getElementById("closeShortcuts");

    if (!modal) return;

    const toggle = (show) => {
        modal.classList.toggle("active", show);
    };

    if (openBtn) openBtn.addEventListener("click", () => toggle(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggle(false));

    modal.addEventListener("click", (e) => {
        if (e.target === modal) toggle(false);
    });

    // '?' key opens shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === "?" || (e.shiftKey && e.code === "Slash")) {
            e.preventDefault();
            toggle(!modal.classList.contains("active"));
        }
        if (e.code === "Escape" && modal.classList.contains("active")) {
            toggle(false);
        }
    });
}

initMobileMenu();
initShortcutsModal();

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
