import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAp_lb8Y2-RyPF4J5ez6soq-54WlQE-Fbg",
  authDomain: "crud-ticket-e86bc.firebaseapp.com",
  databaseURL: "https://crud-ticket-e86bc-default-rtdb.firebaseio.com",
  projectId: "crud-ticket-e86bc",
  storageBucket: "crud-ticket-e86bc.firebasestorage.app",
  messagingSenderId: "18291195000",
  appId: "1:18291195000:web:88af2295404d57f171c18d",
  measurementId: "G-F35YRXR1BF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let carrito = [];

// --- ELEMENTOS DEL DOM ---
const formProducto = document.getElementById('form-producto');
const tablaProductos = document.getElementById('tabla-productos');
const selectProductos = document.getElementById('select-productos');
const tablaVentas = document.getElementById('tabla-ventas');
const listaCarrito = document.getElementById('lista-carrito');
const totalLabel = document.getElementById('total-ticket');

// --- CRUD: PRODUCTOS ---

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('p-nombre').value;
    const precio = parseFloat(document.getElementById('p-precio').value);
    try {
        await addDoc(collection(db, "productos"), { nombre, precio });
        formProducto.reset();
        cargarDatos();
    } catch (error) { console.error(error); }
});

async function cargarDatos() {
    // 1. Cargar Productos
    const qProd = await getDocs(collection(db, "productos"));
    tablaProductos.innerHTML = "";
    selectProductos.innerHTML = '<option value="">Seleccionar producto...</option>';
    
    qProd.forEach((docSnap) => {
        const p = docSnap.data();
        const id = docSnap.id;
        tablaProductos.innerHTML += `<tr>
            <td>${p.nombre}</td>
            <td>$${p.precio.toFixed(2)}</td>
            <td><button class="btn-del btn-borrar-p" data-id="${id}">Eliminar</button></td>
        </tr>`;
        selectProductos.innerHTML += `<option value="${id}" data-nombre="${p.nombre}" data-precio="${p.precio}">${p.nombre}</option>`;
    });

    // 2. Cargar Ventas (Historial)
    const qVentas = query(collection(db, "ventas"), orderBy("fecha", "desc"));
    const snapshotVentas = await getDocs(qVentas);
    tablaVentas.innerHTML = "";
    
    snapshotVentas.forEach((docSnap) => {
        const v = docSnap.data();
        const fecha = v.fecha ? v.fecha.toDate().toLocaleString() : "Pendiente...";
        tablaVentas.innerHTML += `<tr>
            <td><small>${docSnap.id}</small></td>
            <td>${fecha}</td>
            <td><strong>$${v.total.toFixed(2)}</strong></td>
            <td><button class="btn-del btn-borrar-v" data-id="${docSnap.id}">Anular</button></td>
        </tr>`;
    });

    asignarEventos();
}

function asignarEventos() {
    // Borrar Productos
    document.querySelectorAll('.btn-borrar-p').forEach(btn => {
        btn.onclick = async (e) => {
            if(confirm("¿Eliminar producto?")) {
                await deleteDoc(doc(db, "productos", e.target.dataset.id));
                cargarDatos();
            }
        };
    });
    // Anular Ventas (Tickets)
    document.querySelectorAll('.btn-borrar-v').forEach(btn => {
        btn.onclick = async (e) => {
            if(confirm("¿Anular este ticket de venta?")) {
                await deleteDoc(doc(db, "ventas", e.target.dataset.id));
                cargarDatos();
            }
        };
    });
}

// --- LÓGICA DEL CARRITO Y VENTA ---

document.getElementById('btn-agregar-carrito').onclick = () => {
    const sel = selectProductos.options[selectProductos.selectedIndex];
    if (!sel.value) return;

    carrito.push({
        id_producto: sel.value,
        nombre: sel.dataset.nombre,
        precio: parseFloat(sel.dataset.precio),
        cantidad: parseInt(document.getElementById('v-cantidad').value)
    });
    actualizarVistaTicket();
};

function actualizarVistaTicket() {
    listaCarrito.innerHTML = "";
    let total = 0;
    carrito.forEach(item => {
        total += item.precio * item.cantidad;
        listaCarrito.innerHTML += `<li class="carrito-item">
            <span>${item.nombre} (x${item.cantidad})</span>
            <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
        </li>`;
    });
    totalLabel.innerText = total.toFixed(2);
}

document.getElementById('btn-finalizar-venta').onclick = async () => {
    if (carrito.length === 0) return alert("Agrega productos al ticket");

    try {
        const ventaRef = await addDoc(collection(db, "ventas"), {
            fecha: serverTimestamp(),
            total: parseFloat(totalLabel.innerText)
        });

        for (const prod of carrito) {
            await addDoc(collection(db, "ventas_productos"), {
                id_venta: ventaRef.id,
                id_producto: prod.id_producto,
                cantidad: prod.cantidad,
                precio_unitario: prod.precio
            });
        }

        alert("Venta registrada con éxito");
        carrito = [];
        actualizarVistaTicket();
        cargarDatos(); // Recargar historial
    } catch (e) {
        console.error(e);
    }
};

cargarDatos();