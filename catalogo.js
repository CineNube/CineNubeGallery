document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
    const hojaID = "1uBEI3-HMZVotRfWv4Awl1koBslZxvnOteZ9grQjj748"; 
    const url = `https://opensheet.elk.sh/${hojaID}/1`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        // limpiamos
        document.getElementById("tendenciasRow").innerHTML = "";
        document.getElementById("popularRow").innerHTML = "";
        document.getElementById("top10Table").innerHTML = "";

        renderTendencias(data);
        renderPopular(data);
        renderTop10(data);
        renderCatalogo(data);
    } catch (err) {
        console.error("Error cargando hoja:", err);
    }
}

/* ==========================
   TENDENCIAS (mini-cards)
=========================== */
function renderTendencias(data) {
    const cont = document.getElementById("tendenciasRow");
    if (!cont) return;

    const hoy = data.filter(item => item.published_at && item.published_at.includes("2025"));

    if (hoy.length === 0) {
        cont.innerHTML = "<p class='empty'>Hoy no hay estrenos nuevos</p>";
        return;
    }

    hoy.forEach(item => cont.appendChild(miniCard(item)));
}

/* ==========================
   POPULAR (mini-cards)
=========================== */
function renderPopular(data) {
    const cont = document.getElementById("popularRow");
    if (!cont) return;

    // orden por visitas o rating si tienes
    const sorted = data.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 20);

    sorted.forEach(item => cont.appendChild(miniCard(item)));
}

/* ==========================
   TOP 10 MEJOR VALORADAS
=========================== */
function renderTop10(data) {
    const cont = document.getElementById("top10Table");
    if (!cont) return;

    const sorted = data
        .filter(i => i.vote_average)
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 10);

    sorted.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = "top10-item";

        div.innerHTML = `
            <span class="pos">${i + 1}</span>
            <img src="${item.poster}" />
            <span class="name">${item.title}</span>
            <span class="rate">${item.vote_average}</span>
        `;
        cont.appendChild(div);
    });
}

/* ==========================
   CATÁLOGO GENERAL (GRID)
=========================== */
function renderCatalogo(data) {
    const cont = document.getElementById("catalogo");
    cont.innerHTML = "";

    data.forEach(item => cont.appendChild(card(item)));
}

/* ==========================
   MINI-CARD (para secciones)
=========================== */
function miniCard(item) {
    const div = document.createElement("div");
    div.className = "mini-card";

    div.innerHTML = `
        <img src="${item.poster}" alt="${item.title}" />
        <div class="mini-info">
            <span class="mini-title">${item.title}</span>
            <span class="mini-meta">${item.year || ""}</span>
        </div>
    `;

    return div;
}

/* ==========================
   CARD NORMAL DEL CATÁLOGO
=========================== */
function card(item) {
    const div = document.createElement("div");
    div.className = "movie-card";

    const isSeries = item.season_links && item.season_links.trim() !== "";

    div.innerHTML = `
      <div class="poster-wrap">
        <img src="${item.poster}" class="poster" />
        <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
        <div class="poster-bottom-fade"></div>
      </div>

      <div class="card-info">
        <div class="title-row">
            <span class="movie-title">${item.title}</span>
            <span class="rating">${item.rating || "-"}</span>
        </div>

        <div class="movie-meta">
            <span>${item.year || ""}</span>
            <span>•</span>
            <span>${item.generos || ""}</span>
        </div>

        ${isSeries ? renderSeasons(item.season_links) : ""}
      </div>
    `;
    return div;
}

/* ==========================
   TEMPORADAS
=========================== */
function renderSeasons(json) {
    let seasons = [];
    try { seasons = JSON.parse(json); } catch {}

    if (!Array.isArray(seasons)) return "";

    return `
      <div class="season-row">
        ${seasons.map(s =>
            `<div class="season ${s.vip ? "season-vip" : ""}">
                ${s.vip ? `<div class="badge">VIP</div>` : ""}
                <span class="season-number">${s.season}</span>
            </div>`
        ).join("")}
      </div>
    `;
}
