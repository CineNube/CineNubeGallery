const SHEET_URL = 'https://script.google.com/macros/s/AKfycbx1Vq5HqmPMExtgm1PRgct2WRzGex5BTEtDERIKHA20VZNFf-umdHpiKD94Df80S2vO1g/exec'; // Reemplaza con tu WebApp URL

let items = [];

async function fetchItems() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    items = data.sort((a,b)=>b.published_ts - a.published_ts); // Descendente por publicado
    displayItems(items);
  } catch(e) {
    document.getElementById('gallery-container').innerHTML = '<p class="error">Error al cargar los títulos</p>';
    console.error(e);
  }
}

function displayItems(data) {
  const container = document.getElementById('gallery-container');
  container.innerHTML = '';
  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}">
      <div class="info">
        <h3>${item.title}</h3>
        <p class="overview">${item.overview}</p>
        <p class="meta">⭐ ${item.rating} | 📅 ${item.year}</p>
        <p class="votes">👍 ${item.votes_up} | 👎 ${item.votes_down}</p>
        ${item.type==='movie' && item.terabox?`<a href="${item.terabox}" target="_blank" class="btn">Ver ahora</a>`:''}
        ${item.type==='series' && item.season_links.length>0?item.season_links.map(s=>`<a href="${s.link||'#'}" class="btn">${s.link?'Temporada '+s.season:'Temporada '+s.season}</a>`).join(''):''}
      </div>
    `;
    container.appendChild(card);
  });
}

document.getElementById('search-input').addEventListener('input', e=>{
  const val = e.target.value.toLowerCase();
  displayItems(items.filter(i=>i.title.toLowerCase().includes(val)));
});

document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.type;
    if(type==='all') displayItems(items);
    else displayItems(items.filter(i=>i.type===type));
  });
});

fetchItems();
