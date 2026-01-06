// catalogo.js — versión revisada para depurar el error de "Cargando contenido"

// URL de la hoja (ajusta esta URL a la tuya)
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll("#filterButtons button");

let items = [];
let activeFilter = "all";

// Fetch los datos desde la URL
async function fetchData() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) loadingElement.style.display = "block"; // Mostrar mensaje de carga

    try {
        const res = await fetch(SHEET_JSON_URL);
        if (!res.ok) throw new Error("Error al cargar los datos desde la hoja.");

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Formato de datos inválido.");

        console.log("Datos cargados correctamente:", data); // Verifica los datos aquí
        items = data;

        render(items);

    } catch (e) {
        console.error("Error cargando los datos:", e);
        container.innerHTML = "<div class='empty'>Error al cargar los datos</div>";
    } finally {
        if (loadingElement) loadingElement.style.display = "none"; // Ocultar mensaje de carga
    }
}

// Renderiza el contenido
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

        pw.appendChild(img);
        mc.appendChild(pw);

        const info = document.createElement("div");
        info.className = "card-info";

        const titleRow = document.createElement("div");
        titleRow.className = "title-row";

        const titleEl = document.createElement("div");
        titleEl.className = "movie-title";
        titleEl.textContent = item.title || "Sin título";

        titleRow.appendChild(titleEl);

        info.appendChild(titleRow);
        mc.appendChild(info);
        card.appendChild(mc);
        frag.appendChild(card);
    });

    container.appendChild(frag);
}

// Filtros de búsqueda
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

// Iniciar la carga de datos
fetchData();
