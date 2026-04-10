import { fetchMedia, refreshLibrary } from "./api.js";
import { formatSize, formatTime, debounce, $, $$ } from "./utils.js";

let currentType = "all";
let currentQuery = "";

function createCard(item) {
    const card = document.createElement("a");
    card.href = `/player/${item.id}`;
    card.className = "media-card";

    const typeIcon =
        item.type === "video"
            ? `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    const badge = item.type === "video" ? "Video" : "Audio";
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
                <span class="badge badge-${item.type}">${badge}</span>
                &middot; ${formatSize(item.size)}
                ${item.codec ? `&middot; ${item.codec}` : ""}
            </div>
        </div>
    `;
    return card;
}

async function loadLibrary() {
    const grid = $("#libraryGrid");
    const countEl = $("#mediaCount");
    const emptyState = $("#emptyState");

    if (!grid) return;

    // Show loading
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "none";

    try {
        const items = await fetchMedia({ type: currentType, q: currentQuery });

        if (items.length === 0) {
            if (emptyState) {
                grid.appendChild(emptyState);
                emptyState.style.display = "flex";
            }
            if (countEl) countEl.textContent = "0 items";
            return;
        }

        if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;

        const fragment = document.createDocumentFragment();
        for (const item of items) {
            fragment.appendChild(createCard(item));
        }
        grid.appendChild(fragment);
    } catch (err) {
        console.error("[StreamBox] Failed to load library:", err);
        grid.innerHTML = `<div class="empty-state"><h3>Failed to load media</h3><p>${err.message}</p></div>`;
    }
}

function bindFilters() {
    const buttons = $$(".filter-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentType = btn.dataset.type || "all";
            loadLibrary();
        });
    });
}

function bindSearch() {
    const input = $("#searchInput");
    if (!input) return;

    const debouncedSearch = debounce((value) => {
        currentQuery = value;
        loadLibrary();
    }, 300);

    input.addEventListener("input", (e) => debouncedSearch(e.target.value));
}

function bindRefresh() {
    const btn = $("#refreshBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        try {
            const result = await refreshLibrary();
            console.log(`[StreamBox] Refreshed: ${result.count} files`);
            await loadLibrary();
        } catch (err) {
            console.error("[StreamBox] Refresh failed:", err);
        } finally {
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    });
}

export function initLibrary() {
    bindFilters();
    bindSearch();
    bindRefresh();
    loadLibrary();
}
