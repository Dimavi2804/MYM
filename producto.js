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

function crearMenuCompartir(producto) {
  const shareUrl = new URL(`producto.html?id=${producto.id}`, window.location.href).href;
  const shareText = `Mira este producto de MYM Reutiliza: ${producto.nombre}`;

  return `
    <div class="share-box detail-share">
      <button class="share-trigger" type="button" aria-label="Compartir ${producto.nombre}" aria-expanded="false" data-share-title="${producto.nombre}" data-share-text="${shareText}" data-share-url="${shareUrl}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <path d="M8.7 10.7 15.3 7.3"></path>
          <path d="M8.7 13.3 15.3 16.7"></path>
        </svg>
      </button>
      <div class="share-menu" role="menu">
        <a class="share-option share-whatsapp" role="menuitem" href="https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}" target="_blank" rel="noopener">
          <i class="bi bi-whatsapp"></i>
          <span>WhatsApp</span>
        </a>
        <button class="share-option share-instagram native-share-option" role="menuitem" type="button" data-share-title="${producto.nombre}" data-share-text="${shareText}" data-share-url="${shareUrl}">
          <i class="bi bi-instagram"></i>
          <span>Instagram</span>
        </button>
        <a class="share-option share-facebook" role="menuitem" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">
          <i class="bi bi-facebook"></i>
          <span>Facebook</span>
        </a>
      </div>
    </div>
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
        <div class="main-image-wrap">
          <img id="imagen-principal" class="main-product-image" src="${producto.imagenes[0]}" alt="${producto.nombre}">
          <button class="gallery-arrow gallery-arrow-left" type="button" data-direction="-1" aria-label="Ver imagen anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="gallery-arrow gallery-arrow-right" type="button" data-direction="1" aria-label="Ver imagen siguiente">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        <div class="thumbs">
          ${crearMiniaturas(producto)}
        </div>
      </div>

      <article class="detail-copy">
        <p class="eyebrow">${capitalizar(producto.categoria)} / ${capitalizar(producto.estado)}</p>
        <div class="detail-title-row">
          <h1>${producto.nombre}</h1>
          ${crearMenuCompartir(producto)}
        </div>
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

  let imagenActual = 0;
  const imagenPrincipal = document.querySelector("#imagen-principal");
  const miniaturas = document.querySelectorAll(".thumbs button");

  function mostrarImagen(index) {
    imagenActual = (index + producto.imagenes.length) % producto.imagenes.length;
    imagenPrincipal.src = producto.imagenes[imagenActual];

    miniaturas.forEach((item, itemIndex) => {
      item.classList.toggle("active", itemIndex === imagenActual);
    });
  }

  document.querySelector(".thumbs").addEventListener("click", (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    mostrarImagen([...miniaturas].indexOf(boton));
  });

  document.querySelector(".main-image-wrap").addEventListener("click", (event) => {
    const boton = event.target.closest(".gallery-arrow");
    if (!boton) return;

    mostrarImagen(imagenActual + Number(boton.dataset.direction));
  });
}

document.addEventListener("click", (event) => {
  const botonCompartir = event.target.closest(".share-trigger");
  const opcionNativa = event.target.closest(".native-share-option");

  if (botonCompartir) {
    const caja = botonCompartir.closest(".share-box");
    const estaAbierta = caja.classList.contains("open");

    document.querySelectorAll(".share-box.open").forEach((item) => {
      item.classList.remove("open");
      item.querySelector(".share-trigger")?.setAttribute("aria-expanded", "false");
    });

    caja.classList.toggle("open", !estaAbierta);
    botonCompartir.setAttribute("aria-expanded", String(!estaAbierta));
    return;
  }

  if (opcionNativa) {
    compartirConAppInstalada(opcionNativa.dataset);
    return;
  }

  if (!event.target.closest(".share-box")) {
    document.querySelectorAll(".share-box.open").forEach((item) => {
      item.classList.remove("open");
      item.querySelector(".share-trigger")?.setAttribute("aria-expanded", "false");
    });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  document.querySelectorAll(".share-box.open").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".share-trigger")?.setAttribute("aria-expanded", "false");
  });
});

async function compartirConAppInstalada({ shareTitle, shareText, shareUrl }) {
  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    alert("Copiamos el link para que puedas pegarlo en Instagram.");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
    }
  }
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
