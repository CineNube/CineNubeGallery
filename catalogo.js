document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";
    const gallery = document.getElementById("gallery");
    const searchInput = document.getElementById("search");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let allItems = [];

    // 🔧 CORRECCIÓN: Convertir "8,4" en 8.4 para que JS lo lea correctamente
    function fixNumber(n) {
        if (!n) return 0;
        return Number(String(n).replace(",", "."));
    }

    // Cargar catálogo desde Apps Script
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            allItems = data;
            renderItems(allItems);
        })
        .catch(error => {
            console.error("Error cargando datos:", error);
            gallery.innerHTML = "<p>Error al cargar los títulos</p>";
        });

    // Renderizar items
    function renderItems(items) {
        gallery.innerHTML = "";

        items.forEach(item => {
            // 🔧 CORRECCIÓN: leer votaciones reales
            const voteAverage = fixNumber(item.vote_average);
            const voteCount = fixNumber(item.vote_count);
            const votesUp = fixNumber(item.votes_up);
            const votesDown = fixNumber(item.votes_down);

            // Crear tarjeta
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <img src="${item.poster}" class="poster" alt="${item.title}">
                <h3 class="title">${item.title}</h3>
                <p class="year">⭐ ${voteAverage} | 📅 ${item.year || "N/A"}</p>
                <p class="votes">👍 ${votesUp} &nbsp; 👎 ${votesDown}</p>
            `;

            // Botón de película
            if (item.type === "movie") {
                card.innerHTML += `
                    <a href="${item.terabox}" target="_blank" class="btn-view">Ver película</a>
                `;
            }

            // Botón de serie
            if (item.type === "series") {
                if (item.terabox) {
                    card.innerHTML += `
                        <a href="${item.terabox}" target="_blank" class="btn-view">Ver serie</a>
                    `;
                }
            }

            gallery.appendChild(card);
        });
    }

    // Búsqueda
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtered = allItems.filter(item =>
            item.title.toLowerCase().includes(query)
        );
        renderItems(filtered);
    });

    // Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;

            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            if (filter === "all") {
                renderItems(allItems);
            } else {
                const filtered = allItems.filter(item => item.type === filter);
                renderItems(filtered);
            }
        });
    });
});
