// catalogo.js — versión final integrada (catálogo + secciones Tendencias / Populares / Top10)
// Usa TU SHEET_JSON_URL (la misma que ya funcionaba para el catálogo)

const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";
const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");

let items = [];
let activeFilter = "all";

// -----------------------------
// UTIL: parse seguro season_links / JSON si viene string
// -----------------------------
function safeParseJSON(raw) {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

// -----------------------------
// EXTRAER LINK TERABOX (mantiene compatibilidad)
// -----------------------------
function extractTeraboxLink(raw) {
    if (!raw) return "";
    if (typeof raw === "string") {
        // try parse JSON first
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
        } catch (e) { /* ignore */ }
        // fallback regex
        const match = String(raw || "").match(/https?:\/\/[^\s"]+/);
        return match ? match[0] : "";
    }
    // if object/array
    try {
        if (Array.isArray(raw) && raw[0] && raw[0].link) return raw[0].link;
    } catch (e) {}
    return "";
}

// -----------------------------
// FETCH DATA
// -----------------------------
async function fetchData() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error en la respuesta: " + res.status);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("JSON inválido (no es array)");

        // normalizar y ordenar por published_ts / published_at / updated
        items = data.map(d => d || {});
        items.sort((a, b) => {
            const ta = Date.parse(a.published_at || a.updated || a.published_ts || 0) || 0;
            const tb = Date.parse(b.published_at || b.updated || b.published_ts || 0) || 0;
            return tb - ta;
        });

        // Render principal y secciones
        render(items);
        renderSections(items);

    } catch (e) {
        console.error(e);
        if (container) container.innerHTML = `<div class="empty">Error al cargar los datos</div>`;
        // También limpiar las secciones si existen
        const t = document.getElementById("tendenciasList");
        const p = document.getElementById("popularesList");
        const t10 = document.getElementById("top10List");
        if (t) t.innerHTML = "<p>Error cargando datos</p>";
        if (p) p.innerHTML = "<p>Error cargando datos</p>";
        if (t10) t10.innerHTML = "<p>Error cargando datos</p>";
    }
}

