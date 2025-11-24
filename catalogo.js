// catalogo.js
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById('catalogo');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filterButtons button');

let items = [];
let activeFilter = 'all';

function markEpisodeWatched(season, episode, title) {
  const key = `watched_${title}_s${season}_e${episode}`;
  localStorage.setItem(key, "1");
}

function isEpisodeWatched(season, episode, title) {
  const key = `watched_${title}_s${season}_e${episode}`;
  return localStorage.getItem(key) === "1";
}

function toggleFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  favs[title] = !favs[title];
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "{}");
  return !!favs[title];
}

async function fetchData() {
  try {
    const res = await fetch(SHEET_JSON_URL);
    const data = await res.json();
    items = data;
    render(items);
  } catch (err) {
    console.error("Error al obtener datos:", err);
    container.innerHTML = `<p class="empty">Error al cargar el catálogo.</p>`;
  }
}

function render(list) {
  const q = (searchInput.value || '').toLowerCase().trim();
  const filtered = list.filter(i => {
    if (activeFilter === 'all') return true;
    return i.type === activeFilter;
  }).filter(i => (i.title || '').toLowerCase().includes(q));
  
  container.innerHTML = ''; // Limpiar antes de renderizar
  const fragment = document.createDocumentFragment();
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const posterDiv = document.createElement('div');
    posterDiv.className = 'poster';
    if (item.poster) {
      const img = document.createElement('img');
      img.src = item.poster;
      posterDiv.appendChild(img);
    }
    card.appendChild(posterDiv);
    
    const content = document.createElement('div');
    content.className = 'card-content';
    
    const h2 = document.createElement('h2');
    h2.textContent = item.title || '';
    content.appendChild(h2);
    
    const ov = document.createElement('p');
    ov.className = 'overview';
    ov.textContent = item.overview || '';
    content.appendChild(ov);
    
    const votes = document.createElement('div');
    votes.className = 'votes';
    votes.innerHTML = `<span>👍 ${item.votes_up||0}</span> <span>👎 ${item.votes_down||0}</span>`;
    content.appendChild(votes);
    
    if (item.type === 'series') {
      let seasons = item.season_links;
      try {
        seasons = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
      } catch(e) {
        seasons = [];
      }
      
      seasons.forEach(seasonObj => {
        const row = document.createElement('div');
        row.className = 'season-block';
        
        const seasonLabel = document.createElement('span');
        seasonLabel.className = 'season-label';
        seasonLabel.textContent = `Temp ${seasonObj.season}:`;
        row.appendChild(seasonLabel);
        
        if (Array.isArray(seasonObj.episodes)) {
          const epsRow = document.createElement('div');
          epsRow.className = 'episode-row';
          
          seasonObj.episodes.forEach(ep => {
            const epBtn = document.createElement('a');
            epBtn.href = ep.link;
            epBtn.target = '_blank';
            epBtn.className = 'btn eps';
            epBtn.textContent = `Ep ${ep.episode}`;
            
            if (isEpisodeWatched(seasonObj.season, ep.episode, item.title)) {
              epBtn.classList.add('watched');
            }
            
            epBtn.addEventListener('click', () => {
              markEpisodeWatched(seasonObj.season, ep.episode, item.title);
              epBtn.classList.add('watched');
            });
            
            epsRow.appendChild(epBtn);
          });
          
          row.appendChild(epsRow);
        } else if (seasonObj.link) {
          const linkBtn = document.createElement('a');
          linkBtn.href = seasonObj.link;
          linkBtn.target = '_blank';
          linkBtn.className = 'btn secondary';
          linkBtn.textContent = `Ver TEMP ${seasonObj.season}`;
          row.appendChild(linkBtn);
        }
        
        content.appendChild(row);
      });
    }
    
    if (item.type === 'movie') {
      const link = extractTeraboxLink(item.terabox);
      if (link) {
        const btn = document.createElement('a');
        btn.href = link;
        btn.className = 'btn';
        btn.target = '_blank';
        btn.textContent = 'Ver ahora';
        content.appendChild(btn);
      }
    }
    
    const favBtn = document.createElement('div');
    favBtn.className = 'fav-btn';
    favBtn.textContent = isFavorite(item.title) ? '⭐' : '☆';
    favBtn.onclick = () => {
      toggleFavorite(item.title);
      favBtn.textContent = isFavorite(item.title) ? '⭐' : '☆';
    };
    content.appendChild(favBtn);
    
    card.appendChild(content);
    fragment.appendChild(card);
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty">No se han encontrado resultados.</p>`;
  } else {
    container.appendChild(fragment);
  }
}

function extractTeraboxLink(raw) {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0] && parsed[0].link) {
      return parsed[0].link;
    }
  } catch (err) {
    const match = raw.toString().match(/https?:\/\/[^\s"]+/);
    if (match) return match[0];
  }
  return '';
}

searchInput.addEventListener('input', () => render(items));
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.getAttribute('data-filter');
    render(items);
  });
});

fetchData();
