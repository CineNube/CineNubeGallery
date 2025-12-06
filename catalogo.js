//------------------------------------------------------------
// Cargar datos desde Google Sheets
//------------------------------------------------------------
document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
    try {
        const respuesta = await fetch(
            "https://opensheet.elk.sh/1o6IuSEgLP1KhLZq49j6ZyuegFCLmPdVs_pr-JOpPFMs/Hoja1"
        );
        const datos = await respuesta.json();

        window.catalogoData = datos;

        renderCatalogo(datos);
        renderTendencias(datos);
        renderPopulares(datos);
        renderTop10(datos);

        console.log("Datos cargados correctamente.");
    } catch (e) {
        console.error("Error cargando hoja:", e);
    }
}

//------------------------------------------------------------
// RENDER PRINCIPAL (CATÁLOGO COMPLETO)
//------------------------------------------------------------
function renderCatalogo(datos) {
    const cont = document.getElementById("catalogo");
    if (!cont) return;

    cont.innerHTML = "";

    datos.forEach(item => {
        const card = crearCard(item);
        cont.appendChild(card);
    });
}

//------------------------------------------------------------
// TENDENCIAS = items actualizados "HOY"
// usa el campo "updated" de tu hoja
//------------------------------------------------------------
function renderTendencias(data) {
    const box = document.getElementById("tendenciasList");
    if (!box) return;

    let hoy = new Date().toISOString().slice(0, 10);
    let lista = data.filter(i => (i.updated || "").startsWith(hoy));

    if (lista.length === 0) {
        box.innerHTML = "<p>Hoy no hay estrenos nuevos</p>";
        return;
    }

    box.innerHTML = "";
    lista.slice(0, 12).forEach(item => box.appendChild(crearCard(item)));
}

//------------------------------------------------------------
// POPULARES = rating más alto (top 12)
//------------------------------------------------------------
function renderPopulares(data) {
    const box = document.getElementById("popularesList");
    if (!box) return;

    let lista = [...data]
        .sort((a, b) => (parseFloat(b.rating || 0) - parseFloat(a.rating || 0)))
        .slice(0, 12);

    box.innerHTML = "";
    lista.forEach(item => box.appendChild(crearCard(item)));
}

//------------------------------------------------------------
// TOP 10 = basado en "vote_average" o rating
//------------------------------------------------------------
function renderTop10(data) {
    const box = document.getElementById("top10List");
    if (!box) return;

    let lista = [...data]
        .sort((a, b) => (parseFloat(b.vote_average || b.rating || 0) - parseFloat(a.vote_average || a.rating || 0)))
        .slice(0, 10);

    box.innerHTML = "";

    lista.forEach((item, index) => {
        let fila = document.createElement("div");
        fila.className = "top10-item";

        fila.innerHTML = `
            <span class="pos">${index + 1}</span>
            <img src="${item.poster}" loading="lazy">
            <span class="title">${item.title}</span>
            <span class="score">⭐ ${item.vote_average || item.rating}</span>
        `;

        box.appendChild(fila);
    });
}

//------------------------------------------------------------
// CREAR CARD DE CATÁLOGO (PELIS/SERIES)
//------------------------------------------------------------
function crearCard(item) {
    let div = document.createElement("div");
    div.className = "item-card";

    let isVIP = !item.terabox || item.terabox.trim() === "";
    let vipBadge = isVIP ? `<div class="vip-badge">VIP</div>` : "";
    let enlace = isVIP ? "#" : item.terabox;

    div.innerHTML = `
        <div class="poster">
            <img src="${item.poster}" loading="lazy">
            ${vipBadge}
            <a href="${enlace}" target="_blank" class="play-btn">
                <i class="fa-solid fa-play"></i>
            </a>
        </div>
        <h4>${item.title}</h4>
        <span class="year">${item.year}</span>
    `;

    return div;
}
