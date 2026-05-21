const WHATSAPP_NUMBER = "59891826421";

const categorias = [
  { id: "todos", label: "Todos" },
  { id: "remeras", label: "Remeras" },
  { id: "pantalones", label: "Pantalones" },
  { id: "polleras", label: "Polleras" },
  { id: "camperas", label: "Camperas" },
  { id: "buzos", label: "Buzos" },
  { id: "calzado", label: "Calzado" }
];

const estados = [
  { id: "todos", label: "Todos" },
  { id: "nuevo", label: "Nuevo" },
  { id: "usado", label: "Usado" }
];

let productos = [];
let categoriaActual = "todos";
let estadoActual = "todos";
let busquedaActual = "";

const grid = document.querySelector("#grid-productos");
const contador = document.querySelector("#contador");
const sinResultados = document.querySelector("#sin-resultados");
const buscador = document.querySelector("#buscador");

function crearBotonesFiltros(items, contenedorId, tipo) {
  const contenedor = document.querySelector(contenedorId);

  contenedor.innerHTML = items.map((item) => `
    <button class="${item.id === "todos" ? "active" : ""}" type="button" data-${tipo}="${item.id}">
      ${item.label}
    </button>
  `).join("");

  contenedor.addEventListener("click", (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    if (tipo === "categoria") {
      categoriaActual = boton.dataset.categoria;
    } else {
      estadoActual = boton.dataset.estado;
    }

    contenedor.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    boton.classList.add("active");
    renderizarProductos();
  });
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(precio);
}

function coincideBusqueda(producto) {
  const texto = [
    producto.nombre,
    producto.categoria,
    producto.estado,
    producto.talle,
    producto.marca,
    producto.color
  ].join(" ").toLowerCase();

  return texto.includes(busquedaActual.toLowerCase());
}

function obtenerProductosFiltrados() {
  return productos.filter((producto) => {
    const coincideCategoria = categoriaActual === "todos" || producto.categoria === categoriaActual;
    const coincideEstado = estadoActual === "todos" || producto.estado === estadoActual;

    return producto.activo && coincideCategoria && coincideEstado && coincideBusqueda(producto);
  });
}

function crearCard(producto) {
  const estado = producto.estado === "nuevo" ? "Nuevo" : "Usado";
  const detalleUrl = `producto.html?id=${producto.id}`;
  const shareUrl = new URL(detalleUrl, window.location.href).href;
  const shareText = `Mira este producto de MYM Reutiliza: ${producto.nombre}`;

  return `
    <article class="product-card">
      <a class="product-image-link" href="${detalleUrl}" aria-label="Ver detalle de ${producto.nombre}">
        <div class="product-image">
          <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
          <span class="badge">${estado}</span>
        </div>
      </a>
      <div class="product-info">
        <p>${producto.categoria}</p>
        <div class="product-title-row">
          <a class="product-title-link" href="${detalleUrl}">
            <h3>${producto.nombre}</h3>
          </a>
          <div class="share-box">
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
              <a role="menuitem" href="https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}" target="_blank" rel="noopener">WhatsApp</a>
              <button role="menuitem" type="button" class="native-share-option" data-share-title="${producto.nombre}" data-share-text="${shareText}" data-share-url="${shareUrl}">Instagram</button>
              <a role="menuitem" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">Facebook</a>
            </div>
          </div>
        </div>
        <div class="product-meta">
          <strong>${formatearPrecio(producto.precio)}</strong>
          <span>Talle ${producto.talle}</span>
        </div>
      </div>
    </article>
  `;
}

function renderizarProductos() {
  const filtrados = obtenerProductosFiltrados();

  grid.innerHTML = filtrados.map(crearCard).join("");
  contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? "producto encontrado" : "productos encontrados"}`;
  sinResultados.classList.toggle("hidden", filtrados.length > 0);
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("productos.json");
    productos = await respuesta.json();
    renderizarProductos();
  } catch (error) {
    grid.innerHTML = "";
    contador.textContent = "No se pudo cargar el catalogo.";
    sinResultados.classList.remove("hidden");
    console.error(error);
  }
}

buscador.addEventListener("input", (event) => {
  busquedaActual = event.target.value.trim();
  renderizarProductos();
});

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

crearBotonesFiltros(categorias, "#filtros-categorias", "categoria");
crearBotonesFiltros(estados, "#filtros-estados", "estado");
cargarProductos();
