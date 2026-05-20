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

  return `
    <article class="product-card">
      <a href="producto.html?id=${producto.id}" aria-label="Ver detalle de ${producto.nombre}">
        <div class="product-image">
          <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
          <span class="badge">${estado}</span>
        </div>
        <div class="product-info">
          <p>${producto.categoria}</p>
          <h3>${producto.nombre}</h3>
          <div>
            <strong>${formatearPrecio(producto.precio)}</strong>
            <span>Talle ${producto.talle}</span>
          </div>
        </div>
      </a>
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

crearBotonesFiltros(categorias, "#filtros-categorias", "categoria");
crearBotonesFiltros(estados, "#filtros-estados", "estado");
cargarProductos();
