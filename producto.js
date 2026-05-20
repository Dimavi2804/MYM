const WHATSAPP_NUMBER = "59891826421";

const contenedor = document.querySelector("#detalle-producto");
const params = new URLSearchParams(window.location.search);
const idProducto = Number(params.get("id"));

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(precio);
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function crearMiniaturas(producto) {
  return producto.imagenes.map((imagen, index) => `
    <button class="${index === 0 ? "active" : ""}" type="button" data-image="${imagen}" aria-label="Ver imagen ${index + 1}">
      <img src="${imagen}" alt="${producto.nombre} miniatura ${index + 1}">
    </button>
  `).join("");
}

function crearVideo(producto) {
  if (!producto.video) return "";

  return `
    <section class="video-block">
      <h2>Video de la prenda</h2>
      <video controls src="${producto.video}"></video>
    </section>
  `;
}

function renderizarProducto(producto) {
  const mensaje = encodeURIComponent(`Hola! Me interesa ${producto.nombre} talle ${producto.talle} que vi en la web.`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;

  document.title = `${producto.nombre} | MYM Reutiliza`;

  contenedor.innerHTML = `
    <a class="back-link" href="index.html">Volver al catalogo</a>

    <section class="product-detail">
      <div class="gallery">
        <img id="imagen-principal" class="main-product-image" src="${producto.imagenes[0]}" alt="${producto.nombre}">
        <div class="thumbs">
          ${crearMiniaturas(producto)}
        </div>
      </div>

      <article class="detail-copy">
        <p class="eyebrow">${capitalizar(producto.categoria)} / ${capitalizar(producto.estado)}</p>
        <h1>${producto.nombre}</h1>
        <p class="detail-price">${formatearPrecio(producto.precio)}</p>

        <div class="detail-actions">
          <a class="primary-action" href="${whatsappUrl}" target="_blank" rel="noopener"> <i class="bi bi-whatsapp"></i> Consultar por WhatsApp</a>
          <a class="secondary-action" href="index.html">Seguir viendo</a>
        </div>

        <dl class="specs">
          <div><dt>Talle</dt><dd>${producto.talle}</dd></div>
          <div><dt>Estado</dt><dd>${capitalizar(producto.estado)}</dd></div>
          <div><dt>Marca</dt><dd>${producto.marca}</dd></div>
          <div><dt>Color</dt><dd>${producto.color}</dd></div>
          <div><dt>Medidas</dt><dd>${producto.medidas}</dd></div>
        </dl>

        <section class="description">
          <h2>Descripcion</h2>
          <p>${producto.descripcion}</p>
        </section>
      </article>
    </section>

    ${crearVideo(producto)}
  `;

  document.querySelector(".thumbs").addEventListener("click", (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    document.querySelector("#imagen-principal").src = boton.dataset.image;
    document.querySelectorAll(".thumbs button").forEach((item) => item.classList.remove("active"));
    boton.classList.add("active");
  });
}

async function cargarDetalle() {
  try {
    const respuesta = await fetch("productos.json");
    const productos = await respuesta.json();
    const producto = productos.find((item) => item.id === idProducto && item.activo);

    if (!producto) {
      contenedor.innerHTML = `
        <section class="empty-state">
          <h1>Producto no encontrado</h1>
          <p>Puede que el producto haya sido desactivado o que el link no sea correcto.</p>
          <a class="primary-action" href="index.html">Volver al catalogo</a>
        </section>
      `;
      return;
    }

    renderizarProducto(producto);
  } catch (error) {
    contenedor.innerHTML = `
      <section class="empty-state">
        <h1>No se pudo cargar el producto</h1>
        <p>Proba abrir el proyecto con Live Server o con un servidor local.</p>
      </section>
    `;
    console.error(error);
  }
}

cargarDetalle();
