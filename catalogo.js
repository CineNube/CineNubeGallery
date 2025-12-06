// ==========================================
//   CARGAR BASE DE DATOS DESDE GOOGLE SHEETS
// ==========================================

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec"; 
// ejemplo:
// "https://opensheet.elk.sh/ID/Hoja1"

let DATA = [];

// ==========================
//    CARGAR DATOS
// ==========================
async function cargarDatos() {
    try {
        const res = await fetch(SHEET_URL);
        DATA = await res.json();

        renderCatalogo(DATA);       // catálogo normal
        renderTendencias(DATA);     // publicado hoy
        renderPopulares(DATA);      // más votadas
        renderTop10(DATA);          // mejor valoradas
    } 
    catch (e) {
        console.error("Error cargando hoja:", e);
    }
}

document.addEventListener("DOMContentLoaded", cargarDatos);

// ==========================================
//   RENDERIZAR CATÁLOGO PRINCIPAL
// ==========================================
function renderCatalogo(lista) {
    const cont = document.getElementById("catalogo");
    cont.innerHTML = "";

    if (!lista.length) {
        cont.innerHTML = `<div class="empty">No hay contenido disponible.</div>`;
        return;
    }

    lista.forEach(item => {
        cont.innerHTML += `
        <div class="movie-card">
            <div class="poster-wrap">
                <img class="poster" src="${item.poster}" alt="${item.title}">
                <div class="poster-bottom-fade"></div>
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="card-info">
                <div class="title-row">
                    <div class="movie-title">${item.title}</div>
                    <div class="rating">${item.vote_average || "?"}</div>
                </div>
                <div class="movie-meta">
                    <span>${item.year}</span>
                    <span>•</span>
                    <span>${item.generos}</span>
                </div>
            </div>
        </div>`;
    });
}

// ==========================================
//   SECCIÓN: TENDENCIAS (publicado hoy)
// ==========================================
function renderTendencias(data) {
    const hoy = new Date().toISOString().slice(0,10);
    const tendencias = data.filter(i => i.published_at === hoy);

    const box = document.getElementById("tendencias-list");
    const empty = document.getElementById("tendencias-empty");

    if (tendencias.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    tendencias.forEach(item => {
        box.innerHTML += cardHTML(item);
    });
}

// ==========================================
//   SECCIÓN: POPULARES (más votadas)
// ==========================================
function renderPopulares(data) {
    const ordenadas = [...data]
        .filter(i => i.vote_count)
        .sort((a,b) => b.vote_count - a.vote_count)
        .slice(0, 12);

    const box = document.getElementById("populares-list");
    const empty = document.getElementById("populares-empty");

    if (!ordenadas.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    ordenadas.forEach(item => {
        box.innerHTML += cardHTML(item);
    });
}

// ==========================================
//   SECCIÓN: TOP 10 (mejor valoradas)
// ==========================================
function renderTop10(data) {
    const ordenadas = [...data]
        .filter(i => i.vote_average)
        .sort((a,b) => b.vote_average - a.vote_average)
        .slice(0,10);

    const box = document.getElementById("top10-list");
    const empty = document.getElementById("top10-empty");

    if (!ordenadas.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    ordenadas.forEach(item => {
        box.innerHTML += cardHTML(item);
    });
}

// ==========================================
//   PLANTILLA DE CARD (reutilizable)
// ==========================================
function cardHTML(item) {
    return `
    <div class="movie-card">
        <div class="poster-wrap">
            <img class="poster" src="${item.poster}" alt="${item.title}">
            <div class="poster-bottom-fade"></div>
            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
        </div>
        <div class="card-info">
            <div class="title-row">
                <div class="movie-title">${item.title}</div>
                <div class="rating">${item.vote_average || "?"}</div>
            </div>
            <div class="movie-meta">
                <span>${item.year}</span>
                <span>•</span>
                <span>${item.generos}</span>
            </div>
        </div>
    </div>`;
}
