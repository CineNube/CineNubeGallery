// catalogo.js — versión YTS-style manteniendo tu estructura original
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";
const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");
let items = [];
let activeFilter = "all";

// safe JSON parse for fields that sometimes are strings
function safeParseSeasonLinks(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // fallback: ignore invalid JSON
    }
    return [];
}

// -----------------------------
// FETCH DATA
// -----------------------------
async function fetchData() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error en la respuesta");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("JSON inválido");

        // ordenar por fecha (si viene published_ts)
        items = data.sort((a, b) => ((b.published_ts || 0) - (a.published_ts || 0)));
        render(items);
    } catch (e) {
        console.error(e);
        if (container) container.innerHTML = `<div class="empty">Error al cargar los datos</div>`;
    }
}

// -----------------------------
// EXTRAER LINK TERABOX (mantiene compatibilidad)
function extractTeraboxLink(raw) {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
    } catch (e) {}
    const match = String(raw || "").match(/https?:\/\/[^\s"]+/);
    return match ? match[0] : "";
}

// helper short title
function shortTitle(title) {
    if (!title) return "";
    return title.length > 50 ? title.substring(0, 47).trim() + "..." : title;
}

// -----------------------------
// RENDER PRINCIPAL
function render(list) {
    if (!container) return;
    const q = (searchInput && (searchInput.value || "")).toLowerCase().trim();
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

        // movie-card wrapper
        const mc = document.createElement("div");
        mc.className = "movie-card";

        // poster wrap
        const pw = document.createElement("div");
        pw.className = "poster-wrap";

        const img = document.createElement("img");
        img.className = "poster";
        img.alt = item.title || "Poster";
        img.src = item.poster || item.portada || "https://via.placeholder.com/600x900?text=No+Image";

        // play overlay
        const play = document.createElement("div");
        play.className = "play-overlay";
        play.innerHTML = '<i class="fa-solid fa-play"></i>';

        // subtle fade
        const fade = document.createElement("div");
        fade.className = "poster-bottom-fade";

        pw.appendChild(img);
        pw.appendChild(fade);
        pw.appendChild(play);
        mc.appendChild(pw);

        // info block
        const info = document.createElement("div");
        info.className = "card-info";

        const titleRow = document.createElement("div");
        titleRow.className = "title-row";

        const titleEl = document.createElement("div");
        titleEl.className = "movie-title";
        titleEl.textContent = shortTitle(item.title || item.titulo || "");

        const ratingEl = document.createElement("div");
        ratingEl.className = "rating";
        ratingEl.textContent = item.rating || item.vote_average || "N/A";

        titleRow.appendChild(titleEl);
        titleRow.appendChild(ratingEl);

        const metaRow = document.createElement("div");
        metaRow.className = "movie-meta";
        const year = item.year || item.año || "";
        const genres = item.generos || item.genero || "";
        metaRow.textContent = `${year}${genres ? " • " + genres : ""}`;

        info.appendChild(titleRow);
        info.appendChild(metaRow);
        mc.appendChild(info);

        // Seasons handling for series (compact + VIP badge inside square)
        if (String(item.type).toLowerCase() === "series") {
            const seasonsRaw = item.season_links || item.seasonLinks || "";
            const seasons = safeParseSeasonLinks(seasonsRaw);
            if (seasons.length > 0) {
                const seasonRow = document.createElement("div");
                seasonRow.className = "season-row";

                seasons.forEach((s) => {
                    const sd = document.createElement("div");
                    sd.className = "season";

                    // get season number in a safe way
                    const seasonNumber = s.season ?? s.season_number ?? s.seasonNumber ?? "";
                    // determine if this season has episodes or a link
                    const hasEpisodes = Array.isArray(s.episodes) && s.episodes.length > 0;
                    const hasLink = !!(s.link && String(s.link).indexOf("http") === 0);

                    // Put number as main content
                    const numSpan = document.createElement("span");
                    numSpan.className = "season-number";
                    numSpan.textContent = String(seasonNumber) || "T";
                    sd.appendChild(numSpan);

                    // If season has episodes or direct link -> show the number (free)
                    if (hasEpisodes || hasLink) {
                        sd.classList.add("season-free");
                        // click behaviour
                        sd.addEventListener("click", (e) => {
                            e.stopPropagation();
                            // if episodes array -> open first episode
                            if (hasEpisodes) {
                                const link = s.episodes[0].link || s.episodes[0].dlink || "";
                                if (link) window.open(link, "_blank");
                                return;
                            }
                            // else if season has a link -> open it
                            if (hasLink) {
                                window.open(s.link, "_blank");
                                return;
                            }
                        });
                    } else {
                        // No link/episodes -> VIP
                        sd.classList.add("season-vip");
                        // append small badge "VIP" inside (visual)
                        const badge = document.createElement("span");
                        badge.className = "badge";
                        badge.textContent = "VIP";
                        sd.appendChild(badge);

                        // clicking VIP opens VIP contact
                        sd.addEventListener("click", (e) => {
                            e.stopPropagation();
                            window.open("https://t.me/movfrezon", "_blank");
                        });
                    }

                    seasonRow.appendChild(sd);
                });

                mc.appendChild(seasonRow);
            }
        }

        // Poster click behaviour:
        // - Movies: open terabox (extractTeraboxLink)
        // - Series: try to open first episode link or season.link or VIP
        if (String(item.type).toLowerCase() === "movie") {
            const movieLink = extractTeraboxLink(item.terabox || item.terabox_link || item.enlace || item.link);
            if (movieLink) {
                pw.style.cursor = "pointer";
                pw.addEventListener("click", () => window.open(movieLink, "_blank"));
            } else {
                pw.style.cursor = "pointer";
                pw.addEventListener("click", () => window.open("https://t.me/movfrezon", "_blank"));
            }
        } else if (String(item.type).toLowerCase() === "series") {
            pw.style.cursor = "pointer";
            pw.addEventListener("click", () => {
                const seasonsRaw = item.season_links || item.seasonLinks || "";
                const seasons = safeParseSeasonLinks(seasonsRaw);
                // try to find first episode link
                for (let s of seasons) {
                    if (Array.isArray(s.episodes) && s.episodes.length) {
                        const link = s.episodes[0].link || s.episodes[0].dlink || "";
                        if (link) { window.open(link, "_blank"); return; }
                    }
                    if (s.link) { window.open(s.link, "_blank"); return; }
                }
                // fallback VIP
                window.open("https://t.me/movfrezon", "_blank");
            });
        } else {
            // fallback generic: try terabox in any case
            const anyLink = extractTeraboxLink(item.terabox || item.link || item.enlace);
            if (anyLink) {
                pw.style.cursor = "pointer";
                pw.addEventListener("click", () => window.open(anyLink, "_blank"));
            }
        }

        card.appendChild(mc);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// -----------------------------
// FILTROS Y BUSCADOR
if (searchInput) searchInput.addEventListener("input", () => render(items));
if (filterButtons && filterButtons.length) filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.type || "all";
        render(items);
    });
});

