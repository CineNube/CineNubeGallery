const SHEET_URL = "https://script.google.com/macros/s/tu_webapp_url/exec";
let catalog = [];
let filterType = "all";

async function fetchData() {
  try {
    const res = await fetch(SHEET_URL);
    catalog = await res.json();
    catalog.sort((a,b)=>b.published_ts - a.published_ts); // últimas primero
    renderCatalog();
  } catch (err) {
    document.getElementById("catalog").innerHTML = "<p>Error al cargar los títulos</p>";
  }
}

function renderCatalog() {
  const searchText = document.getElementById("search").value.toLowerCase();
  const container = document.getElementById("catalog");
  container.innerHTML = "";

  catalog
    .filter(item => {
      if(filterType !== "all" && item.type !== filterType) return false;
      if(searchText && !item.title.toLowerCase().includes(searchText)) return false;
      return true;
    })
    .forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = item.poster || "placeholder.jpg";
      img.alt = item.title;
      card.appendChild(img);

      const title = document.createElement("h3");
      title.textContent = item.title;
      card.appendChild(title);

      const overview = document.createElement("p");
      overview.textContent = item.overview;
      card.appendChild(overview);

      const rating = document.createElement("p");
      rating.innerHTML = `⭐ ${item.rating || "N/A"} | 📅 ${item.year || ""}`;
      card.appendChild(rating);

      // Botón: Películas
      if(item.type === "movie" && item.terabox) {
        const btn = document.createElement("a");
        btn.href = item.terabox;
        btn.textContent = "Ver Película";
        btn.className = "btn";
        btn.target = "_blank";
        card.appendChild(btn);
      }

      // Botón: Series
      if(item.type === "series") {
        const btn = document.createElement("a");
        btn.className = "btn";
        btn.target = "_blank";

        // Si tiene season_links, mostrar cada temporada
        if(item.season_links && item.season_links.length > 0) {
          item.season_links.forEach(s => {
            const tBtn = document.createElement("a");
            tBtn.href = s.link || "#";
            tBtn.textContent = "Temporada " + s.season;
            tBtn.className = "btn";
            tBtn.target = "_blank";
            card.appendChild(tBtn);
          });
        } 
        // Si no tiene season_links pero sí terabox, mostrar como película
        else if(item.terabox) {
          btn.href = item.terabox;
          btn.textContent = "Ver Serie";
          card.appendChild(btn);
        }
      }

      container.appendChild(card);
    });
}

document.getElementById("search").addEventListener("input", renderCatalog);
document.getElementById("btnAll").addEventListener("click", () => { filterType="all"; renderCatalog(); });
document.getElementById("btnMovies").addEventListener("click", () => { filterType="movie"; renderCatalog(); });
document.getElementById("btnSeries").addEventListener("click", () => { filterType="series"; renderCatalog(); });

fetchData();
