import { fetchMedia } from "./api.js";
import { formatSize, formatTime, $, hasPosition, isFavorite, toggleFavorite, getRecentlyPlayed, toast } from "./utils.js";

function createCard(item, className = "stagger-in") {
    const card = document.createElement("a");
    card.href = `/player/${item.id}`;
    card.className = `media-card ${className}`;

    const typeIcon =
        item.type === "video"
            ? `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    const durationStr = item.duration ? formatTime(item.duration) : "";
    const thumbContent = item.has_thumbnail
        ? `<img src="${item.thumbnail_url}" alt="${item.title}" loading="lazy">`
        : typeIcon;
    const resumeBadge = hasPosition(item.id) ? `<span class="card-resume">Resume</span>` : "";
    const favActive = isFavorite(item.id) ? " active" : "";

    card.innerHTML = `
        <div class="card-thumb">
            ${thumbContent}
            ${durationStr ? `<span class="card-duration">${durationStr}</span>` : ""}
            ${resumeBadge}
            <button class="fav-btn${favActive}" data-id="${item.id}" title="Favorite">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <div class="card-play-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        <div class="card-info">
            <div class="card-title" title="${item.title}">${item.title}</div>
            <div class="card-meta">
                <span class="badge badge-${item.type}">${item.type === "video" ? "Video" : "Audio"}</span>
                &middot; ${formatSize(item.size)}
                ${item.codec ? `&middot; ${item.codec}` : ""}
            </div>
        </div>
    `;

    const favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleFavorite(item.id);
        favBtn.classList.toggle("active", added);
        favBtn.classList.add("pop");
        setTimeout(() => favBtn.classList.remove("pop"), 350);
        toast(added ? "Added to favorites" : "Removed from favorites", added ? "success" : "info");
    });

    return card;
}

function updateStats(items) {
    const total = $("#statTotal");
    const videos = $("#statVideos");
    const audio = $("#statAudio");
    if (total) total.textContent = items.length;
    if (videos) videos.textContent = items.filter(i => i.type === "video").length;
    if (audio) audio.textContent = items.filter(i => i.type === "audio").length;
}

function renderRecentlyPlayed(allItems) {
    const container = $("#recentlyPlayedRow");
    if (!container) return;

    const recentIds = getRecentlyPlayed();
    if (recentIds.length === 0) {
        // Hide the section entirely
        const section = container.closest(".content-section");
        if (section) section.style.display = "none";
        return;
    }

    const itemMap = {};
    for (const item of allItems) itemMap[item.id] = item;

    const recentItems = recentIds
        .map(id => itemMap[id])
        .filter(Boolean)
        .slice(0, 10);

    if (recentItems.length === 0) {
        const section = container.closest(".content-section");
        if (section) section.style.display = "none";
        return;
    }

    container.innerHTML = "";
    for (const item of recentItems) {
        container.appendChild(createCard(item, "fade-in"));
    }
}

export async function initHome() {
    const grid = $("#recentGrid");
    if (!grid) return;

    try {
        const items = await fetchMedia();
        updateStats(items);

        // Recently added
        const recent = items.slice(0, 8);
        if (recent.length === 0) return;

        grid.innerHTML = "";
        const fragment = document.createDocumentFragment();
        for (const item of recent) fragment.appendChild(createCard(item));
        grid.appendChild(fragment);

        // Recently played
        renderRecentlyPlayed(items);
    } catch (err) {
        console.error("[StreamBox] Failed to load:", err);
    }
}
