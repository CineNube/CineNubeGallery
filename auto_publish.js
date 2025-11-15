// auto_publish.js
// recarga cada 60 segundos
setInterval(()=> {
  // llama a fetchData definida en catalogo.js
  if (typeof fetchData === 'function') fetchData();
}, 60000);
