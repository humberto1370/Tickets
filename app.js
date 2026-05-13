import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAp_lb8Y2-RyPF4J5ez6soq-54WlQE-Fbg",
    authDomain: "crud-ticket-e86bc.firebaseapp.com",
    databaseURL: "https://crud-ticket-e86bc-default-rtdb.firebaseio.com",
    projectId: "crud-ticket-e86bc",
    storageBucket: "crud-ticket-e86bc.firebasestorage.app",
    messagingSenderId: "18291195000",
    appId: "1:18291195000:web:d55096f18bb6b57b71c18d",
    measurementId: "G-41F40E1ER1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIONES ---

// 1. CREAR PRODUCTO
const crearProducto = async () => {
    const nombre = document.getElementById('prodNombre').value;
    const precio = document.getElementById('prodPrecio').value;

    if(nombre === "" || precio === "") return alert("Llena los campos");

    try {
        await addDoc(collection(db, "productos"), {
            nombre: nombre,
            precio: parseFloat(precio)
        });
        document.getElementById('prodNombre').value = "";
        document.getElementById('prodPrecio').value = "";
        alert("Producto guardado con éxito");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
};

// 2. LEER PRODUCTOS
onSnapshot(collection(db, "productos"), (snapshot) => {
    const select = document.getElementById('selectProducto');
    select.innerHTML = '<option value="">-- Selecciona un producto --</option>';
    snapshot.forEach(doc => {
        const p = doc.data();
        select.innerHTML += `<option value="${doc.id}">${p.nombre} ($${p.precio})</option>`;
    });
});

// 3. CREAR VENTA
const generarVenta = async () => {
    const productoId = document.getElementById('selectProducto').value;
    const cantidad = document.getElementById('cantidad').value;

    if(!productoId || !cantidad) return alert("Selecciona producto y cantidad");

    try {
        const ventaRef = await addDoc(collection(db, "ventas"), {
            fecha: new Date(),
            cliente: "Mostrador"
        });

        await addDoc(collection(db, "ventas_productos"), {
            idVenta: ventaRef.id,
            idProducto: productoId,
            cantidad: parseInt(cantidad)
        });

        alert("Venta registrada y Ticket generado");
    } catch (error) {
        console.error("Error en la venta:", error);
    }
};

// 4. LEER VENTAS (Historial)
onSnapshot(collection(db, "ventas"), (snapshot) => {
    const contenedor = document.getElementById('listaVentas');
    contenedor.innerHTML = "";
    snapshot.forEach(documento => {
        const data = documento.data();
        // Evitamos error si la fecha aún no carga de Firebase
        const fechaFormateada = data.fecha?.toDate ? data.fecha.toDate().toLocaleString() : "Cargando...";
        
        const divTicket = document.createElement('div');
        divTicket.className = 'ticket';
        divTicket.innerHTML = `
            <div class="ticket-info">
                <p><strong>Ticket ID:</strong> ${documento.id}</p>
                <p>Fecha: ${fechaFormateada}</p>
            </div>
            <button class="btn-danger" data-id="${documento.id}">Eliminar</button>
        `;

        // Añadimos evento al botón de eliminar de este ticket específico
        divTicket.querySelector('.btn-danger').addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            eliminarVenta(id);
        });

        contenedor.appendChild(divTicket);
    });
});

// 5. ELIMINAR VENTA
const eliminarVenta = async (id) => {
    if(confirm("¿Seguro que quieres borrar este ticket?")) {
        try {
            await deleteDoc(doc(db, "ventas", id));
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    }
};

// ASIGNAR EVENTOS A LOS BOTONES PRINCIPALES
document.getElementById('btnGuardarProducto').addEventListener('click', crearProducto);
document.getElementById('btnFinalizarVenta').addEventListener('click', generarVenta);