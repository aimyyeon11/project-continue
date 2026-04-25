import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Replace these with your Firebase project credentials.
// console.firebase.google.com → Project settings → General → Your apps
const firebaseConfig = {
  apiKey: "AIzaSyA178Nwu0NadaaAXKFgQfbp3FBmEV2lLrk",
  authDomain: "smez-d9a8c.firebaseapp.com",
  projectId: "smez-d9a8c",
  storageBucket: "smez-d9a8c.firebasestorage.app",
  messagingSenderId: "49863968616",
  appId: "1:49863968616:web:9562fef35a4341a47238dd",
  measurementId: "G-HV04B1YZBP",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force account selection every time
googleProvider.setCustomParameters({
  prompt: "select_account",
});

