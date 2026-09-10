import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// App principal - Consumo de Combustível
const firebaseConfig = {
  apiKey: 'AIzaSyCJ4UkjwJUqm-CfI6DN3bz6O4fxpBCaUck',
  authDomain: 'consumocombustivel-3adda.firebaseapp.com',
  projectId: 'consumocombustivel-3adda',
  storageBucket: 'consumocombustivel-3adda.firebasestorage.app',
  messagingSenderId: '492857361214',
  appId: '1:492857361214:web:c48b5082b203a9fbe8a26f',
  measurementId: 'G-9GH0VHHGZ0',
};

// App secundário - Site de Viagens (somente leitura de `trips`)
const viagensFirebaseConfig = {
  apiKey: 'AIzaSyD4_NPMjW6eiBHgNzaJNIKNLyMLY1tDLhg',
  authDomain: 'sitedeviagens-f1aaa.firebaseapp.com',
  projectId: 'sitedeviagens-f1aaa',
  storageBucket: 'sitedeviagens-f1aaa.firebasestorage.app',
  messagingSenderId: '897898505783',
  appId: '1:897898505783:web:cc53af95d0819500f681b2',
  measurementId: 'G-0Y7BTJPTQM',
};

const app = initializeApp(firebaseConfig);
const viagensApp = initializeApp(viagensFirebaseConfig, 'sitedeviagens');

// Firestore com cache offline (persistente). Se o navegador não suportar,
// cai silenciosamente para o modo online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
export const viagensDb = initializeFirestore(viagensApp, {});
export const storage = getStorage(app);

// Autenticação anônima (best-effort). Necessária SE as regras de segurança
// exigirem request.auth != null (ver firestore.rules / SECURITY.md).
// Se o provedor "Anônimo" não estiver habilitado no console, o app segue
// funcionando com as regras atuais.
export const auth = getAuth(app);
export const authPronta = new Promise((resolve) => {
  let resolvido = false;
  onAuthStateChanged(auth, (user) => {
    if (user && !resolvido) {
      resolvido = true;
      resolve(user);
    }
  });
  signInAnonymously(auth).catch((err) => {
    const esperado =
      err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed';
    if (!esperado) console.warn('Falha no login anônimo:', err.code);
    // esperado = provedor Anônimo ainda não habilitado (ver SECURITY.md) — segue sem auth
    if (!resolvido) {
      resolvido = true;
      resolve(null);
    }
  });
});
