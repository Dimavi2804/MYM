const CART_STORAGE_KEY = "mym-carrito";
const CART_PRODUCTS_URLS = ["datos/productos.json", "Datos/productos.json", "productos.json"];

let catalogoCarrito = [];

function precioNumero(valor) {
  return Number(valor) || 0;
}

function formatearPrecioCarrito(precio) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(precioNumero(precio));
}

function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

async function cargarCatalogoCarrito() {
  if (catalogoCarrito.length > 0) return catalogoCarrito;

  for (const url of CART_PRODUCTS_URLS) {
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) continue;

      const datos = await respuesta.json();
      catalogoCarrito = Array.isArray(datos) ? datos : datos.productos || [];
      return catalogoCarrito;
    } catch {
      // Probamos la siguiente ruta disponible.
    }
  }

  catalogoCarrito = [];
  return catalogoCarrito;
}

function obtenerProductoCarrito(id) {
  return catalogoCarrito.find((producto) => String(producto.id) === String(id));
}

function obtenerImagenProducto(producto) {
  if (producto.imagenCard) return typeof producto.imagenCard === "object" ? producto.imagenCard.url : producto.imagenCard;
  if (Array.isArray(producto.imagenesDetalle) && producto.imagenesDetalle.length > 0) {
    const imagen = producto.imagenesDetalle[0];
    return typeof imagen === "object" ? imagen.url : imagen;
  }
  if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) return producto.imagenes[0];
  return "";
}

function obtenerStockProducto(producto) {
  const stock = Number(producto.stock ?? producto.cantidad ?? producto.inventario);
  return Number.isFinite(stock) && stock > 0 ? stock : 99;
}

function totalItemsCarrito() {
  return leerCarrito().reduce((total, item) => total + item.cantidad, 0);
}

function totalCarrito() {
  return leerCarrito().reduce((total, item) => total + item.precio * item.cantidad, 0);
}

function crearProductoCarrito(producto) {
  return {
    id: String(producto.id),
    nombre: producto.nombre,
    precio: precioNumero(producto.precio),
    talle: producto.talle || "Sin talle",
    imagen: obtenerImagenProducto(producto),
    stock: obtenerStockProducto(producto),
    url: new URL(`producto.html?id=${producto.id}`, window.location.href).href,
    cantidad: 1
  };
}

async function agregarAlCarrito(id) {
  await cargarCatalogoCarrito();
  const producto = obtenerProductoCarrito(id);

  if (!producto || !producto.activo || producto.vendido === true) {
    mostrarEstadoCarrito("No pudimos agregar ese producto. Puede estar vendido o no disponible.", "error");
    abrirCarrito();
    return;
  }

  const carrito = leerCarrito();
  const existente = carrito.find((item) => item.id === String(id));

  if (existente) {
    if (existente.cantidad >= existente.stock) {
      mostrarEstadoCarrito("No hay mas stock disponible para ese producto.", "error");
    } else {
      existente.cantidad += 1;
      mostrarEstadoCarrito("Producto actualizado en el carrito.", "success");
    }
  } else {
    carrito.push(crearProductoCarrito(producto));
    mostrarEstadoCarrito("Producto agregado al carrito.", "success");
  }

  guardarCarrito(carrito);
  renderizarCarrito();
  abrirCarrito();
}

function cambiarCantidad(id, cambio) {
  const carrito = leerCarrito();
  const item = carrito.find((producto) => producto.id === String(id));
  if (!item) return;

  item.cantidad += cambio;

  if (item.cantidad <= 0) {
    guardarCarrito(carrito.filter((producto) => producto.id !== String(id)));
  } else if (item.cantidad > item.stock) {
    item.cantidad = item.stock;
    guardarCarrito(carrito);
    mostrarEstadoCarrito("Llegaste al maximo de stock disponible.", "error");
  } else {
    guardarCarrito(carrito);
  }

  renderizarCarrito();
}

function eliminarProductoCarrito(id) {
  guardarCarrito(leerCarrito().filter((item) => item.id !== String(id)));
  renderizarCarrito();
}

