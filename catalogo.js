// catalogo.js — versión mejorada y funcional
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

        // -----------------------------
        // SERIES → TODAS LAS TEMPORADAS
        // -----------------------------
        if (item.type === "series") {
            const seasons = Array.isArray(item.season_links) ? item.season_links : [];
            seasons.forEach((s) => {
                const row = document.createElement("div");
                row.className = "season-row";

                const label = document.createElement("span");
                label.textContent = "T" + s.season + ": ";
                row.appendChild(label);

                const btn = document.createElement("a");
                if (s.link || s.episodes) {
    btn.href = s.link || "#";
    btn.target = "_blank";
    btn.className = "btn eps";
    btn.textContent = "Ver temporada completa";
} else {
    btn.className = "btn eps vip-access";
    btn.href = "https://t.me/movfrezon";   // ← aquí VA tu página VIP / Telegram / Pago
    btn.target = "_blank";
    btn.textContent = "🔑 Acceso VIP – Solicitar temporada";
}

                row.appendChild(btn);
                c.appendChild(row);
            });
        }

        // -----------------------------
        // MOVIES → botón normal
        // -----------------------------
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
        if (Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
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
