// catalogo.js — versión con enlace inteligente para películas (incluyendo exe.io)

// URL de la hoja (ajusta esta URL a la tuya)
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");

let items = [];
let activeFilter = "all";

// Función para obtener el enlace inteligente
function obtenerEnlaceInteligente(item) {
    // Si es serie, buscar en season_links primero
    const rawSeasons = item.season_links || item.seasonLinks || "";
    if (rawSeasons) {
        const seasons = safeParseSeasonLinks(rawSeasons);
        if (seasons.length) {
            for (let s of seasons) {
                if (Array.isArray(s.episodes) && s.episodes.length) {
                    const epLink = s.episodes[0].link || s.episodes[0].dlink || "";
                    if (epLink) return epLink;
                }
                if (s.link && String(s.link).indexOf("http") === 0) return s.link;
            }
        }
    }

    // Si no es serie o no tiene season_links, buscar en los enlaces de la película (exe.io, etc)
    const link = item.terabox || item.link || item.enlace || "";
    if (link) {
        // Asegurarse de que el enlace contenga 'exe.io' o redirigir a la URL de descarga
        const match = link.match(/https?:\/\/(exe\.io|[a-zA-Z0-9\-\.]+)([^\s]*)/);
        if (match) return match[0]; // Retorna el enlace exe.io o cualquier otro enlace válido
    }

    // Si no hay enlaces adecuados, regresar la URL por defecto
    return "https://cinenube.pages.dev";
}

// Función para procesar datos de temporada (si es serie)
function safeParseSeasonLinks(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch(e){}
    return [];
}

// Función para renderizar los datos
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
        titleEl.textContent = item.title || "Sin título";

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

        // Manejo de enlace al hacer clic (película o serie)
        if (item.type === "movie") {
            const link = obtenerEnlaceInteligente(item);
            pw.onclick = () => window.open(link, "_blank");
        } else if (item.type === "series") {
            pw.onclick = () => {
                const seasons = safeParseSeasonLinks(item.season_links);
                for (let s of seasons) {
                    if (Array.isArray(s.episodes) && s.episodes[0]?.link) {
                        window.open(s.episodes[0].link, "_blank");
                        return;
                    }
                    if (s.link) {
                        window.open(s.link, "_blank");
                        return;
                    }
                }
                window.open("https://t.me/movfrezon", "_blank");
            };
        }

        card.appendChild(mc);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// Función para buscar y filtrar resultados
if (searchInput) searchInput.addEventListener("input", () => render(items));

if (filterButtons) {
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            activeFilter = btn.dataset.type || "all";
            render(items);
        });
    });
}

// Cargar los datos
async function fetchData() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) loadingElement.style.display = "block"; // Mostrar mensaje de carga

    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error al cargar los datos desde la hoja.");

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Formato de datos inválido.");

        console.log("Datos cargados correctamente:", data);
        items = data;

        render(items);

    } catch (e) {
        console.error("Error cargando los datos:", e);
        container.innerHTML = "<div class='empty'>Error al cargar los datos</div>";
    } finally {
        if (loadingElement) loadingElement.style.display = "none"; // Ocultar mensaje de carga
    }
}

// Iniciar la carga de datos
fetchData();
