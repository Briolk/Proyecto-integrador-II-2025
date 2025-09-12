import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  getDoc, getFirestore, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// DOM
const usuariosTabla = document.getElementById("usuariosTabla");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnMostrarFormulario = document.getElementById("btnMostrarFormulario");
const formularioRegistro = document.getElementById("formularioRegistro");
const btnGuardarUsuario = document.getElementById("btnGuardarUsuario");
const rolSelect = document.getElementById("rol");

// Mostrar y ocultar formulario
btnMostrarFormulario.addEventListener("click", () => {
  formularioRegistro.classList.toggle("d-none");
});

// Mostrar campos según el rol
rolSelect.addEventListener("change", () => {
  const rol = rolSelect.value;
  document.querySelectorAll(".estudiante-campo").forEach(e =>
    e.classList.toggle("d-none", rol !== "estudiante")
  );
  document.querySelectorAll(".docente-campo").forEach(e =>
    e.classList.toggle("d-none", rol !== "docente")
  );
});

// Registrar usuario (Auth + Firestore)
btnGuardarUsuario.addEventListener("click", async () => {
  const rol = rolSelect.value;
  const nombres = document.getElementById("nombres").value;
  const apellidos = document.getElementById("apellidos").value;
  const ru = document.getElementById("ru").value;
  const carnet = document.getElementById("carnet").value;
  const email = document.getElementById("correo").value;
  const celular = document.getElementById("celular").value;

  const usuario = {
    rol,
    nombres,
    apellidos,
    ru,
    carnet,
    email,
    celular
  };

  if (rol === "estudiante") {
    usuario.carrera = document.getElementById("carrera").value;
  } else if (rol === "docente") {
    usuario.especialidad = document.getElementById("especialidad").value;
    usuario.paralelo = document.getElementById("paralelo").value;
  }

  try {
    // 1. Crear usuario en Authentication
    const credencial = await createUserWithEmailAndPassword(auth, email, carnet);
    const uid = credencial.user.uid;

    // 2. Guardar datos en Firestore con el mismo UID
    await setDoc(doc(db, "usuarios", uid), usuario);

    alert("Usuario registrado correctamente");
    formularioRegistro.classList.add("d-none");
    window.cargarUsuarios();
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    alert("Error: " + error.message);
  }
});

const form = document.getElementById("formUsuario");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("usuarioId")?.value; // obtener id oculto (si existe)
  const rol = document.getElementById("tipoUsuario").value;
  const nombres = document.getElementById("nombresEdi").value.trim();
  const apellidos = document.getElementById("apellidosEdi").value.trim();
  const ru = document.getElementById("ruEdi").value.trim();
  const carnet = document.getElementById("carnetEdi").value.trim();
  const email = document.getElementById("emailEdi").value.trim();
  const carrera = document.getElementById("carreraEdi").value.trim();
  const especialidad = document.getElementById("especialidadEdi").value.trim();

  const usuario = {
    rol,
    nombres,
    apellidos,
    ru,
    carnet,
    email,
  };

  if (rol === "estudiante") {
    usuario.carrera = carrera;
  } else if (rol === "docente") {
    usuario.especialidad = especialidad;
  }

  try {
    if (id) {
        // === MODO EDICIÓN ===
        await setDoc(doc(db, "usuarios", id), usuario, { merge: true });
        alert("Usuario actualizado correctamente");
    } else {
        // === MODO CREACIÓN ===
        // Verifica si ya existe un usuario con ese email (opcional)
        const credencial = await createUserWithEmailAndPassword(auth, email, carnet);
        const uid = credencial.user.uid;

        await setDoc(doc(db, "usuarios", uid), usuario);
        alert("Usuario registrado correctamente");
    }

    form.reset();
    ocultarFormulario();

    if (typeof cargarUsuarios === "function") {
        cargarUsuarios();
    }

    } catch (error) {
    if (error.code === "auth/email-already-in-use") {
        alert("Este correo ya está registrado. Intenta con otro.");
    } else {
        console.error("Error al guardar usuario:", error);
        alert("Error: " + error.message);
    }
    }
});


