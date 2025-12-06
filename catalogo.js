// catalogo.js — versión segura que reutiliza el render que dijiste que funcionaba
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");

let items = [];
let activeFilter = "all";

// safe JSON parse for season_links
function safeParseSeasonLinks(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch(e) {}
    return [];
}

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
    return title.length > 50 ? title.substring(0,47).trim() + "..." : title;
}

// -----------------------------
// FETCH DATA (único punto de entrada)
async function fetchData() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error en la respuesta");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("JSON inválido");

        items = data.sort((a,b) => ( (b.published_ts || 0) - (a.published_ts || 0) ));
        render(items);              // catálogo principal (tu render que funciona)
        renderTendencias(items);    // mini-cards de hoy
        renderPopulares(items);     // populares
        renderTop10(items);         // top10
    } catch (e) {
        console.error("Error cargando datos:", e);
        if (container) container.innerHTML = `<div class="empty">Error al cargar los datos</div>`;
        // también limpias secciones si existen
        const t = document.getElementById("tendenciasList"); if (t) t.innerHTML = "<p class='empty'>Error</p>";
        const p = document.getElementById("popularesList"); if (p) p.innerHTML = "<p class='empty'>Error</p>";
        const tt = document.getElementById("top10List"); if (tt) tt.innerHTML = "<p class='empty'>Error</p>";
    }
}

// -----------------------------
// RENDER PRINCIPAL (el render que dijiste QUE FUNCIONABA)
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

                    const seasonNumber = s.season ?? s.season_number ?? s.seasonNumber ?? "";
                    const hasEpisodes = Array.isArray(s.episodes) && s.episodes.length > 0;
                    const hasLink = !!(s.link && String(s.link).indexOf("http") === 0);

                    // Put number as main content
                    const numSpan = document.createElement("span");
                    numSpan.className = "season-number";
                    numSpan.textContent = String(seasonNumber) || "T";
                    sd.appendChild(numSpan);

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
                        // VIP: number visible + VIP badge centered but not covering number
                        sd.classList.add("season-vip");
                        sd.style.position = "relative";

                        // ensure season-number stays on top
                        numSpan.style.zIndex = "3";
                        numSpan.style.position = "relative";

                        const badge = document.createElement("span");
                        badge.className = "badge";
                        badge.textContent = "VIP";
                        // style badge to not cover number - top-right small badge
                        badge.style.position = "absolute";
                        badge.style.top = "6px";
                        badge.style.right = "6px";
                        badge.style.zIndex = "4";
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
                for (let s of seasons) {
                    if (Array.isArray(s.episodes) && s.episodes.length) {
                        const link = s.episodes[0].link || s.episodes[0].dlink || "";
                        if (link) { window.open(link, "_blank"); return; }
                    }
                    if (s.link) { window.open(s.link, "_blank"); return; }
                }
                window.open("https://t.me/movfrezon", "_blank");
            });
        } else {
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
// SECCIONES: Tendencias / Populares / Top10
function renderTendencias(list) {
    const out = document.getElementById("tendenciasList");
    if (!out) return;

    // usar 'updated' o 'published_at' para hoy (formato ISO)
    const todayISO = new Date().toISOString().slice(0,10);
    const hoy = list.filter(i => {
        const u = (i.updated || i.published_at || "").toString();
        return u.startsWith(todayISO);
    });

    if (!hoy.length) {
        out.innerHTML = "<p class='empty'>Hoy no hay estrenos nuevos</p>";
        return;
    }

    out.innerHTML = "";
    hoy.slice(0,12).forEach(item => out.appendChild(createMiniCard(item)));
}

function renderPopulares(list) {
    const out = document.getElementById("popularesList");
    if (!out) return;

    out.innerHTML = "";
    const sorted = [...list].sort((a,b) => (parseFloat(b.rating || b.vote_average || 0) - parseFloat(a.rating || a.vote_average || 0)));
    sorted.slice(0,12).forEach(item => out.appendChild(createMiniCard(item)));
}

function renderTop10(list) {
    const out = document.getElementById("top10List");
    if (!out) return;

    out.innerHTML = "";
    const sorted = [...list].sort((a,b) => (parseFloat(b.vote_average || b.rating || 0) - parseFloat(a.vote_average || a.rating || 0)));
    const top = sorted.slice(0,10);
    top.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "top10-item";
        row.innerHTML = `
            <span class="pos">${idx+1}</span>
            <img src="${item.poster || ''}" alt="${item.title || ''}">
            <div class="name">${item.title || ''}</div>
            <div class="rate">⭐ ${item.vote_average || item.rating || '-'}</div>
        `;
        out.appendChild(row);
    });
}

// helper mini-card for horizontal rows
function createMiniCard(item) {
    const div = document.createElement("div");
    div.className = "mini-card";
    div.innerHTML = `
        <img src="${item.poster || ''}" alt="${item.title || ''}">
        <div class="mini-info">
            <span class="mini-title">${item.title || ''}</span>
            <span class="mini-meta">${item.year || ''}</span>
        </div>
    `;
    // click opens first available link (terabox or telegram fallback)
    div.addEventListener("click", () => {
        const link = extractTeraboxLink(item.terabox || item.link || item.enlace) || "https://t.me/movfrezon";
        window.open(link, "_blank");
    });
    return div;
}

// -----------------------------
// FILTROS Y BUSCADOR (igual que antes)
if (searchInput) searchInput.addEventListener("input", () => render(items));
if (filterButtons && filterButtons.length) filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.type || "all";
        render(items);
    });
});

// iniciar
fetchData();
