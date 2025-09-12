// login.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDiv = document.getElementById("loginError");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Buscar el rol en la colección "usuarios"
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const rol = data.rol;

      // Redirección según el rol
      if (rol === "admin") {
        window.location.href = "admin.html";
      } else if (rol === "docente") {
        window.location.href = "docente.html";
      } else if (rol === "estudiante") {
        window.location.href = "estudiante.html";
      } else {
        window.location.href = "admin.html";
        //errorDiv.textContent = "Rol de usuario no válido.";
      }
    } else {
      window.location.href = "admin.html";
      //errorDiv.textContent = "No se encontró información del usuario.";
    }

  } catch (error) {
    errorDiv.textContent = "Error al iniciar sesión: " + error.message;
  }
});