document.addEventListener("DOMContentLoaded", () => {
  const formEstudiante = document.getElementById("formEstudiante");
  if (formEstudiante) {
    formEstudiante.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        nombres: form.nombres.value,
        apellidos: form.apellidos.value,
        ru: form.ru.value,
        carnet: form.carnet.value,
        email: form.email.value,
        celular: form.celular.value,
        carrera: form.carrera.value
      };
      crearUsuario(data, "estudiante");
      form.reset();
    });
  }

  const formDocente = document.getElementById("formDocente");
  if (formDocente) {
    formDocente.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        nombres: form.nombres.value,
        apellidos: form.apellidos.value,
        ru: form.ru.value,
        carnet: form.carnet.value,
        email: form.email.value,
        celular: form.celular.value,
        especialidad: form.especialidad.value,
        paralelo: form.paralelo.value
      };
      crearUsuario(data, "docente");
      form.reset();
    });
  }
});


// Mostrar u ocultar formulario según ID
window.mostrarFormulario = function(tipo) {
  const formulario = document.getElementById("formularioUsuario");
  if (!formulario) {
    console.error("No se encontró el formulario con id 'formularioUsuario'");
    return;
  }

  formulario.classList.remove("d-none");
  document.getElementById("tipoUsuario").value = tipo;

  // Mostrar/Ocultar campos según tipo
  const camposEstudiante = document.querySelectorAll(".estudiante-campo");
  const camposDocente = document.querySelectorAll(".docente-campo");

  if (tipo === "estudiante") {
    camposEstudiante.forEach(c => c.classList.remove("d-none"));
    camposDocente.forEach(c => c.classList.add("d-none"));
  } else if (tipo === "docente") {
    camposEstudiante.forEach(c => c.classList.add("d-none"));
    camposDocente.forEach(c => c.classList.remove("d-none"));
  }
};

window.ocultarFormulario = function() {
  document.getElementById('formularioUsuario')?.classList.add('d-none');
}

window.mostrarFormularioEditar = async function(id) {
  try {
    const docRef = doc(db, "usuarios", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Usuario no encontrado");
      return;
    }

    const user = docSnap.data();
    console.log("Usuario cargado: ", user);

    // Mostrar formulario con campos según rol (hacer esto ANTES de asignar los valores)
    window.mostrarFormulario(user.rol);

    // Mostrar el formulario
    const formulario = document.getElementById("formUsuario");
    formulario.classList.remove("d-none");

    // Cambiar título
    document.getElementById("formularioTitulo").textContent = "Editar Usuario";

    // Rellenar campos comunes
    document.getElementById("tipoUsuario").value = user.rol || "";
    document.getElementById("nombresEdi").value = user.nombres || "";
    document.getElementById("apellidosEdi").value = user.apellidos || "";
    document.getElementById("ruEdi").value = user.ru || "";
    document.getElementById("carnetEdi").value = user.carnet || "";
    document.getElementById("emailEdi").value = user.email || "";

    // Rellenar campos según rol
    if (user.rol === "estudiante") {
      document.getElementById("carreraEdi").value = user.carrera || "";
      //document.getElementById("especialidadEdi").value = "";
    } else if (user.rol === "docente") {
      document.getElementById("especialidadEdi").value = user.especialidad || "";
      document.getElementById("carreraEdi").value = "";
    }

    // Guardar el ID oculto
    let inputId = document.getElementById("usuarioId");
    if (!inputId) {
      inputId = document.createElement("input");
      inputId.type = "hidden";
      inputId.id = "usuarioId";
      inputId.name = "usuarioId";
      document.getElementById("formUsuario").appendChild(inputId);
    }
    inputId.value = id;

  } catch (error) {
    alert("Error al cargar usuario: " + error.message);
  }
};


