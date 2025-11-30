// -------------------------
// FUNCIONES DE UTILIDAD
// -------------------------
function sanitize(text) {
    return String(text || "").trim();
}

function safeParseSeasonLinks(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

// -------------------------
// GENERAR TARJETAS DEL CATÁLOGO
// -------------------------
function generateCard(item) {
    const type = sanitize(item.type).toLowerCase();
    const title = sanitize(item.title);
    const rating = sanitize(item.rating);
    const year = sanitize(item.year);
    const genre = sanitize(item.genre);
    const poster = sanitize(item.poster);

    let html = `
<div class="yts-card">
    <div class="yts-poster">
        <img src="${poster}" alt="${title}">
        <div class="yts-overlay"><i class="fas fa-play"></i></div>
    </div>

    <div class="yts-info">
        <h3>${title}</h3>
        <div class="yts-meta">
            <span>${year}</span>
            <span class="yts-genre">${genre}</span>
        </div>
        <div class="yts-rating">${rating}</div>
    </div>
`;

    // -------------------------
    // SERIES → BLOQUE DE TEMPORADAS
    // -------------------------
    if (type === "series") {
        const seasonsRaw = item.season_links || item.seasonLinks || "";
        const seasons = safeParseSeasonLinks(seasonsRaw);

        html += `<div class="season-container">`;

        seasons.forEach(season => {
            const seasonNum = season.season;
            const episodes = season.episodes || [];

            // Tiene episodios → ES GRATIS
            const isFree = episodes.length > 0;

            // 🔥 AQUI ESTA LA CORRECCIÓN QUE PEDISTE 🔥
            if (isFree) {
                html += `
                <button class="season-btn free" data-season="${seasonNum}" data-id="${item.id}">
                    ${seasonNum}
                </button>`;
            } else {
                html += `
                <button class="season-btn vip" disabled>
                    VIP
                </button>`;
            }
        });

        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// -------------------------
// CARGAR LA DATA
// -------------------------
let globalData = [];

function renderCatalog(data) {
    const container = document.getElementById("catalogo");
    container.innerHTML = data.map(generateCard).join("");

    // EVENTOS DE TEMPORADA (solo si tienen link)
    document.querySelectorAll(".season-btn.free").forEach(btn => {
        btn.addEventListener("click", () => {
            const season = btn.dataset.season;
            const id = btn.dataset.id;

            const item = globalData.find(i => i.id == id);
            if (!item) return;

            const seasons = safeParseSeasonLinks(item.season_links || item.seasonLinks || "");
            const s = seasons.find(s => s.season == season);
            if (!s) return;

            const firstEp = (s.episodes && s.episodes[0]) ? s.episodes[0].link : null;

            if (firstEp) {
                window.location.href = firstEp;
            }
        });
    });
}

async function fetchData() {
    try {
        const url = "https://script.google.com/macros/s/AKfycbyoBZS8RETPSdWL3k2Fi7j0bGSR9svVn96E55qRvErCrmdNVzXj8gj1nUpDIFA3yIN-/exec";

        const res = await fetch(url);
        const json = await res.json();

        globalData = json;
        renderCatalog(json);

    } catch (e) {
        console.error("Error cargando catálogo:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});
