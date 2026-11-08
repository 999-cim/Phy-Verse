import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA15uqgoTgyX9Rh4kjA183dTiV6xXC7Qbw",
  authDomain: "phy-verse.firebaseapp.com",
  projectId: "phy-verse",
  storageBucket: "phy-verse.firebasestorage.app",
  messagingSenderId: "165711125128",
  appId: "1:165711125128:web:06e64e28ec4b4f01f1dd3d",
  measurementId: "G-5FR4QRL9ZX"
};

export const isFirebaseConfigured = true;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
