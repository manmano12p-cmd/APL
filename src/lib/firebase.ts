// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getDatabase } from "firebase/database";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAof7gj6MpaEYPTPsH5rjqtdK4iduITIvU",
  authDomain: "pomodoro-14b48.firebaseapp.com",
  databaseURL: "https://pomodoro-14b48-default-rtdb.firebaseio.com",
  projectId: "pomodoro-14b48",
  storageBucket: "pomodoro-14b48.firebasestorage.app",
  messagingSenderId: "201759244224",
  appId: "1:201759244224:web:8c1ff9fa33b9312480d225",
  measurementId: "G-3VCB3BFLYK"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
    return signInWithPopup(auth, provider);
}

export const signOut = () => {
    return firebaseSignOut(auth);
}

export { auth, db };
