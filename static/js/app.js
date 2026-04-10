// Dynamic Media Streamer — Entry Point

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

initMobileMenu();

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
