import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4TEo9Ec4JsAj8aeiez8GodtTTs9oOVoM",
  authDomain: "drivex-5bf66.firebaseapp.com",
  projectId: "drivex-5bf66",
  storageBucket: "drivex-5bf66.firebasestorage.app",
  messagingSenderId: "393658774994",
  appId: "1:393658774994:web:91fbf40b7cf49e1cc9040b",
  measurementId: "G-3LP60JKXS5"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
