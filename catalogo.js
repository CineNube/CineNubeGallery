@@ -1,4 +1,10 @@
// catalogo.js
// catalogo.js mejorado con:
// ⭐ Sistema de capítulos vistos
// 🔔 Favoritos
// 🌓 Modo oscuro avanzado
// 📱 Optimización móvil
// 🎬 Render completo actualizado

const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbyE2R8nl85RXUA7_dZsKkpXZ8nVvfp-tfQi5tjmGF9p1sQHkTZCFQBb2fV5lP3RDswLjA/exec";

const container = document.getElementById('catalogo');
@@ -8,6 +14,36 @@ const filterButtons = document.querySelectorAll('#filterButtons button');
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
@@ -22,6 +58,9 @@ async function fetchData() {
  }
}

// -----------------------------
// RENDER PRINCIPAL
// -----------------------------
function render(list) {
  const q = (searchInput.value||'').toLowerCase().trim();
  const filtered = list.filter(i=>{
@@ -59,6 +98,16 @@ function render(list) {
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
@@ -74,15 +123,13 @@ function render(list) {
    votes.innerHTML = `<span>👍 ${item.votes_up||0}</span> <span>👎 ${item.votes_down||0}</span>`;
    content.appendChild(votes);

    // ===========================================
    // SERIES (compacto por temporadas/capitulos)
    // ===========================================
    // -----------------------------
    // SERIES: TEMPORADAS + EPS
    // -----------------------------
    if(item.type === 'series') {

      const seasons = Array.isArray(item.season_links) ? item.season_links : [];

      if(seasons.length > 0) {

        seasons.forEach(seasonObj => {
          const row = document.createElement('div');
          row.className = "season-block";
@@ -101,7 +148,17 @@ function render(list) {
              epBtn.href = ep.link;
              epBtn.target = "_blank";
              epBtn.className = "btn eps";
              epBtn.textContent = ep.episode; 
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
@@ -123,13 +180,29 @@ function render(list) {
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
@@ -140,7 +213,9 @@ function extractTeraboxLink(raw) {
  return match ? match[0] : '';
}

/* Search and filters */
// -----------------------------
// FILTROS / BÚSQUEDA
// -----------------------------
searchInput.addEventListener('input', ()=> render(items));
filterButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
@@ -151,5 +226,4 @@ filterButtons.forEach(btn=>{
  });
});

/* Auto init */
fetchData();
