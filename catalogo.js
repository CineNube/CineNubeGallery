// catalogo.js
const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById('catalogo');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filterButtons button');

let items = [];
let activeFilter = 'all';

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

    // Buttons container
    const seasonsRow = document.createElement('div');
    seasonsRow.className = 'season-row';

    // If movie: show ver ahora if terabox present (works with array or raw link)
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

    // If series: show season buttons if present OR if not present but terabox exists show single Ver Serie
    if(item.type === 'series') {
      const seasons = Array.isArray(item.season_links) ? item.season_links : [];
      const validSeasons = seasons.filter(s=>s && s.link && String(s.link).trim()!=='');
      if(validSeasons.length > 0) {
        validSeasons.forEach(s=>{
          const btn = document.createElement('a');
          btn.href = s.link;
          btn.className = 'btn secondary';
          btn.target = '_blank';
          btn.textContent = 'Temporada ' + s.season;
          seasonsRow.appendChild(btn);
        });
        content.appendChild(seasonsRow);
      } else {
        // fallback to terabox as single button
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

    card.appendChild(content);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function extractTeraboxLink(raw) {
  if(!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed) && parsed[0] && parsed[0].link) return parsed[0].link;
  } catch(e){}
  // fallback regex
  const match = String(raw).match(/https?:\/\/[^\s"]+/);
  return match ? match[0] : '';
}

/* Search and filters */
searchInput.addEventListener('input', ()=> render(items));
filterButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filterButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type || 'all';
    render(items);
  });
});

/* Auto init */
fetchData();