// -----------------------------
// RENDER PRINCIPAL (lista completa) - mantiene tu estilo original
// -----------------------------
function render(list) {
    if (!container) return;
    const q = (searchInput && (searchInput.value || "")).toLowerCase().trim();
    const filtered = list.filter((i) => {
        if (activeFilter !== "all" && String(i.type).toLowerCase() !== String(activeFilter).toLowerCase()) return false;
        if (q && (!i.title || !String(i.title).toLowerCase().includes(q))) return false;
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty">No hay resultados</div>`;
        return;
    }

    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    filtered.forEach((item) => {
        const card = buildFullCard(item);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// -----------------------------
// BUILD CARD (estructura similar a la que tenías)
// -----------------------------
function buildFullCard(item) {
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
        const seasonsRaw = item.season_links || item.seasonLinks || item.season || "";
        const parsed = safeParseJSON(seasonsRaw) || [];
        if (parsed.length > 0) {
            const seasonRow = document.createElement("div");
            seasonRow.className = "season-row";

            parsed.forEach((s) => {
                const sd = document.createElement("div");
                sd.className = "season";

                // season number
                const seasonNumber = s.season ?? s.season_number ?? s.seasonNumber ?? "";
                const numSpan = document.createElement("span");
                numSpan.className = "season-number";
                numSpan.textContent = String(seasonNumber) || "T";
                sd.appendChild(numSpan);

                const hasEpisodes = Array.isArray(s.episodes) && s.episodes.length > 0;
                const hasLink = !!(s.link && String(s.link).indexOf("http") === 0);

                if (hasEpisodes || hasLink) {
                    sd.classList.add("season-free");
                    sd.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (hasEpisodes) {
                            const link = s.episodes[0].link || s.episodes[0].dlink || "";
                            if (link) window.open(link, "_blank");
                            return;
                        }
                        if (hasLink) {
                            window.open(s.link, "_blank");
                            return;
                        }
                    });
                } else {
                    sd.classList.add("season-vip");
                    // badge (gold) centered but keep number visible above
                    const badge = document.createElement("span");
                    badge.className = "badge";
                    badge.textContent = "VIP";
                    sd.appendChild(badge);
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
    const anyLink = extractTeraboxLink(item.terabox || item.terabox_link || item.enlace || item.link);
    if (String(item.type).toLowerCase() === "movie") {
        if (anyLink) {
            pw.style.cursor = "pointer";
            pw.addEventListener("click", () => window.open(anyLink, "_blank"));
        } else {
            pw.style.cursor = "pointer";
            pw.addEventListener("click", () => window.open("https://t.me/movfrezon", "_blank"));
        }
    } else if (String(item.type).toLowerCase() === "series") {
        pw.style.cursor = "pointer";
        pw.addEventListener("click", () => {
            // try to open first episode or season link
            const seasonsRaw = item.season_links || item.seasonLinks || item.season || "";
            const parsed = safeParseJSON(seasonsRaw) || [];
            for (let s of parsed) {
                if (Array.isArray(s.episodes) && s.episodes.length) {
                    const link = s.episodes[0].link || s.episodes[0].dlink || "";
                    if (link) { window.open(link, "_blank"); return; }
                }
                if (s.link) { window.open(s.link, "_blank"); return; }
            }
            // fallback
            window.open("https://t.me/movfrezon", "_blank");
        });
    } else {
        if (anyLink) {
            pw.style.cursor = "pointer";
            pw.addEventListener("click", () => window.open(anyLink, "_blank"));
        }
    }

    card.appendChild(mc);
    return card;
}

// -----------------------------
// Short title helper
// -----------------------------
function shortTitle(title) {
    if (!title) return "";
    return title.length > 50 ? title.substring(0, 47).trim() + "..." : title;
}

// -----------------------------
// SECCIONES: Tendencias / Populares / Top10
// -----------------------------
function renderSections(data) {
    renderTendencias(data);
    renderPopulares(data);
    renderTop10(data);
}

function renderTendencias(data) {
    const box = document.getElementById("tendenciasList");
    if (!box) return;

    // Intentamos usar published_at o updated (ISO datetime)
    const hoyISO = new Date().toISOString().slice(0, 10);

    const lista = data.filter(i => {
        const candidate = (i.published_at || i.updated || i.published || "");
        return String(candidate).startsWith(hoyISO);
    });

    if (!lista || lista.length === 0) {
        box.innerHTML = "<p>Hoy no hay estrenos nuevos</p>";
        return;
    }

    box.innerHTML = "";
    lista.slice(0, 12).forEach(item => {
        const c = compactCard(item);
        box.appendChild(c);
    });
}

function renderPopulares(data) {
    const box = document.getElementById("popularesList");
    if (!box) return;

    const lista = [...data].sort((a, b) => {
        const ra = parseFloat(a.rating || a.vote_average || 0) || 0;
        const rb = parseFloat(b.rating || b.vote_average || 0) || 0;
        return rb - ra;
    }).slice(0, 12);

    if (!lista || lista.length === 0) {
        box.innerHTML = "<p>No hay contenido reciente</p>";
        return;
    }

    box.innerHTML = "";
    lista.forEach(item => box.appendChild(compactCard(item)));
}

function renderTop10(data) {
    const box = document.getElementById("top10List");
    if (!box) return;

    const lista = [...data].sort((a, b) => {
        const va = parseFloat(a.vote_average || a.rating || 0) || 0;
        const vb = parseFloat(b.vote_average || b.rating || 0) || 0;
        return vb - va;
    }).slice(0, 10);

    if (!lista || lista.length === 0) {
        box.innerHTML = "<p>No hay datos para Top 10</p>";
        return;
    }

    box.innerHTML = "";
    lista.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "top10-row";
        row.innerHTML = `
            <div class="top10-pos">${idx + 1}</div>
            <div class="top10-thumb"><img src="${item.poster || ''}" loading="lazy" /></div>
            <div class="top10-meta">
                <div class="top10-title">${item.title || ''}</div>
                <div class="top10-score">⭐ ${item.vote_average || item.rating || 'N/A'}</div>
            </div>
        `;
        box.appendChild(row);
    });
}

// -----------------------------
// Compact card (para secciones)
// devuelve Element
// -----------------------------
function compactCard(item) {
    const el = document.createElement("div");
    el.className = "compact-card";

    const link = extractTeraboxLink(item.terabox || item.enlace || item.link) || "";

    el.innerHTML = `
        <div class="compact-poster">
            <img src="${item.poster || ''}" loading="lazy" />
            <div class="compact-play">${ link ? '<a href="'+link+'" target="_blank" class="play-mini"><i class="fa-solid fa-play"></i></a>' : '<a href="https://t.me/movfrezon" target="_blank" class="play-mini"><i class="fa-solid fa-play"></i></a>' }</div>
            ${ ( !link ) ? '<div class="compact-vip">VIP</div>' : '' }
        </div>
        <div class="compact-title">${item.title || ''}</div>
    `;

    return el;
}

// -----------------------------
// FILTROS Y BUSCADOR (mantener comportamiento anterior)
// -----------------------------
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
