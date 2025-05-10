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
    apiKey: "AIzaSyDnEbnJRyo-Vu3eHmi9dWM4Fgo0waO77PU",
    authDomain: "otmt-admin-panel.firebaseapp.com",
    projectId: "otmt-admin-panel",
    storageBucket: "otmt-admin-panel.firebasestorage.app",
    messagingSenderId: "762065450762",
    appId: "1:762065450762:web:975bcf0768015e9e2decf3",
    measurementId: "G-KK22KHF2VV"
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
