// Dynamic Media Streamer — Entry Point
// Detects current page and initializes the appropriate module

const page = document.body.dataset.page || "home";

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
