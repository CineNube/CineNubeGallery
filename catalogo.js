// catalogo.js — versión estable + corregida (Tendencias OK)

// URL hoja (la tuya)
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");

let items = [];
let activeFilter = "all";

/* -----------------------------
   HELPERS
----------------------------- */
function safeParseSeasonLinks(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch(e){}
    return [];
}

function extractTeraboxLink(raw) {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
    } catch(e){}
    const match = String(raw || "").match(/https?:\/\/[^\s"]+/);
    return match ? match[0] : "";
}

function shortTitle(title) {
    if (!title) return "";
    return title.length > 50 ? title.substring(0,47)+"..." : title;
}

/* Nuevo: obtener enlace "inteligente" que prioriza season_links (series) y después terabox */
function obtenerEnlaceInteligente(item) {
    // 1) Si tiene season_links y es JSON -> parsear y buscar link o episodio
    const rawSeasons = item.season_links || item.seasonLinks || "";
    if (rawSeasons) {
        const seasons = safeParseSeasonLinks(rawSeasons);
        if (seasons.length) {
            // priorizar primer episodio con link en la primera temporada que tenga
            for (let s of seasons) {
                if (Array.isArray(s.episodes) && s.episodes.length) {
                    // episodio -> tomar su link
                    const epLink = s.episodes[0].link || s.episodes[0].dlink || "";
                    if (epLink) return epLink;
                }
                // si la temporada tiene 'link' directo (carpeta terabox)
                if (s.link && String(s.link).indexOf("http") === 0) return s.link;
            }
        }
    }

    // 2) Si no hay season_links con enlaces, intentar terabox / link / enlace / enlace general
    return extractTeraboxLink(item.terabox || item.link || item.enlace || "");
}

/* =============================
   OCULTAR SECCIONES
============================= */
function updateSectionsVisibility() {
    const show = activeFilter === "all";

    const bn = document.getElementById("bienvenida");
    const td = document.getElementById("tendencias");
    const pop = document.getElementById("populares");
    const t10 = document.getElementById("top10");

    if (bn) bn.style.display = show ? "" : "none";
    if (td) td.style.display = show ? "" : "none";
    if (pop) pop.style.display = show ? "" : "none";
    if (t10) t10.style.display = show ? "" : "none";
}

/* =============================
   FETCH DATA
============================= */
async function fetchData() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error al cargar Google Sheet");

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Formato inválido");

        items = data.sort((a,b) => ( (b.published_ts||0) - (a.published_ts||0) ));

        render(items);
        renderTendencias(items);
        renderPopulares(items);
        renderTop10(items);

    } catch (e) {
        console.error("Error cargando hoja:", e);
        if (container) container.innerHTML = "<div class='empty'>Error al cargar los datos</div>";
        const t = document.getElementById("tendenciasList"); if (t) t.innerHTML = "<p class='empty'>Error</p>";
        const p = document.getElementById("popularesList"); if (p) p.innerHTML = "<p class='empty'>Error</p>";
        const tt = document.getElementById("top10List"); if (tt) tt.innerHTML = "<p class='empty'>Error</p>";
    }
}

/* =============================
   RENDER PRINCIPAL
============================= */
function render(list) {
    if (!container) return;

    const q = (searchInput?.value || "").toLowerCase().trim();

    const filtered = list.filter(i => {
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

    filtered.forEach(item => {
        const card = document.createElement("article");
        card.className = "card";

        const mc = document.createElement("div");
        mc.className = "movie-card";

        const pw = document.createElement("div");
        pw.className = "poster-wrap";

        const img = document.createElement("img");
        img.className = "poster";
        img.alt = item.title || "";
        img.src = item.poster || item.portada || "https://via.placeholder.com/600x900?text=No+Image";

        const play = document.createElement("div");
        play.className = "play-overlay";
        play.innerHTML = '<i class="fa-solid fa-play"></i>';

        const fade = document.createElement("div");
        fade.className = "poster-bottom-fade";

        pw.appendChild(img);
        pw.appendChild(fade);
        pw.appendChild(play);
        mc.appendChild(pw);

        const info = document.createElement("div");
        info.className = "card-info";

        const titleRow = document.createElement("div");
        titleRow.className = "title-row";

        const titleEl = document.createElement("div");
        titleEl.className = "movie-title";
        titleEl.textContent = shortTitle(item.title || "");

        const ratingEl = document.createElement("div");
        ratingEl.className = "rating";
        ratingEl.textContent = item.rating || item.vote_average || "N/A";

        titleRow.appendChild(titleEl);
        titleRow.appendChild(ratingEl);

        const metaRow = document.createElement("div");
        metaRow.className = "movie-meta";
        const year = item.year || "";
        const genres = item.generos || "";
        metaRow.textContent = `${year}${genres ? " • " + genres : ""}`;

        info.appendChild(titleRow);
        info.appendChild(metaRow);
        mc.appendChild(info);

        // Serie: temporadas
        if (String(item.type).toLowerCase() === "series") {
            const seasons = safeParseSeasonLinks(item.season_links);
            if (seasons.length) {
                const seasonRow = document.createElement("div");
                seasonRow.className = "season-row";

                seasons.forEach(s => {
                    const sd = document.createElement("div");
                    sd.className = "season";

                    const numSpan = document.createElement("span");
                    numSpan.className = "season-number";
                    numSpan.textContent = s.season || "?";
                    sd.appendChild(numSpan);

                    const hasEps = Array.isArray(s.episodes) && s.episodes.length;
                    const hasLink = !!s.link;

                    if (hasEps || hasLink) {
                        sd.classList.add("season-free");
                        sd.onclick = () => {
                            if (hasEps) {
                                const epLink = s.episodes[0].link || s.episodes[0].dlink || "";
                                if (epLink) window.open(epLink, "_blank");
                                return;
                            }
                            if (hasLink) window.open(s.link, "_blank");
                        };
                    } else {
                        sd.classList.add("season-vip");
                        const badge = document.createElement("span");
                        badge.className = "badge";
                        badge.textContent = "VIP";
                        sd.appendChild(badge);
                        sd.onclick = () => window.open("https://t.me/movfrezon", "_blank");
                    }
                    seasonRow.appendChild(sd);
                });
                mc.appendChild(seasonRow);
            }
        }

        // click poster (ahora para las películas va a exe.io)
        if (item.type === "movie") {
            const link = obtenerEnlaceInteligente(item);
            const exeLink = `https://exe.io/api?api=eb74818dfc07b8fd688d1a517234e5479a082193&url=${encodeURIComponent(link)}`;
            mc.onclick = () => window.open(exeLink, "_blank");
        } else {
            mc.onclick = () => window.open(item.link || item.enlace || "https://cinenube.pages.dev", "_blank");
        }

        frag.appendChild(card);
    });

    container.appendChild(frag);
}

/* =============================
   FILTROS (FÍLTROS SELECCIONADOS)
============================= */
searchInput.addEventListener("input", () => fetchData());

filterButtons.forEach(button => {
    button.addEventListener("click", (e) => {
        activeFilter = e.target.dataset.filter || "all";
        updateSectionsVisibility();
        fetchData();
    });
});

fetchData();
