import { fetchMedia } from "./api.js";
import { formatSize, formatTime, $ } from "./utils.js";

export async function initHome() {
    const grid = $("#recentGrid");
    if (!grid) return;

    try {
        const items = await fetchMedia();
        const recent = items.slice(0, 8);

        if (recent.length === 0) return; // keep skeleton/placeholder

        grid.innerHTML = "";
        const fragment = document.createDocumentFragment();

        for (const item of recent) {
            const card = document.createElement("a");
            card.href = `/player/${item.id}`;
            card.className = "media-card";

            const typeIcon =
                item.type === "video"
                    ? `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
                    : `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

            const durationStr = item.duration ? formatTime(item.duration) : "";
            const thumbContent = item.has_thumbnail
                ? `<img src="${item.thumbnail_url}" alt="${item.title}" loading="lazy">`
                : typeIcon;

            card.innerHTML = `
                <div class="card-thumb">
                    ${thumbContent}
                    ${durationStr ? `<span class="card-duration">${durationStr}</span>` : ""}
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
            fragment.appendChild(card);
        }
        grid.appendChild(fragment);
    } catch (err) {
        console.error("[StreamBox] Failed to load recent media:", err);
    }
}
