// catalogo.js — versión final optimizada (diseño YTS-compacto)
// URL del JSON
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";
const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");
let items = [];
let activeFilter = "all";

// -----------------------------
// FETCH DATA
// -----------------------------
async function fetchData() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error en la respuesta");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("JSON inválido");

        // ordenar por fecha
        items = data.sort((a, b) => (b.published_ts || 0) - (a.published_ts || 0));
        render(items);
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="empty">Error al cargar los datos</div>`;
    }
}

// -----------------------------
// Helpers
// -----------------------------
function extractTeraboxLink(raw) {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
    } catch (e) {}
    const match = String(raw || "").match(/https?:\/\/[^\s"]+/);
    return match ? match[0] : "";
}

function shortTitle(title) {
    if (!title) return "";
    // quitar artículos largos (opcional) y recortar
    return title.length > 40 ? title.substring(0, 37).trim() + "..." : title;
}

// -----------------------------
// RENDER PRINCIPAL (YTS style)
function render(list) {
    const q = (searchInput.value || "").toLowerCase().trim();
    const filtered = list.filter((i) => {
        if (activeFilter !== "all" && i.type !== activeFilter) return false;
        if (q && (!i.title || !i.title.toLowerCase().includes(q))) return false;
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty">No hay resultados</div>`;
        return;
    }

    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    filtered.forEach((item) => {
        const card = document.createElement("article");
        card.className = "card";

        // Movie-card wrapper
        const mc = document.createElement("div");
        mc.className = "movie-card";

        // Poster wrap
        const pw = document.createElement("div");
        pw.className = "poster-wrap";

        const img = document.createElement("img");
        img.className = "poster";
        img.alt = item.title || "Poster";
        img.src = item.poster || "https://via.placeholder.com/600x900?text=No+Image";

        // Play overlay
        const play = document.createElement("div");
        play.className = "play-overlay";
        play.innerHTML = `<i class="fa-solid fa-play"></i>`;

        pw.appendChild(img);
        pw.appendChild(play);
        mc.appendChild(pw);

        // Info block
        const info = document.createElement("div");
        info.className = "card-info";

        const titleRow = document.createElement("div");
        titleRow.className = "title-row";

        const titleEl = document.createElement("div");
        titleEl.className = "movie-title";
        titleEl.textContent = shortTitle(item.title || "");

        const ratingEl = document.createElement("div");
        ratingEl.className = "rating";
        ratingEl.textContent = item.rating ? String(item.rating) : "N/A";

        titleRow.appendChild(titleEl);
        titleRow.appendChild(ratingEl);

        const metaRow = document.createElement("div");
        metaRow.className = "movie-meta";
        const year = item.year || "";
        const genres = item.generos || "";
        metaRow.textContent = `${year}${genres ? " • " + genres : ""}`;

        info.appendChild(titleRow);
        info.appendChild(metaRow);

        // Append info to card
        mc.appendChild(info);

        // Keep season-row if series (compact)
        if (item.type === "series") {
            const seasons = Array.isArray(item.season_links) ? item.season_links : [];
            if (seasons.length > 0) {
                const seasonRow = document.createElement("div");
                seasonRow.className = "season-row";
                seasons.forEach((s) => {
                    const sd = document.createElement("div");
                    sd.className = "season";
                    sd.textContent = s.season;
                    // click behavior: link if present, otherwise vip
                    if (s.link || Array.isArray(s.episodes)) {
                        sd.addEventListener("click", () => {
                            if (Array.isArray(s.episodes) && s.episodes.length) {
                                window.open(s.episodes[0].link, "_blank");
                            } else if (s.link) {
                                window.open(s.link, "_blank");
                            }
                        });
                    } else {
                        sd.addEventListener("click", () => {
                            window.open("https://t.me/movfrezon", "_blank");
                        });
                        const mini = document.createElement("span");
                        mini.className = "badge";
                        mini.textContent = "VIP";
                        sd.appendChild(mini);
                    }
                    seasonRow.appendChild(sd);
                });
                mc.appendChild(seasonRow);
            }
        } else {
            // For movies keep an accessible small link area (not intrusive)
            const movieLink = extractTeraboxLink(item.terabox);
            if (movieLink) {
                // clicking poster opens movie link
                pw.style.cursor = "pointer";
                pw.addEventListener("click", () => window.open(movieLink, "_blank"));
            } else {
                // fallback: if no link, poster opens telegram vip
                pw.style.cursor = "pointer";
                pw.addEventListener("click", () => window.open("https://t.me/movfrezon", "_blank"));
            }
        }

        // Also allow clicking poster for series -> open last season or VIP
        if (item.type === "series") {
            pw.style.cursor = "pointer";
            const seasons = Array.isArray(item.season_links) ? item.season_links : [];
            pw.addEventListener("click", () => {
                if (seasons.length) {
                    // prefer first episode link if exists, else season link, else VIP
                    let found = null;
                    for (let s of seasons) {
                        if (Array.isArray(s.episodes) && s.episodes.length) { found = s.episodes[0].link; break; }
                        if (s.link) { found = s.link; /* continue searching for episodes */ }
                    }
                    if (found) window.open(found, "_blank");
                    else window.open("https://t.me/movfrezon", "_blank");
                } else {
                    window.open("https://t.me/movfrezon", "_blank");
                }
            });
        }

        card.appendChild(mc);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// -----------------------------
// FILTROS Y BUSCADOR
searchInput.addEventListener("input", () => render(items));
filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.type || "all";
        render(items);
    });
});

// iniciar fetchData();
fetchData();