function crearCarritoUI() {
  if (document.querySelector("#cart-overlay")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <button class="cart-floating" type="button" aria-label="Abrir carrito">
      <i class="bi bi-bag"></i>
      <span id="cart-count">0</span>
    </button>

    <div id="cart-overlay" class="cart-overlay hidden" aria-hidden="true">
      <aside class="cart-panel" aria-label="Carrito de compras">
        <div class="cart-header">
          <div>
            <p class="eyebrow">Pedido</p>
            <h2>Carrito</h2>
          </div>
          <button class="cart-close" type="button" aria-label="Cerrar carrito">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div id="cart-status" class="cart-status hidden" aria-live="polite"></div>
        <div id="cart-items" class="cart-items"></div>

        <div id="cart-empty" class="cart-empty">
          <p>Tu carrito esta vacio.</p>
        </div>

        <form id="checkout-form" class="checkout-form hidden" novalidate>
          <h3>Datos de contacto</h3>
          <label>Nombre<input name="nombre" type="text" autocomplete="given-name" required></label>
          <label>Apellido<input name="apellido" type="text" autocomplete="family-name" required></label>
          <label>Telefono<input name="telefono" type="tel" autocomplete="tel" required></label>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
        </form>

        <div class="cart-footer">
          <div class="cart-total">
            <span>Total</span>
            <strong id="cart-total">$0</strong>
          </div>
          <button id="checkout-button" class="primary-action cart-checkout" type="button">Finalizar compra por WhatsApp</button>
          <button id="continue-shopping" class="secondary-action cart-continue" type="button">Seguir comprando</button>
        </div>
      </aside>
    </div>
  `);
}

function renderizarCarrito() {
  const carrito = leerCarrito();
  const contenedor = document.querySelector("#cart-items");
  const vacio = document.querySelector("#cart-empty");
  const total = document.querySelector("#cart-total");
  const contador = document.querySelector("#cart-count");
  const checkoutForm = document.querySelector("#checkout-form");

  if (!contenedor || !vacio || !total || !contador) return;

  contador.textContent = totalItemsCarrito();
  total.textContent = formatearPrecioCarrito(totalCarrito());
  vacio.classList.toggle("hidden", carrito.length > 0);

  if (carrito.length === 0) {
    contenedor.innerHTML = "";
    checkoutForm?.classList.add("hidden");
    return;
  }

  contenedor.innerHTML = carrito.map((item) => `
    <article class="cart-item">
      <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
      <div>
        <h3>${item.nombre}</h3>
        <p>Talle ${item.talle}</p>
        <strong>${formatearPrecioCarrito(item.precio)}</strong>
        <div class="cart-quantity">
          <button type="button" data-cart-action="decrease" data-product-id="${item.id}" aria-label="Restar unidad">-</button>
          <span>${item.cantidad}</span>
          <button type="button" data-cart-action="increase" data-product-id="${item.id}" aria-label="Sumar unidad">+</button>
        </div>
      </div>
      <button class="cart-remove" type="button" data-cart-action="remove" data-product-id="${item.id}" aria-label="Eliminar ${item.nombre}">
        <i class="bi bi-trash"></i>
      </button>
    </article>
  `).join("");
}

function abrirCarrito() {
  const overlay = document.querySelector("#cart-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function cerrarCarrito() {
  const overlay = document.querySelector("#cart-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function mostrarEstadoCarrito(mensaje, tipo = "success") {
  const estado = document.querySelector("#cart-status");
  if (!estado) return;

  estado.textContent = mensaje;
  estado.className = `cart-status ${tipo}`;
  estado.classList.remove("hidden");
}

function validarFormularioPedido() {
  const form = document.querySelector("#checkout-form");
  const datos = Object.fromEntries(new FormData(form).entries());
  const campos = ["nombre", "apellido", "telefono", "email"];

  for (const campo of campos) {
    if (!datos[campo]?.trim()) {
      return { valido: false, mensaje: "Completá todos los datos de contacto." };
    }
  }

  if (!datos.email.includes("@")) {
    return { valido: false, mensaje: "Ingresá un email válido." };
  }

  return { valido: true, datos };
}

function crearMensajePedido(datosCliente) {
  const carrito = leerCarrito();
  const lineas = carrito.map((item, index) => {
    const subtotal = formatearPrecioCarrito(item.precio * item.cantidad);
    return `${index + 1}. ${item.nombre}\n   Talle: ${item.talle}\n   Cantidad: ${item.cantidad}\n   Subtotal: ${subtotal}\n   Link: ${item.url}`;
  });

  return [
    "Hola! Quiero finalizar este pedido de MYM Reutiliza:",
    "",
    `Cliente: ${datosCliente.nombre} ${datosCliente.apellido}`,
    `Telefono: ${datosCliente.telefono}`,
    `Email: ${datosCliente.email}`,
    "",
    "Productos:",
    lineas.join("%0A%0A"),
    "",
    `Total: ${formatearPrecioCarrito(totalCarrito())}`,
    "",
    "Quedo a la espera del link de pago. Gracias!"
  ].join("\n");
}

function finalizarCompra() {
  const carrito = leerCarrito();
  const form = document.querySelector("#checkout-form");

  if (carrito.length === 0) {
    mostrarEstadoCarrito("Tu carrito está vacío. Agregá un producto antes de finalizar.", "error");
    return;
  }

  if (form.classList.contains("hidden")) {
    form.classList.remove("hidden");
    mostrarEstadoCarrito("Completá tus datos para finalizar el pedido.", "success");
    form.querySelector("input")?.focus();
    return;
  }

  const validacion = validarFormularioPedido();
  if (!validacion.valido) {
    mostrarEstadoCarrito(validacion.mensaje, "error");
    return;
  }

  const mensaje = encodeURIComponent(crearMensajePedido(validacion.datos));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;

  const ventana = window.open(url, "_blank", "noopener");
  if (!ventana) {
    window.location.href = url;
  }

  guardarCarrito([]);
  renderizarCarrito();
  form.reset();
  form.classList.add("hidden");
  mostrarEstadoCarrito("Su pedido fue realizado con éxito. A la brevedad lo contactaremos. Muchas gracias.", "success");
}

function seguirComprando() {
  cerrarCarrito();
  if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/" && window.location.pathname !== "") {
    window.location.href = "index.html#productos";
  }
}

document.addEventListener("click", async (event) => {
  const agregar = event.target.closest(".add-cart-button");
  if (agregar) {
    await agregarAlCarrito(agregar.dataset.productId);
    return;
  }

  if (event.target.closest(".cart-floating")) {
    abrirCarrito();
    return;
  }

  if (event.target.closest(".cart-close") || event.target.id === "cart-overlay") {
    cerrarCarrito();
    return;
  }

  if (event.target.closest("#continue-shopping")) {
    seguirComprando();
    return;
  }

  if (event.target.closest("#checkout-button")) {
    finalizarCompra();
    return;
  }

  const accionCarrito = event.target.closest("[data-cart-action]");
  if (!accionCarrito) return;

  const id = accionCarrito.dataset.productId;
  const accion = accionCarrito.dataset.cartAction;

  if (accion === "increase") cambiarCantidad(id, 1);
  if (accion === "decrease") cambiarCantidad(id, -1);
  if (accion === "remove") eliminarProductoCarrito(id);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") cerrarCarrito();
});

crearCarritoUI();
cargarCatalogoCarrito();
renderizarCarrito();
