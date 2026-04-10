import { fetchMedia } from "./api.js";
import { formatSize, formatTime, $, hasPosition } from "./utils.js";

function createCard(item) {
    const card = document.createElement("a");
    card.href = `/player/${item.id}`;
    card.className = "media-card fade-in";

    const typeIcon =
        item.type === "video"
            ? `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    const durationStr = item.duration ? formatTime(item.duration) : "";
    const thumbContent = item.has_thumbnail
        ? `<img src="${item.thumbnail_url}" alt="${item.title}" loading="lazy">`
        : typeIcon;
    const resumeBadge = hasPosition(item.id) ? `<span class="card-resume">Resume</span>` : "";

    card.innerHTML = `
        <div class="card-thumb">
            ${thumbContent}
            ${durationStr ? `<span class="card-duration">${durationStr}</span>` : ""}
            ${resumeBadge}
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

export async function initHome() {
    const grid = $("#recentGrid");
    if (!grid) return;

    try {
        const items = await fetchMedia();
        updateStats(items);

        const recent = items.slice(0, 8);
        if (recent.length === 0) return;

        grid.innerHTML = "";
        const fragment = document.createDocumentFragment();
        for (const item of recent) {
            fragment.appendChild(createCard(item));
        }
        grid.appendChild(fragment);
    } catch (err) {
        console.error("[StreamBox] Failed to load recent media:", err);
    }
}
