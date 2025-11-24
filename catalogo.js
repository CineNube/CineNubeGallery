const SHEET_JSON_URL = "TU_URL_DEL_SCRIPT";

const container = document.getElementById('catalogo');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filterButtons button');

let items = [];
let activeFilter = 'all';

function normalize(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

/* EPISODIOS VISTOS */
function markEpisodeWatched(season, episode, title) {
  localStorage.setItem(`watched_${title}_s${season}_e${episode}`, "1");
}

function isEpisodeWatched(season, episode, title) {
  return localStorage.getItem(`watched_${title}_s${season}_e${episode}`) === "1";
}

/* FAVORITOS */
function toggleFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  favs[title] = !favs[title];
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  return !!favs[title];
}

/* FETCH */
async function fetchData() {
  try {
    const res = await fetch(SHEET_JSON_URL);
    const data = await res.json();

    items = data.sort((a,b)=> (b.published_ts||0)-(a.published_ts||0));

    render(items);

  } catch(e) {
    container.innerHTML = `<div class="empty">Error al cargar</div>`;
  }
}

/* RENDER */
function render(list) {
  const q = normalize((searchInput.value||"").toLowerCase());

  const filtered = list.filter(i=>{
    if(activeFilter !== "all" && i.type !== activeFilter) return false;

    const title = normalize((i.title||"").toLowerCase());

    return title.includes(q);
  });

  container.innerHTML = "";

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const posterWrap = document.createElement("div");
    posterWrap.className = "poster";

    const img = document.createElement("img");
    img.src = item.poster.replace("w600_and_h900_bestv2","w300_and_h450_bestv2");
    posterWrap.appendChild(img);

    card.appendChild(posterWrap);

    const content = document.createElement("div");
    content.className = "card-content";

    const h2 = document.createElement("h2");
    h2.textContent = item.title;
    content.appendChild(h2);

    /* FAVORITO */
    const favBtn = document.createElement("div");
    favBtn.className = "fav-btn";
    favBtn.textContent = isFavorite(item.title) ? "⭐" : "☆";
    favBtn.onclick = ()=>{
      toggleFavorite(item.title);
      favBtn.textContent = isFavorite(item.title)? "⭐":"☆";
    };
    content.appendChild(favBtn);

    const ov = document.createElement("p");
    ov.className = "overview";
    ov.textContent = item.overview;
    content.appendChild(ov);

    /* SERIES */
    if(item.type === "series") {
      const seasons = Array.isArray(item.season_links) ? item.season_links : [];
      
      seasons.forEach(s => {
        const row = document.createElement("div");
        row.className = "season-block";

        const label = document.createElement("span");
        label.className = "season-label";
        label.textContent = "T" + s.season + ": ";
        row.appendChild(label);

        const epsRow = document.createElement("span");
        epsRow.className = "episode-row";

        s.episodes.forEach(ep => {
          const epBtn = document.createElement("a");
          epBtn.href = ep.link;
          epBtn.target = "_blank";
          epBtn.className = "btn eps";

          epBtn.textContent = ep.episode;

          if(isEpisodeWatched(s.season, ep.episode, item.title)) {
            epBtn.classList.add("episode-viewed");
          }

          epBtn.addEventListener("click", () => {
            markEpisodeWatched(s.season, ep.episode, item.title);
            epBtn.classList.add("episode-viewed");
          });

          epsRow.appendChild(epBtn);
        });

        row.appendChild(epsRow);
        content.appendChild(row);
      });
    }

    card.appendChild(content);
    container.appendChild(card);
  });
}

/* EVENTOS */
searchInput.addEventListener("input", ()=> render(items));

filterButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    filterButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.type;
    render(items);
  });
});

fetchData();
