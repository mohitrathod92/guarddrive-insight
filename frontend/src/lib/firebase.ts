import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB140YJ70f7GQNgLHi88hbChixMMGY0WLc",
  authDomain: "drivex-ed339.firebaseapp.com",
  projectId: "drivex-ed339",
  storageBucket: "drivex-ed339.firebasestorage.app",
  messagingSenderId: "749174146771",
  appId: "1:749174146771:web:fa9add206c091521a87626",
  measurementId: "G-SBQ8L8R9VL"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