// Mostrar usuarios desde Firestore
function mostrarUsuarios(usuarios) {
  usuariosTabla.innerHTML = "";

  if (usuarios.length === 0) {
    usuariosTabla.innerHTML = `<tr><td colspan="4">No hay usuarios registrados.</td></tr>`;
    return;
  }

  usuarios.forEach((user) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${user.rol}</td>
      <td>${user.nombres} ${user.apellidos}</td>
      <td>${user.ru}</td>
      <td>${user.email}</td>
    `;
    usuariosTabla.appendChild(fila);
  });
}

window.cargarUsuarios = async function () {
  const tablaEstudiantes = document.getElementById("tablaEstudiantes");
  const tablaDocentes = document.getElementById("tablaDocentes");

  tablaEstudiantes.innerHTML = "";
  tablaDocentes.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    const usuarios = querySnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() }; // Incluimos el id para usarlo en botones
    });

    const estudiantes = usuarios.filter(u => u.rol === "estudiante");
    const docentes = usuarios.filter(u => u.rol === "docente");

    // Mostrar estudiantes
    if (estudiantes.length === 0) {
      tablaEstudiantes.innerHTML = `<tr><td colspan="5">No hay estudiantes registrados.</td></tr>`;
    } else {
      estudiantes.forEach(user => {
        tablaEstudiantes.innerHTML += `
          <tr>
            <td>${user.nombres} ${user.apellidos}</td>
            <td>${user.ru}</td>
            <td>${user.email}</td>
            <td>${user.carrera || '-'}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario('${user.id}')">✏️ Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario('${user.id}')">🗑️ Eliminar</button>
            </td>
          </tr>`;
      });
    }

    // Mostrar docentes
    if (docentes.length === 0) {
      tablaDocentes.innerHTML = `<tr><td colspan="5">No hay docentes registrados.</td></tr>`;
    } else {
      docentes.forEach(user => {
        tablaDocentes.innerHTML += `
          <tr>
            <td>${user.nombres} ${user.apellidos}</td>
            <td>${user.ru}</td>
            <td>${user.email}</td>
            <td>${user.especialidad || '-'}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario('${user.id}')">✏️ Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario('${user.id}')">🗑️ Eliminar</button>
            </td>
          </tr>`;
      });
    }

  } catch (error) {
    tablaEstudiantes.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    tablaDocentes.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
  }
};

window.editarUsuario = function(id) {
  if (!id) {
    console.error("ID de usuario no proporcionado para editar.");
    return;
  }
  if (typeof mostrarFormularioEditar !== "function") {
    console.error("La función mostrarFormularioEditar no está definida.");
    return;
  }
  console.log("Editar usuario con id:", id);
  mostrarFormularioEditar(id);
};

window.eliminarUsuario = async function(id) {
  if (confirm("¿Estás seguro de eliminar este usuario?")) {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      alert("Usuario eliminado correctamente.");
      cargarUsuarios(); // recargar la tabla para actualizar
    } catch (error) {
      alert("Error al eliminar usuario: " + error.message);
    }
  }
};


// Cerrar sesión
window.cerrarSesion = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};

//Autenticación y validación de admin

onAuthStateChanged(auth, async user => {
  if (user) {
    try {
      const docSnap = await getDoc(doc(db, "usuarios", user.uid));
      if (!docSnap.exists() || docSnap.data().rol !== "admin") {
        alert("Acceso restringido a administradores.");
        return window.location.href = "login.html";
      }
      window.cargarUsuarios();
    } catch (error) {
      console.error("Error al verificar rol:", error);
      alert("Error al verificar usuario.");
      window.location.href = "login.html";
    }
  } else {
    window.location.href = "login.html";
  }
});

////--------------------------------------------
window.mostrarFormularioEtapa = mostrarFormularioEtapa;
window.ocultarFormularioEtapa = ocultarFormularioEtapa;


const coleccionEtapas = collection(db, "etapas");

const tablaEtapas = document.getElementById("tablaEtapas");
const formularioContainer = document.getElementById("formularioEtapaContainer");
const formEtapa = document.getElementById("formEtapa");

function mostrarFormularioEtapa() {
  formularioContainer.style.display = "block";
  formEtapa.reset();
  document.getElementById("etapaId").value = "";
}

function ocultarFormularioEtapa() {
  formularioContainer.style.display = "none";
  formEtapa.reset();
  document.getElementById("etapaId").value = "";
}

async function cargarEtapas() {
  tablaEtapas.innerHTML = "";
  try {
    const snapshot = await getDocs(coleccionEtapas);
    if (snapshot.empty) {
      tablaEtapas.innerHTML = `<tr><td colspan="10">No hay etapas registradas.</td></tr>`; // ahora son 10 columnas
      return;
    }
    // Ordenar por campo "orden"
    const etapasOrdenadas = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.orden - b.orden);

    etapasOrdenadas.forEach(etapa => {
      tablaEtapas.innerHTML += `
        <tr>
          <td>${etapa.nombreEtapa}</td>
          <td>${etapa.orden}</td>
          <td>${etapa.estadoPrimeraEntrega}</td>
          <td>${etapa.fechaLimitePrimeraEntrega}</td>
          <td>${etapa.estadoSegundaEntrega}</td>
          <td>${etapa.fechaLimiteSegundaEntrega}</td>
          <td>${etapa.estadoEntregaFinal}</td>
          <td>${etapa.fechaLimiteEntregaFinal}</td>
          <td>${etapa.paralelo || ""}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editarEtapa('${etapa.id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="eliminarEtapa('${etapa.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error cargando etapas:", error);
    tablaEtapas.innerHTML = `<tr><td colspan="10">Error al cargar etapas.</td></tr>`;
  }
}


window.guardarEtapa = async function (e) {
  e.preventDefault();

  const id = document.getElementById("etapaId").value;
  const nombreEtapa = document.getElementById("nombreEtapa").value.trim();

  // parseInt puede devolver NaN, chequear después
  const ordenRaw = document.getElementById("orden").value;
  const orden = parseInt(ordenRaw, 10);

  const estadoPrimeraEntrega = document.getElementById("estadoPrimeraEntrega").value;
  const fechaLimitePrimeraEntrega = document.getElementById("fechaLimitePrimeraEntrega").value;
  const estadoSegundaEntrega = document.getElementById("estadoSegundaEntrega").value;
  const fechaLimiteSegundaEntrega = document.getElementById("fechaLimiteSegundaEntrega").value;
  const estadoEntregaFinal = document.getElementById("estadoEntregaFinal").value;
  const fechaLimiteEntregaFinal = document.getElementById("fechaLimiteEntregaFinal").value;
  const paralelo = document.getElementById("paraleloEtapa").value.trim();

  // Validación mejorada para orden
  if (
    !nombreEtapa ||
    !ordenRaw || // se asegura que orden no esté vacío
    Number.isNaN(orden) || // parseInt devolvió NaN
    orden <= 0 ||
    !estadoPrimeraEntrega ||
    !fechaLimitePrimeraEntrega ||
    !estadoSegundaEntrega ||
    !fechaLimiteSegundaEntrega ||
    !estadoEntregaFinal ||
    !fechaLimiteEntregaFinal ||
    !paralelo
  ) {
    alert("Por favor complete todos los campos correctamente.");
    console.log({
      nombreEtapa,
      ordenRaw,
      orden,
      estadoPrimeraEntrega,
      fechaLimitePrimeraEntrega,
      estadoSegundaEntrega,
      fechaLimiteSegundaEntrega,
      estadoEntregaFinal,
      fechaLimiteEntregaFinal,
      paralelo,
    });
    return;
  }

  const etapaData = {
    nombreEtapa,
    orden,
    estadoPrimeraEntrega,
    fechaLimitePrimeraEntrega,
    estadoSegundaEntrega,
    fechaLimiteSegundaEntrega,
    estadoEntregaFinal,
    fechaLimiteEntregaFinal,
    paralelo,
  };

  try {
    if (id) {
      // Actualizar etapa
      const etapaRef = doc(db, "etapas", id);
      await updateDoc(etapaRef, etapaData);
      alert("Etapa actualizada correctamente.");
    } else {
      // Crear nueva etapa
      await addDoc(coleccionEtapas, etapaData);
      alert("Etapa creada correctamente.");
    }
    ocultarFormularioEtapa();
    cargarEtapas();
  } catch (error) {
    console.error("Error guardando etapa:", error);
    alert("Error al guardar la etapa. Intente nuevamente.");
  }
};



window.editarEtapa = async function(id) {
  try {
    const etapaRef = doc(db, "etapas", id);
    const etapaSnap = await getDoc(etapaRef);
    if (!etapaSnap.exists()) {
      alert("No se encontró la etapa.");
      return;
    }
    const etapa = etapaSnap.data();

    mostrarFormularioEtapa();
    document.getElementById("etapaId").value = id;
    document.getElementById("nombreEtapa").value = etapa.nombreEtapa || "";
    document.getElementById("orden").value = etapa.orden || 1;
    document.getElementById("estadoPrimeraEntrega").value = etapa.estadoPrimeraEntrega || "";
    document.getElementById("fechaLimitePrimeraEntrega").value = etapa.fechaLimitePrimeraEntrega || "";
    document.getElementById("estadoSegundaEntrega").value = etapa.estadoSegundaEntrega || "";
    document.getElementById("fechaLimiteSegundaEntrega").value = etapa.fechaLimiteSegundaEntrega || "";
    document.getElementById("estadoEntregaFinal").value = etapa.estadoEntregaFinal || "";
    document.getElementById("fechaLimiteEntregaFinal").value = etapa.fechaLimiteEntregaFinal || "";
    document.getElementById("paraleloEtapa").value = etapa.paralelo || "";
  } catch (error) {
    console.error("Error obteniendo etapa para editar:", error);
    alert("Error al cargar datos de la etapa.");
  }
}


window.eliminarEtapa=async function(id) {
  if (!confirm("¿Está seguro que desea eliminar esta etapa?")) return;
  try {
    await deleteDoc(doc(db, "etapas", id));
    alert("Etapa eliminada.");
    cargarEtapas();
  } catch (error) {
    console.error("Error eliminando etapa:", error);
    alert("No se pudo eliminar la etapa.");
  }
}

// Event listener para guardar
formEtapa.addEventListener("submit", guardarEtapa);

// Cargar las etapas al cargar la página
window.addEventListener("DOMContentLoaded", cargarEtapas);


///*--------------------------------Panel de seguimiento de titulacion---------------------------*/
window.buscarEstudiante = async function () {
  const ru = document.getElementById("ruEstudiante").value.trim();
  if (!ru) return alert("Ingresa un RU válido");

  const q = query(collection(db, "usuarios"), where("ru", "==", ru));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return alert("Estudiante no encontrado");

  const docEstudiante = querySnapshot.docs[0];
  const estudiante = docEstudiante.data();
  estudiante.id = docEstudiante.id;

  document.getElementById("datosEstudiante").style.display = "block";
  document.getElementById("nombreEstudiante").textContent = estudiante.nombres;
  document.getElementById("ruMostrado").textContent = estudiante.ru;

  // Cargar paralelos y docentes disponibles
  await cargarParalelosDisponibles();
  await cargarDocentesDisponibles();

  // Asignar valores en los selects con los datos del estudiante
  document.getElementById("paraleloAsignado").value = estudiante.paralelo || "";
  document.getElementById("tutorAsignado").value = estudiante.tutorId || "";
  document.getElementById("relatorAsignado").value = estudiante.relatorId || "";

  // Mostrar nombres de docentes asignados
  await mostrarNombresDocentes(estudiante.tutorId, estudiante.relatorId);

  await cargarDocentesDisponibles();

  // Cargar etapas del proceso de titulación
  cargarEtapasProceso(estudiante);
};


let etapas = [];

async function cargarEtapasProceso(estudiante) {
  const contenedor = document.getElementById("contenedorEtapas");
  contenedor.innerHTML = "";

  // Cargar etapas ordenadas
  const etapasSnapshot = await getDocs(collection(db, "etapas"));
  etapas = etapasSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  etapas.sort((a, b) => a.orden - b.orden);

  // Cargar entregas
  const entregasDoc = await getDoc(doc(db, "usuarios", estudiante.id, "seguimiento", "entregas"));
  const entregasData = entregasDoc.exists() ? entregasDoc.data() : {};

  let puedeEditar = true;

  for (const etapa of etapas) {
    const e = entregasData[etapa.orden] || {
      primera: "Pendiente",
      segunda: "Pendiente",
      final: "Pendiente"
    };

    const completadaEtapa = Object.values(e).every(val => val === "Completado");

    const bloqueada = !puedeEditar;

    const card = document.createElement("div");
    card.className = "card mb-3";
    card.innerHTML = `
      <div class="card-header header-azul-amarillo">
        Etapa ${etapa.orden}: ${etapa.nombreEtapa}
      </div>
      <div class="card-body">
        <div class="row g-3">
          ${crearEntrega(estudiante.id, etapa.orden, "primera", "1ª Entrega", e.primera, bloqueada)}
          ${crearEntrega(estudiante.id, etapa.orden, "segunda", "2ª Entrega", e.segunda, bloqueada)}
          ${crearEntrega(estudiante.id, etapa.orden, "final", "Entrega Final", e.final, bloqueada)}
        </div>
      </div>
    `;

    contenedor.appendChild(card);
    if (!completadaEtapa) puedeEditar = false;
  }
}

function crearEntrega(estudianteId, orden, tipo, titulo, valor, bloqueado) {
  const disabled = bloqueado ? "disabled" : "";
  const id = `entrega-${orden}-${tipo}`;
  return `
    <div class="col-md-6 col-lg-4 mb-3">
        <label for="${id}" class="form-label fw-semibold text-dark">${titulo}</label>
        <select 
            class="form-select border-2 shadow-sm" 
            id="${id}" 
            onchange="actualizarEntrega('${estudianteId}', ${orden}, '${tipo}')" 
            ${disabled}
        >
            <option value="Pendiente" ${valor === "Pendiente" ? "selected" : ""}>🔄 Pendiente</option>
            <option value="Completado" ${valor === "Completado" ? "selected" : ""}>✅ Completado</option>
        </select>
    </div>
  `;
}

window.actualizarEntrega=async function (estudianteId, orden, tipo) {
  const selectId = `entrega-${orden}-${tipo}`;
  const valor = document.getElementById(selectId).value;

  const docRef = doc(db, "usuarios", estudianteId, "seguimiento", "entregas");
  const docSnap = await getDoc(docRef);
  const data = docSnap.exists() ? docSnap.data() : {};

  if (!data[orden]) data[orden] = { primera: "Pendiente", segunda: "Pendiente", final: "Pendiente" };
  data[orden][tipo] = valor;

  await setDoc(docRef, data);
  alert(`Actualizado: Etapa ${orden} - ${tipo} = ${valor}`);

  buscarEstudiante(); // recargar
}

window.asignarParalelo = async function () {
  const paralelo = document.getElementById("paraleloAsignado").value.trim();
  if (!paralelo) return alert("Ingresa un paralelo válido");

  const ru = document.getElementById("ruEstudiante").value.trim();
  const q = query(collection(db, "usuarios"), where("ru", "==", ru));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return alert("Estudiante no encontrado");

  const docEstudiante = querySnapshot.docs[0];
  const estudianteRef = doc(db, "usuarios", docEstudiante.id);

  try {
    await updateDoc(estudianteRef, { paralelo });
    alert("Paralelo asignado correctamente");

    // Volver a cargar el estudiante y sus etapas
    window.buscarEstudiante(); 
  } catch (error) {
    console.error("Error al asignar paralelo:", error);
    alert("Ocurrió un error al asignar el paralelo.");
  }
};

window.cargarParalelosDisponibles=async function() {
  const etapasSnapshot = await getDocs(collection(db, "etapas"));
  const paralelosSet = new Set();

  etapasSnapshot.forEach((doc) => {
    const etapa = doc.data();
    if (etapa.paralelo) {
      paralelosSet.add(etapa.paralelo.trim().toUpperCase());
    }
  });

  const paraleloSelect = document.getElementById("paraleloAsignado");
  paraleloSelect.innerHTML = `<option value="" disabled selected>-- Selecciona un paralelo --</option>`;
  paralelosSet.forEach((paralelo) => {
    const option = document.createElement("option");
    option.value = paralelo;
    option.textContent = paralelo;
    paraleloSelect.appendChild(option);
  });
}

window.mostrarNombresDocentes=async function (tutorId, relatorId) {
  const nombreTutorSpan = document.getElementById("nombreTutorAsignado");
  const nombreRelatorSpan = document.getElementById("nombreRelatorAsignado");

  if (tutorId) {
    const docTutor = await getDoc(doc(db, "usuarios", tutorId));
    const tutorData = docTutor.data();
    nombreTutorSpan.textContent = `${tutorData.nombres} ${tutorData.apellidos}`;
  } else {
    nombreTutorSpan.textContent = "No asignado";
  }

  if (relatorId) {
    const docRelator = await getDoc(doc(db, "usuarios", relatorId));
    const relatorData = docRelator.data();
    nombreRelatorSpan.textContent = `${relatorData.nombres} ${relatorData.apellidos}`;
  } else {
    nombreRelatorSpan.textContent = "No asignado";
  }
}

async function cargarDocentesDisponibles() {
  const selectTutor = document.getElementById("tutorAsignado");
  const selectRelator = document.getElementById("relatorAsignado");

  // Limpia opciones excepto la primera (placeholder)
  selectTutor.length = 1; 
  selectRelator.length = 1;

  try {
    const q = query(collection(db, "usuarios"), where("rol", "==", "docente"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      const docente = doc.data();
      const optionTutor = document.createElement("option");
      optionTutor.value = doc.id;
      optionTutor.textContent = docente.nombres + " " + (docente.apellidos || "");
      selectTutor.appendChild(optionTutor);

      const optionRelator = document.createElement("option");
      optionRelator.value = doc.id;
      optionRelator.textContent = docente.nombres + " " + (docente.apellidos || "");
      selectRelator.appendChild(optionRelator);
    });
  } catch (error) {
    console.error("Error cargando docentes: ", error);
  }
}


window.asignarDocentes=async function () {
  const tutorId = document.getElementById("tutorAsignado").value;
  const relatorId = document.getElementById("relatorAsignado").value;

  const ru = document.getElementById("ruMostrado").textContent;
  if (!ru) {
    alert("No hay estudiante cargado para asignar docentes.");
    return;
  }

  try {
    // Buscar el documento del estudiante por RU para obtener su ID de Firestore
    const q = query(collection(db, "usuarios"), where("ru", "==", ru));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      alert("Estudiante no encontrado en la base de datos.");
      return;
    }
    const docEstudiante = querySnapshot.docs[0];

    // Actualizar campos tutorId y relatorId
    await updateDoc(doc(db, "usuarios", docEstudiante.id), {
      tutorId: tutorId || null,
      relatorId: relatorId || null,
    });

    alert("Docentes asignados correctamente.");

    // Actualizar nombres visibles en la interfaz
    await mostrarNombresDocentes(tutorId, relatorId);

  } catch (error) {
    console.error("Error al asignar docentes:", error);
    alert("Error al asignar docentes, revisa la consola.");
  }
}






