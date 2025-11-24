// catalogo.js mejorado con:
// ⭐ Sistema de capítulos vistos
// 🔔 Favoritos
// 🌓 Modo oscuro avanzado
// 📱 Optimización móvil
// 🎬 Render completo actualizado

const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById('catalogo');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filterButtons button');

let items = [];
let activeFilter = 'all';

// -----------------------------
// 📌 SISTEMA DE CAPÍTULOS VISTOS
// -----------------------------
function markEpisodeWatched(season, episode, title) {
  const key = `watched_${title}_s${season}_e${episode}`;
  localStorage.setItem(key, "1");
}

function isEpisodeWatched(season, episode, title) {
  const key = `watched_${title}_s${season}_e${episode}`;
  return localStorage.getItem(key) === "1";
}

// -----------------------------
// ⭐ FAVORITOS
// -----------------------------
function toggleFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  favs[title] = !favs[title];
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  return !!favs[title];
}

// -----------------------------
// FETCH DATA
// -----------------------------
async function fetchData() {
  try {
    const res = await fetch(SHEET_JSON_URL);
    if(!res.ok) throw new Error('Respuesta no OK');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('JSON inválido');
    items = data.sort((a,b)=> (b.published_ts||0) - (a.published_ts||0));
    render(items);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty">Error al cargar los títulos</div>`;
  }
}

// -----------------------------
// RENDER PRINCIPAL
// -----------------------------
function render(list) {
  const q = (searchInput.value||'').toLowerCase().trim();
  const filtered = list.filter(i=>{
    if(activeFilter !== 'all' && i.type !== activeFilter) return false;
    if(q && (!i.title || i.title.toLowerCase().indexOf(q)===-1)) return false;
    return true;
  });

  if(filtered.length === 0) {
    container.innerHTML = `<div class="empty">No hay títulos</div>`;
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  filtered.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';

    // Poster
    const posterWrap = document.createElement('div');
    posterWrap.className = 'poster';
    const img = document.createElement('img');
    img.src = item.poster || 'https://via.placeholder.com/300x450?text=No+Image';
    img.alt = item.title || '';
    posterWrap.appendChild(img);
    card.appendChild(posterWrap);

    // Content
    const content = document.createElement('div');
    content.className = 'card-content';

    const h2 = document.createElement('h2');
    h2.textContent = item.title || '';
    content.appendChild(h2);

    // FAVORITO ⭐
    const favBtn = document.createElement('div');
    favBtn.className = "fav-btn";
    favBtn.textContent = isFavorite(item.title) ? "⭐" : "☆";
    favBtn.onclick = () => {
      toggleFavorite(item.title);
      favBtn.textContent = isFavorite(item.title) ? "⭐" : "☆";
    };
    content.appendChild(favBtn);

    const ov = document.createElement('p');
    ov.className = 'overview';
    ov.textContent = item.overview || '';
    content.appendChild(ov);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `⭐ ${item.rating || 'N/A'} | 📅 ${item.year || ''}`;
    content.appendChild(meta);

    const votes = document.createElement('div');
    votes.className = 'votes';
    votes.innerHTML = `<span>👍 ${item.votes_up||0}</span> <span>👎 ${item.votes_down||0}</span>`;
    content.appendChild(votes);

    // -----------------------------
    // SERIES: TEMPORADAS + EPS
    // -----------------------------
    if(item.type === 'series') {
      const seasons = Array.isArray(item.season_links) ? item.season_links : [];

      if(seasons.length > 0) {
        seasons.forEach(seasonObj => {
          const row = document.createElement('div');
          row.className = "season-block";

          const label = document.createElement('span');
          label.className = "season-label";
          label.textContent = "T" + seasonObj.season + ": ";
          row.appendChild(label);

          const epsRow = document.createElement('span');
          epsRow.className = "episode-row";

          if(Array.isArray(seasonObj.episodes)) {
            seasonObj.episodes.forEach(ep => {
              const epBtn = document.createElement('a');
              epBtn.href = ep.link;
              epBtn.target = "_blank";
              epBtn.className = "btn eps";
              epBtn.textContent = ep.episode;

              if(isEpisodeWatched(seasonObj.season, ep.episode, item.title)) {
                epBtn.classList.add("watched");
              }

              epBtn.addEventListener("click", () => {
                markEpisodeWatched(seasonObj.season, ep.episode, item.title);
                epBtn.classList.add("watched");
              });

              epsRow.appendChild(epBtn);
            });
          }

          row.appendChild(epsRow);
          content.appendChild(row);
        });

      } else {
        const link = extractTeraboxLink(item.terabox);
        if(link) {
          const btn = document.createElement('a');
          btn.href = link;
          btn.className = 'btn';
          btn.target = '_blank';
          btn.textContent = 'Ver Serie';
          content.appendChild(btn);
        }
      }
    }

    // MOVIES
    if(item.type === 'movie') {
      const link = extractTeraboxLink(item.terabox);
      if(link) {
        const btn = document.createElement('a');
        btn.href = link;
        btn.className = 'btn';
        btn.target = '_blank';
        btn.textContent = 'Ver ahora';
        content.appendChild(btn);
      }
    }

    card.appendChild(content);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

// -----------------------------
// EXTRAER LINK TERABOX
// -----------------------------
function extractTeraboxLink(raw) {
  if(!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
  } catch(e){}
  const match = String(raw).match(/https?:\/\/[^\s"]+/);
  return match ? match[0] : '';
}

// -----------------------------
// FILTROS / BÚSQUEDA
// -----------------------------
searchInput.addEventListener('input', ()=> render(items));
filterButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filterButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type || 'all';
    render(items);
  });
});

fetchData();
