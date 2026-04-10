const BASE = "/api";

/**
 * Fetch the media catalog, optionally filtered by type and search query.
 */
export async function fetchMedia({ type, q } = {}) {
    const params = new URLSearchParams();
    if (type && type !== "all") params.set("type", type);
    if (q) params.set("q", q);

    const url = `${BASE}/media${params.toString() ? "?" + params : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

/**
 * Fetch a single media item by ID.
 */
export async function fetchMediaById(id) {
    const res = await fetch(`${BASE}/media/${id}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

/**
 * Tell the backend to re-scan the media directory.
 */
export async function refreshLibrary() {
    const res = await fetch(`${BASE}/refresh`, { method: "POST" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}
