// Recarga automática cada 2 minutos (120000ms)
setInterval(() => {
  const event = new Event("input");
  document.getElementById("search-input").dispatchEvent(event); // Fuerza re-render con búsqueda actual
  fetchItems(); // recarga datos
}, 120000);
