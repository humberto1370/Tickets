// Importamos las herramientas necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ESTE ES TU CONFIG (El que pegaste antes)
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

// Inicializamos Firebase y la Base de Datos (Firestore)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIONES CRUD ---

// 1. CREAR PRODUCTO
window.crearProducto = async () => {
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

// 2. LEER PRODUCTOS (Para llenar el selector de ventas automáticamente)
onSnapshot(collection(db, "productos"), (snapshot) => {
    const select = document.getElementById('selectProducto');
    select.innerHTML = '<option value="">-- Selecciona un producto --</option>';
    snapshot.forEach(doc => {
        const p = doc.data();
        select.innerHTML += `<option value="${doc.id}">${p.nombre} ($${p.precio})</option>`;
    });
});

// 3. CREAR VENTA (Relación Ventas -> Productos)
window.generarVenta = async () => {
    const productoId = document.getElementById('selectProducto').value;
    const cantidad = document.getElementById('cantidad').value;

    if(!productoId || !cantidad) return alert("Selecciona producto y cantidad");

    try {
        // Creamos el ticket de venta principal
        const ventaRef = await addDoc(collection(db, "ventas"), {
            fecha: new Date(),
                                      cliente: "Mostrador" // Podrías añadir un input para el nombre del cliente
        });

        // Creamos la relación en la tabla Ventas_Productos
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
        contenedor.innerHTML += `
        <div style="border: 1px solid #ccc; margin: 5px; padding: 10px;">
        <p><strong>Ticket ID:</strong> ${documento.id}</p>
        <p>Fecha: ${data.fecha.toDate().toLocaleString()}</p>
        <button onclick="eliminarVenta('${documento.id}')">Eliminar Ticket</button>
        </div>
        `;
    });
});

// 5. ELIMINAR VENTA
window.eliminarVenta = async (id) => {
    if(confirm("¿Seguro que quieres borrar este ticket?")) {
        await deleteDoc(doc(db, "ventas", id));
    }
};
