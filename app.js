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
const botonVerMas = document.querySelector("#ver-mas");
const PRODUCTOS_POR_PAGINA = 24;

let cantidadVisible = PRODUCTOS_POR_PAGINA;

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
    cantidadVisible = PRODUCTOS_POR_PAGINA;
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

function obtenerUrlImagen(imagen) {
  if (!imagen) return "";
  return typeof imagen === "object" ? imagen.url : imagen;
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
    const estaPublicado = producto.activo && producto.vendido !== true;

    return estaPublicado && coincideCategoria && coincideEstado && coincideBusqueda(producto);
  });
}

function crearCard(producto) {
  const estado = producto.estado === "nuevo" ? "Nuevo" : "Usado";
  const detalleUrl = `producto.html?id=${producto.id}`;
  const imagenCard = obtenerUrlImagen(producto.imagenCard || producto.imagenes?.[0] || "");

  return `
    <article class="product-card">
      <a class="product-image-link" href="${detalleUrl}" aria-label="Ver detalle de ${producto.nombre}">
        <div class="product-image">
          <img src="${imagenCard}" alt="${producto.nombre}" loading="lazy">
          <span class="badge">${estado}</span>
        </div>
      </a>
      <div class="product-info">
        <p>${producto.categoria}</p>
        <div class="product-title-row">
          <a class="product-title-link" href="${detalleUrl}">
            <h3>${producto.nombre}</h3>
          </a>
        </div>
        <div class="product-meta">
          <strong>${formatearPrecio(producto.precio)}</strong>
          <span>Talle ${producto.talle}</span>
        </div>
        <button class="add-cart-button" type="button" data-product-id="${producto.id}">
          <i class="bi bi-bag-plus"></i>
          Agregar al carrito
        </button>
      </div>
    </article>
  `;
}

function renderizarProductos() {
  const filtrados = obtenerProductosFiltrados();
  const visibles = filtrados.slice(0, cantidadVisible);

  grid.innerHTML = visibles.map(crearCard).join("");
  contador.textContent = `${visibles.length} de ${filtrados.length} ${filtrados.length === 1 ? "producto encontrado" : "productos encontrados"}`;
  sinResultados.classList.toggle("hidden", filtrados.length > 0);
  botonVerMas.classList.toggle("hidden", visibles.length >= filtrados.length);
}

/*async function cargarProductos() {
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
}*/

async function cargarProductos() {
  try {
    // CAMBIO 1: Apuntamos a la nueva carpeta 'datos' que crea el CMS
    let respuesta = await fetch("datos/productos.json");
    if (!respuesta.ok) {
      respuesta = await fetch("Datos/productos.json");
    }
    if (!respuesta.ok) {
      respuesta = await fetch("productos.json");
    }
    const datos = await respuesta.json();
    
    // CAMBIO 2: Decap guarda la lista dentro de una propiedad .productos 
    // Si el archivo viene vacío o no existe, le asignamos un array vacío [] por seguridad
    productos = Array.isArray(datos) ? datos : datos.productos || []; 
    
    renderizarProductos();
  } catch (error) {
    grid.innerHTML = "";
    contador.textContent = "No se pudo cargar el catalogo.";
    sinResultados.classList.remove("hidden");
    console.error("Error al leer el archivo del CMS:", error);
  }
}

buscador.addEventListener("input", (event) => {
  busquedaActual = event.target.value.trim();
  cantidadVisible = PRODUCTOS_POR_PAGINA;
  renderizarProductos();
});

botonVerMas.addEventListener("click", () => {
  cantidadVisible += PRODUCTOS_POR_PAGINA;
  renderizarProductos();
});

crearBotonesFiltros(categorias, "#filtros-categorias", "categoria");
crearBotonesFiltros(estados, "#filtros-estados", "estado");
cargarProductos();
