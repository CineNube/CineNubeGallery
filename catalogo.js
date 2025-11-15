const API_URL = "https://script.google.com/macros/s/AKfycbx1Vq5HqmPMExtgm1PRgct2WRzGex5BTEtDERIKHA20VZNFf-umdHpiKD94Df80S2vO1g/exec"; // Pon aquí el URL de tu WebApp de Sheets

let items = [];

async function fetchItems() {
  try {
    const res = await fetch(API_URL);
    items = await res.json();

    if (!Array.isArray(items)) throw new Error("Formato JSON inválido");

    renderGallery(items);
  } catch (err) {
    document.getElementById("gallery-container").innerHTML = `<div class="error">Error al cargar los títulos</div>`;
    console.error(err);
  }
}

function renderGallery(data) {
  const container = document.getElementById("gallery-container");
  container.innerHTML = "";

  // Orden descendente por published_ts
  data.sort((a,b) => b.published_ts - a.published_ts);

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    const poster = document.createElement("img");
    poster.src = item.poster || "";
    poster.alt = item.title;

    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const overview = document.createElement("div");
    overview.className = "overview";
    overview.textContent = item.overview || "";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `⭐ ${item.rating || "N/A"} | 📅 ${item.year || ""}`;

    const votes = document.createElement("div");
    votes.className = "votes";
    votes.textContent = `👍 ${item.votes_up || 0} 👎 ${item.votes_down || 0}`;

    info.appendChild(title);
    info.appendChild(overview);
    info.appendChild(meta);
    info.appendChild(votes);

    const btns = document.createElement("div");

    if(item.type === "movie" && item.terabox) {
      const watchBtn = document.createElement("a");
      watchBtn.href = item.terabox;
      watchBtn.target = "_blank";
      watchBtn.className = "btn";
      watchBtn.textContent = "Ver ahora";
      btns.appendChild(watchBtn);
    }

    if(item.type === "series" && Array.isArray(item.season_links)) {
      item.season_links.forEach(s => {
        const seasonBtn = document.createElement("a");
        seasonBtn.href = s.link || "#";
        seasonBtn.target = "_blank";
        seasonBtn.className = "btn season-btn" + (!s.link ? " disabled" : "");
        seasonBtn.textContent = `Temporada ${s.season}`;
        btns.appendChild(seasonBtn);
      });
    }

    card.appendChild(poster);
    card.appendChild(info);
    card.appendChild(btns);

    container.appendChild(card);
  });
}

// Filtros
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if(type === "all") renderGallery(items);
    else renderGallery(items.filter(i => i.type === type));
  });
});

// Buscador
document.getElementById("search-input").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  renderGallery(items.filter(i => i.title.toLowerCase().includes(term)));
});

// Inicial
fetchItems();
