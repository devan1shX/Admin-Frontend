import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIBFEtRpwjgeE551E6KLw6xD3YgdDNnOc",
  authDomain: "admin-panel-otmt.firebaseapp.com",
  projectId: "admin-panel-otmt",
  storageBucket: "admin-panel-otmt.firebasestorage.app",
  messagingSenderId: "931933790064",
  appId: "1:931933790064:web:fcd5d1fc6da3c12f9fb9b5",
  measurementId: "G-D77J2R188F"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
};

export const API_BASE_URL = "http://192.168.1.148:5001";
