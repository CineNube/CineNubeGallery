// Catalogo.js
const catalogoContainer = document.getElementById("catalogo");
let catalogoData = [];

async function fetchData() {
    try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbx1Vq5HqmPMExtgm1PRgct2WRzGex5BTEtDERIKHA20VZNFf-umdHpiKD94Df80S2vO1g/exec");
        catalogoData = await res.json();
        renderCatalog(catalogoData);
    } catch (err) {
        catalogoContainer.innerHTML = `<p>Error al cargar los títulos</p>`;
        console.error(err);
    }
}

function renderCatalog(data) {
    catalogoContainer.innerHTML = "";
    // Orden descendente por fecha publicada
    data.sort((a,b)=>b.published_ts - a.published_ts);
    
    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        // Imagen
        const img = document.createElement("img");
        img.src = item.poster;
        img.alt = item.title;
        card.appendChild(img);

        // Título
        const title = document.createElement("h2");
        title.textContent = item.title;
        card.appendChild(title);

        // Overview
        const overview = document.createElement("p");
        overview.textContent = item.overview;
        card.appendChild(overview);

        // Rating y año
        const info = document.createElement("p");
        info.innerHTML = `⭐ ${item.rating} | 📅 ${item.year}`;
        card.appendChild(info);

        // Votos
        const votes = document.createElement("p");
        votes.innerHTML = `👍 ${item.votes_up || 0} &nbsp; 👎 ${item.votes_down || 0}`;
        card.appendChild(votes);

        // Botón película o serie
        if(item.type === "movie") {
            if(item.terabox) {
                const btn = document.createElement("a");
                btn.href = item.terabox;
                btn.textContent = "Ver Película";
                btn.className = "btn";
                btn.target = "_blank";
                card.appendChild(btn);
            }
        } else if(item.type === "series") {
            // Si tiene season_links, mostrar cada temporada
            if(item.season_links && item.season_links.length > 0) {
                item.season_links.forEach(s => {
                    if(s.link) {
                        const tBtn = document.createElement("a");
                        tBtn.href = s.link;
                        tBtn.textContent = "Temporada " + s.season;
                        tBtn.className = "btn";
                        tBtn.target = "_blank";
                        card.appendChild(tBtn);
                    }
                });
            } 
            // Si no tiene season_links pero sí terabox, mostrar botón como película
            else if(item.terabox) {
                const btn = document.createElement("a");
                btn.href = item.terabox;
                btn.textContent = "Ver Serie";
                btn.className = "btn";
                btn.target = "_blank";
                card.appendChild(btn);
            }
        }

        catalogoContainer.appendChild(card);
    });
}

// Filtro de búsqueda
document.getElementById("searchInput").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    const filtered = catalogoData.filter(i => i.title.toLowerCase().includes(term));
    renderCatalog(filtered);
});

// Filtro de tipo
document.querySelectorAll("#filterButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const filtered = type === "all" ? catalogoData : catalogoData.filter(i => i.type === type);
        renderCatalog(filtered);
    });
});

// Inicializar
fetchData();
