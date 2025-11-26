const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById('catalogo');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filterButtons button');

let items = [];
let activeFilter = 'all';

async function fetchData() {
  try {
    const res = await fetch(SHEET_JSON_URL);
    const data = await res.json();
    items = data.sort((a,b)=> (b.published_ts||0)-(a.published_ts||0));
    render(items);
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="empty">Error al cargar</div>`;
  }
}

function render(list) {
  const q = (searchInput.value||'').toLowerCase();
  const filtered = list.filter(i=>{
    if(activeFilter!=='all' && i.type!==activeFilter) return false;
    if(q && !i.title.toLowerCase().includes(q)) return false;
    return true;
  });

  if(filtered.length===0){
    container.innerHTML = `<div class="empty">No hay títulos</div>`;
    return;
  }

  container.innerHTML = "";
  const frag = document.createDocumentFragment();

  filtered.forEach(item=>{
    const card = document.createElement('article');
    card.className = "card";

    const img = document.createElement('img');
    img.src = item.poster || "";
    img.className = "poster";
    card.appendChild(img);

    const c = document.createElement('div');
    c.className = "card-content";

    const h2 = document.createElement('h2');
    h2.textContent = item.title;
    c.appendChild(h2);

    const ov = document.createElement('p');
    ov.textContent = item.overview || "";
    ov.className = "overview";
    c.appendChild(ov);

    const meta = document.createElement('div');
    meta.className = "meta";
    meta.textContent = `⭐ ${item.rating} | 📅 ${item.year}`;
    c.appendChild(meta);

    const votes = document.createElement('div');
    votes.className = "votes";
    votes.innerHTML = `👍 ${item.votes_up||0} — 👎 ${item.votes_down||0}`;
    c.appendChild(votes);

                       // SERIES → mostrar TODAS LAS TEMPORADAS con su botón
    if(item.type === "series"){
      const seasons = Array.isArray(item.season_links) ? item.season_links : [];

      seasons.forEach(s=>{
        const row = document.createElement('div');
        row.className = "season-row";

        const label = document.createElement('span');
        label.textContent = "T" + s.season + ": ";
        row.appendChild(label);

        const btn = document.createElement('a');
        btn.href = s.link;
        btn.target = "_blank";
        btn.className = "btn";
        btn.textContent = "Ver temporada completa";
        row.appendChild(btn);

        c.appendChild(row);
      });
    }

    // MOVIES
    if(item.type === "movie"){
      const link = extractTeraboxLink(item.terabox);
      if(link){
        const btn = document.createElement('a');
        btn.href = link;
        btn.className = "btn";
        btn.target = "_blank";
        btn.textContent = "Ver ahora";
        c.appendChild(btn);
      }
    }

    card.appendChild(c);
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

function extractTeraboxLink(raw){
  if(!raw) return "";
  try{
    const p = JSON.parse(raw);
    if(Array.isArray(p) && p[0] && p[0].link) return p[0].link;
  }catch(e){}
  return raw;
}

searchInput.addEventListener("input", ()=>render(items));

filterButtons.forEach(b=>{
  b.addEventListener("click", ()=>{
    filterButtons.forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    activeFilter = b.dataset.type;
    render(items);
  });
});

fetchData();
