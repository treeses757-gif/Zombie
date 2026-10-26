// Инициализация Firebase. Экспортирует db, auth, ensureAuth и хелперы.
import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, set, get, update, remove, onValue, onDisconnect, push, serverTimestamp
} from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJQT4aNZvoKZQG7oJK91IIGn6owaRN7k8",
  authDomain: "zombieproject-1f8ae.firebaseapp.com",
  databaseURL: "https://zombieproject-1f8ae-default-rtdb.firebaseio.com",
  projectId: "zombieproject-1f8ae",
  storageBucket: "zombieproject-1f8ae.firebasestorage.app",
  messagingSenderId: "1082479915259",
  appId: "1:1082479915259:web:a74df5c62ca6a86339c05e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Гарантирует анонимный вход, возвращает user
export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user); }
    });
    signInAnonymously(auth).catch((e) => { unsub(); reject(e); });
  });
}

export { ref, set, get, update, remove, onValue, onDisconnect, push, serverTimestamp };