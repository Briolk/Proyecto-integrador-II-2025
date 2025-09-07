// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAoXAcgCf2pSfe5dlmPWh6oRa1LlgOumQw",
  authDomain: "sistema-de-titilacion-sal.firebaseapp.com",
  projectId: "sistema-de-titilacion-sal",
  storageBucket: "sistema-de-titilacion-sal.firebasestorage.app",
  messagingSenderId: "1058220477137",
  appId: "1:1058220477137:web:456fdd1a26a9b96c67d3f0",
  measurementId: "G-C3VG9X7NKC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


