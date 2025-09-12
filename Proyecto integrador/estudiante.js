
import { auth, db, } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword, getAuth
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  getDoc, getFirestore, query, where, updateDoc, orderBy
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid;
    // Buscar al estudiante por su ID en Firestore
    const docRef = doc(db, "usuarios", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const estudiante = docSnap.data();
      estudiante.id = docSnap.id;
      mostrarDatosEstudiante(estudiante);
    } else {
      alert("No se encontraron los datos del estudiante.");
    }
  } else {
    // Redirigir a login si no hay sesión
    window.location.href = "login.html";
  }
});

async function mostrarDatosEstudiante(estudiante) {
  // Mostrar contenedor
  document.getElementById("contenedorEstudiante").style.display = "block";

  // Datos personales
  document.getElementById("estNombre").textContent = estudiante.nombres || "-";
  document.getElementById("estRU").textContent = estudiante.ru || "-";
  document.getElementById("estParalelo").textContent = estudiante.paralelo || "-";

  // Docentes
  await mostrarDocentesAsignados(estudiante.tutorId, estudiante.relatorId);

  // Proceso de titulación
  await mostrarProcesoTitulacion(estudiante.id);

}

window.mostrarDocentesAsignados = async function (tutorId, relatorId) {
  const nombreTutorSpan = document.getElementById("estTutor");
  const nombreRelatorSpan = document.getElementById("estRelator");

  if (nombreTutorSpan) {
    if (tutorId) {
      const docTutor = await getDoc(doc(db, "usuarios", tutorId));
      const tutorData = docTutor.data();
      nombreTutorSpan.textContent = `${tutorData.nombres} ${tutorData.apellidos}`;
    } else {
      nombreTutorSpan.textContent = "No asignado";
    }
  }

  if (nombreRelatorSpan) {
    if (relatorId) {
      const docRelator = await getDoc(doc(db, "usuarios", relatorId));
      const relatorData = docRelator.data();
      nombreRelatorSpan.textContent = `${relatorData.nombres} ${relatorData.apellidos}`;
    } else {
      nombreRelatorSpan.textContent = "No asignado";
    }
  }
}

window.mostrarProcesoTitulacion = async function (estudianteId) {
  const contenedor = document.getElementById("procesoTitulacion");
  if (!contenedor) return;

  try {
    // Consultar las etapas desde Firestore
    const etapasCol = collection(db, "etapas");
    const q = query(etapasCol, orderBy("orden", "asc"));
    const querySnapshot = await getDocs(q);

    const etapas = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (typeof data.orden !== "undefined" && typeof data.nombreEtapa === "string") {
        etapas.push({ orden: data.orden, nombreEtapa: data.nombreEtapa });
      }
    });

    if (etapas.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron etapas de titulación.</p>";
      return;
    }

    // Cargar entregas desde la subcolección en "estudiantes"
    const entregasDocRef = doc(db, "estudiantes", estudianteId, "seguimiento", "entregas");
    const entregasDoc = await getDoc(entregasDocRef);
    const entregasData = entregasDoc.exists() ? entregasDoc.data() : {};

    contenedor.innerHTML = ""; // Limpiar contenido anterior

    for (const etapa of etapas) {
      const e = entregasData[etapa.orden] || {
        primera: "Pendiente",
        segunda: "Pendiente",
        final: "Pendiente"
      };

      const card = document.createElement("div");
      card.className = "card mb-3";
      card.innerHTML = `
        <div class="card-header bg-light border-start border-4 border-primary">
          Etapa ${etapa.orden}: ${etapa.nombreEtapa}
        </div>
        <div class="card-body">
          <div class="row g-3">
            ${crearEntregaSoloLectura("1ª Entrega", e.primera)}
            ${crearEntregaSoloLectura("2ª Entrega", e.segunda)}
            ${crearEntregaSoloLectura("Entrega Final", e.final)}
          </div>
        </div>
      `;

      contenedor.appendChild(card);
    }
  } catch (error) {
    console.error("Error mostrando proceso de titulación:", error);
    contenedor.innerHTML = "<p>Error al cargar el proceso de titulación.</p>";
  }
};

// Función para mostrar entregas sin opción de edición
function crearEntregaSoloLectura(titulo, valor) {
  const color = valor === "Completado" ? "text-success" : "text-warning";
  const icono = valor === "Completado" ? "✅" : "🔄";
  return `
    <div class="col-md-6 col-lg-4 mb-3">
      <label class="form-label fw-semibold text-dark">${titulo}</label>
      <div class="form-control bg-light ${color}">
        ${icono} ${valor}
      </div>
    </div>
  `;
}


