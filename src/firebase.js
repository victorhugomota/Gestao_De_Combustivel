import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// App principal - Consumo de Combustível
const firebaseConfig = {
  apiKey: "AIzaSyCJ4UkjwJUqm-CfI6DN3bz6O4fxpBCaUck",
  authDomain: "consumocombustivel-3adda.firebaseapp.com",
  projectId: "consumocombustivel-3adda",
  storageBucket: "consumocombustivel-3adda.firebasestorage.app",
  messagingSenderId: "492857361214",
  appId: "1:492857361214:web:c48b5082b203a9fbe8a26f",
  measurementId: "G-9GH0VHHGZ0"
};

// App secundário - Site de Viagens
const viagensFirebaseConfig = {
  apiKey: "AIzaSyD4_NPMjW6eiBHgNzaJNIKNLyMLY1tDLhg",
  authDomain: "sitedeviagens-f1aaa.firebaseapp.com",
  projectId: "sitedeviagens-f1aaa",
  storageBucket: "sitedeviagens-f1aaa.firebasestorage.app",
  messagingSenderId: "897898505783",
  appId: "1:897898505783:web:cc53af95d0819500f681b2",
  measurementId: "G-0Y7BTJPTQM"
};

// Inicializar apps
const app = initializeApp(firebaseConfig);
const viagensApp = initializeApp(viagensFirebaseConfig, "sitedeviagens");

// Exportar instâncias
export const db = getFirestore(app);
export const viagensDb = getFirestore(viagensApp);
export const storage = getStorage(app);