// iniciar fetchData()
fetchData();

/* =============================
   NUEVAS SECCIONES HOME
   ============================= */

// scroll a catálogo
document.getElementById("scrollToCatalog")?.addEventListener("click", () => {
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
});

// Render rápido mini-card estilo tu card (pero en horizontal)
function miniCard(item) {
    return `
      <div class="mini-card">
        <img src="${item.poster || item.portada}" loading="lazy">
        <div class="mini-info">
          <span class="mini-title">${item.title || item.titulo}</span>
          <span class="mini-meta">${item.year || ""}</span>
        </div>
      </div>
    `;
}

// ------------------------------
// 1 — TENDENCIAS HOY
// ------------------------------
function renderTendencias() {
    const cont = document.getElementById("tendenciasList");
    if (!cont) return;

    const hoy = new Date().toISOString().slice(0, 10);

    const hoyItems = items.filter(i => {
        if (!i.published_date) return false;
        return i.published_date.slice(0, 10) === hoy;
    });

    cont.innerHTML = hoyItems.length
        ? hoyItems.map(miniCard).join("")
        : "<div class='empty'>Hoy no hay estrenos nuevos</div>";
}

// ------------------------------
// 2 — POPULARES (ULTIMOS 7 DÍAS)
// ------------------------------
function renderPopulares() {
    const cont = document.getElementById("popularesList");
    if (!cont) return;

    const now = Date.now();
    const semana = 86400000 * 7;

    const pop = items.filter(i => {
        const t = i.published_ts || 0;
        return now - t < semana;
    }).slice(0, 20);

    cont.innerHTML = pop.length
        ? pop.map(miniCard).join("")
        : "<div class='empty'>No hay contenido reciente</div>";
}

// ------------------------------
// 3 — TOP 10 VALORADAS
// ------------------------------
function renderTop10() {
    const cont = document.getElementById("top10List");
    if (!cont) return;

    const top = [...items]
        .filter(i => Number(i.rating) > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

    cont.innerHTML = top.map((i, idx) => `
      <div class="top10-item">
        <span class="pos">${idx + 1}</span>
        <img src="${i.poster}" loading="lazy">
        <span class="name">${i.title}</span>
        <span class="rate">⭐ ${i.rating}</span>
      </div>
    `).join("");
}

// Ejecutar cuando cargan los datos
setTimeout(() => {
    renderTendencias();
    renderPopulares();
    renderTop10();
}, 800);
