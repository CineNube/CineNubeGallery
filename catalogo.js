// ================================
//   CARGAR DATOS DESDE GOOGLE SHEETS
// ================================
async function cargarCatalogo() {
    const url = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec"; // <-- CAMBIA ESTO

    const res = await fetch(url);
    const data = await res.json();

    return data;
}

// ================================
//   RENDER DEL CATÁLOGO
// ================================
function render(items) {
    const cont = document.getElementById("catalogo");
    cont.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        // Poster
        const posterDiv = document.createElement("div");
        posterDiv.className = "poster";
        posterDiv.innerHTML = `<img src="${item.poster}" />`;

        // Contenido
        const content = document.createElement("div");
        content.className = "card-content";

        content.innerHTML = `
            <h2>${item.title}</h2>
            <p class="overview">${item.overview}</p>
        `;

        // Película
        if (item.type === "movie") {
            const link = document.createElement("a");
            link.className = "btn";
            link.href = item.link;
            link.target = "_blank";
            link.textContent = "Ver Película";
            content.appendChild(link);
        }

        // Series
        if (item.type === "series") {
            if (Array.isArray(item.season_links)) {
                item.season_links.forEach(temp => {
                    const row = document.createElement("div");
                    row.className = "season-block";

                    const label = document.createElement("span");
                    label.className = "season-label";
                    label.textContent = "T" + temp.season + ":";
                    row.appendChild(label);

                    const epsRow = document.createElement("span");
                    epsRow.className = "episode-row";

                    temp.episodes.forEach(ep => {
                        const btn = document.createElement("a");
                        btn.href = ep.link;
                        btn.target = "_blank";
                        btn.className = "btn eps";
                        btn.textContent = ep.episode;

                        // ⭐ Episodio visto
                        if (localStorage.getItem("visto_" + ep.link)) {
                            btn.classList.add("episode-viewed");
                        }

                        btn.addEventListener("click", () => {
                            localStorage.setItem("visto_" + ep.link, "1");
                            btn.classList.add("episode-viewed");
                        });

                        epsRow.appendChild(btn);
                    });

                    row.appendChild(epsRow);
                    content.appendChild(row);
                });
            }
        }

        card.appendChild(posterDiv);
        card.appendChild(content);

        cont.appendChild(card);
    });
}

// ================================
//   BÚSQUEDA GLOBAL
// ================================
function activarBuscador(items) {
    const input = document.getElementById("searchInput");
    const filterBtns = document.querySelectorAll("#filterButtons button");

    let tipo = "all";

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            tipo = btn.dataset.type;
            filtrar();
        });
    });

    input.addEventListener("input", filtrar);

    function filtrar() {
        const t = input.value.toLowerCase();

        const filtrado = items.filter(p => {
            const coincide = p.title.toLowerCase().includes(t);

            if (!coincide) return false;

            if (tipo === "all") return true;
            if (tipo === "movie" && p.type === "movie") return true;
            if (tipo === "series" && p.type === "series") return true;

            return false;
        });

        render(filtrado);
    }
}

// ================================
//   INICIO
// ================================
cargarCatalogo().then(items => {
    render(items);
    activarBuscador(items);
});
