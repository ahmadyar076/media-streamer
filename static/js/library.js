import { fetchMedia, refreshLibrary } from "./api.js";
import { formatSize, formatTime, debounce, $, $$, toast, hasPosition, isFavorite, toggleFavorite } from "./utils.js";

let currentType = "all";
let currentQuery = "";
let currentSort = "modified";
let currentView = "grid";
let allItems = [];

function createCard(item) {
    const card = document.createElement("a");
    card.href = `/player/${item.id}`;
    card.className = "media-card stagger-in";

    const typeIcon =
        item.type === "video"
            ? `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    const badge = item.type === "video" ? "Video" : "Audio";
    const durationStr = item.duration ? formatTime(item.duration) : "";
    const thumbContent = item.has_thumbnail
        ? `<img src="${item.thumbnail_url}" alt="${item.title}" loading="lazy">`
        : typeIcon;
    const resumeBadge = hasPosition(item.id) ? `<span class="card-resume">Resume</span>` : "";
    const favActive = isFavorite(item.id) ? " active" : "";

    const listMeta = currentView === "list"
        ? `<div class="card-list-meta">${durationStr || "--"} &middot; ${formatSize(item.size)}</div>`
        : "";

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
                <span class="badge badge-${item.type}">${badge}</span>
                &middot; ${formatSize(item.size)}
                ${item.codec ? `&middot; ${item.codec}` : ""}
            </div>
        </div>
        ${listMeta}
    `;

    // Favorite button click handler
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

function sortItems(items) {
    const sorted = [...items];
    switch (currentSort) {
        case "title":      sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
        case "title-desc": sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
        case "size":       sorted.sort((a, b) => (b.size || 0) - (a.size || 0)); break;
        case "duration":   sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0)); break;
        default:           sorted.sort((a, b) => (b.modified || 0) - (a.modified || 0));
    }
    return sorted;
}

function renderItems(items) {
    const grid = $("#libraryGrid");
    const countEl = $("#mediaCount");
    const emptyState = $("#emptyState");
    if (!grid) return;

    grid.innerHTML = "";
    grid.className = currentView === "list" ? "media-grid list-view" : "media-grid";

    if (items.length === 0) {
        if (emptyState) { grid.appendChild(emptyState); emptyState.style.display = "flex"; }
        if (countEl) countEl.textContent = "0 items";
        return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;

    const fragment = document.createDocumentFragment();
    for (const item of items) fragment.appendChild(createCard(item));
    grid.appendChild(fragment);
}

function filterAndRender() {
    let items = allItems;
    if (currentType === "favorites") {
        const favs = JSON.parse(localStorage.getItem("streambox_favorites") || "[]");
        items = items.filter(i => favs.includes(i.id));
    } else if (currentType !== "all") {
        items = items.filter(i => i.type === currentType);
    }
    if (currentQuery) {
        const q = currentQuery.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(q));
    }
    items = sortItems(items);
    renderItems(items);
}

async function loadLibrary() {
    const grid = $("#libraryGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="spinner-overlay"><div class="spinner"></div><span>Loading media...</span></div>`;
    try {
        allItems = await fetchMedia();
        filterAndRender();
    } catch (err) {
        grid.innerHTML = `<div class="empty-state"><h3>Failed to load media</h3><p>${err.message}</p></div>`;
        toast("Failed to load library", "error");
    }
}

export function initLibrary() {
    // Filters
    $$(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            $$(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentType = btn.dataset.type || "all";
            filterAndRender();
        });
    });

    // Sort
    const select = $("#sortSelect");
    if (select) select.addEventListener("change", () => { currentSort = select.value; filterAndRender(); });

    // View toggle
    $$(".view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            $$(".view-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentView = btn.dataset.view || "grid";
            filterAndRender();
        });
    });

    // Search
    const input = $("#searchInput");
    if (input) {
        const d = debounce(v => { currentQuery = v; filterAndRender(); }, 250);
        input.addEventListener("input", e => d(e.target.value));
    }

    // Refresh
    const refreshBtn = $("#refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = "0.5";
            const svg = refreshBtn.querySelector("svg");
            if (svg) svg.style.animation = "spin 0.7s linear infinite";
            try {
                const r = await refreshLibrary();
                toast(`Refreshed: ${r.count} file${r.count !== 1 ? "s" : ""}`, "success");
                await loadLibrary();
            } catch { toast("Refresh failed", "error"); }
            finally {
                refreshBtn.disabled = false;
                refreshBtn.style.opacity = "1";
                if (svg) svg.style.animation = "";
            }
        });
    }

    // URL params
    const params = new URLSearchParams(window.location.search);
    const tp = params.get("type");
    if (tp && ["video", "audio", "favorites"].includes(tp)) {
        currentType = tp;
        $$(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.type === tp));
    }

    loadLibrary();
}
