// catalogo.js — versión corregida con enlaces únicos para cada película/serie

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
// RENDER PRINCIPAL
// -----------------------------
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

        // ⭐ Nuevo: generar slug para URL
        const slug = (item.title || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        card.setAttribute('data-slug', slug);

        // IMAGEN
        const img = document.createElement("img");
        img.src = item.poster || "https://via.placeholder.com/300x450?text=No+Image";
        img.className = "poster";
        card.appendChild(img);

        // CONTENIDO
        const c = document.createElement("div");
        c.className = "card-content";

        const h2 = document.createElement("h2");
        h2.textContent = item.title || "";
        c.appendChild(h2);

        const ov = document.createElement("p");
        ov.className = "overview";
        ov.textContent = item.overview || "";
        c.appendChild(ov);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `⭐ ${item.rating || "N/A"} | 📅 ${item.year || ""}`;
        c.appendChild(meta);

        const votes = document.createElement("div");
        votes.className = "votes";
        votes.innerHTML = `<span>👍 ${item.votes_up || 0}</span> <span>👎 ${item.votes_down || 0}</span>`;
        c.appendChild(votes);

        // SERIES → TODAS LAS TEMPORADAS
        if (item.type === "series") {
            const seasons = Array.isArray(item.season_links) ? item.season_links : [];
            seasons.forEach((s) => {
                const row = document.createElement("div");
                row.className = "season-row";
                const label = document.createElement("span");
                label.textContent = "T" + s.season + ": ";
                row.appendChild(label);

                const btn = document.createElement("a");
                btn.href = s.link || "#"; // si no hay link puede estar vacío
                btn.target = "_blank";
                btn.className = "btn";
                btn.textContent = s.link ? "Ver temporada completa" : "🔒 Sin link";
                row.appendChild(btn);
                c.appendChild(row);
            });
        }

        // MOVIES → botón normal
        if (item.type === "movie") {
            const link = extractTeraboxLink(item.terabox);
            if (link) {
                const btn = document.createElement("a");
                btn.href = link;
                btn.target = "_blank";
                btn.className = "btn";
                btn.textContent = "Ver ahora";
                c.appendChild(btn);
            }
        }

        card.appendChild(c);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// -----------------------------
// EXTRAER LINK TERABOX
// -----------------------------
function extractTeraboxLink(raw) {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].link) {
            return parsed[0].link;
        }
    } catch (e) {}
    return raw;
}

// -----------------------------
// FILTROS Y BUSCADOR
// -----------------------------
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

// -----------------------------
// Scroll automático por hash (slug)
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const targetCard = document.querySelector(`.card[data-slug="${hash}"]`);
    if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetCard.style.transition = "0.5s";
        targetCard.style.boxShadow = "0 0 20px #7b4fff"; // opcional: resaltar
    }
});

// -----------------------------
// TELEGRAM → enlaces únicos
function sendTelegram(item, modoActualizacion) {
    if (!item?.type) return false;
    modoActualizacion = !!modoActualizacion;

    var topic = normalize(item.type) === "movie" ? TELEGRAM_TOPIC_PELICULAS : TELEGRAM_TOPIC_SERIES;
    var idiomaText = item.Idioma ? "[" + item.Idioma + "] " : "";
    var hashtags = formatHashtags(item.generos);
    var mensaje = "";

    let votosTxt = "⭐ <b>" + (item.vote_average || "N/A") + "</b> | (" + (item.vote_count || 0) + " votos)\n" +
                   "👍 " + (item.votes_up || 0) + " 👎 " + (item.votes_down || 0) + "\n\n";

    if (modoActualizacion) {
        mensaje += "📢 <b>NUEVA ACTUALIZACIÓN</b>\n\n" +
                   "🎬 <b>" + escapeHTML(item.title || "") + "</b>\n\n" +
                   votosTxt + "Se añadieron nuevos episodios.\n\n";
    } else {
        let sinopsis = resumenInteligente(item.overview || "");
        mensaje += "🎬 <b>" + escapeHTML(idiomaText + (item.title || "")) + "</b>\n\n" +
                   escapeHTML(sinopsis) + "\n\n" + votosTxt;
    }

    // TEMPORADAS (series)
    var seasons = cleanSeasonLinks(item.season_links);
    if (seasons.length && normalize(item.type) === "series") {
        seasons.forEach(function(s) {
            mensaje += "📺 Temporada " + s.season + "\n";
            if (Array.isArray(s.episodes)) {
                s.episodes.forEach(function(ep) {
                    mensaje += " • Cap " + ep.episode + ' (<a href="' + ep.link + '">Ver</a>)\n';
                });
            } else if (s.link) {
                mensaje += ' • (<a href="' + s.link + '">Ver</a>)\n';
            }
        });
    }

    // LINK DE PELÍCULA
    if (normalize(item.type) === "movie") {
        let link = extractMovieLink(item.terabox);
        if (link) {
            mensaje += '\n🎥 <b><a href="' + link + '">Ver ahora</a></b>\n';
        }
    }

    // ⭐ Nuevo: enlace directo a slug
    const slug = (item.title || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    mensaje += `\n🌐 <a href="https://cinenube.github.io/CineNubeGallery/#${slug}">Ver más en CineNube</a>`;

    if (hashtags) mensaje += "\n\n" + hashtags;

    var payload = item.poster ? 
        { chat_id: TELEGRAM_CHANNEL_ID, message_thread_id: topic, photo: item.poster, caption: mensaje, parse_mode: "HTML" } :
        { chat_id: TELEGRAM_CHANNEL_ID, message_thread_id: topic, text: mensaje, parse_mode: "HTML" };

    var endpoint = item.poster ? "sendPhoto" : "sendMessage";

    try {
        var res = UrlFetchApp.fetch(
            "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/" + endpoint,
            { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true }
        );
        return JSON.parse(res.getContentText()).ok;
    } catch(e) {
        Logger.log("Error Telegram: " + e);
        return false;
    }
}
