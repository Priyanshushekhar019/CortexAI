// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexai-54a5c.firebaseapp.com",
  projectId: "cortexai-54a5c",
  storageBucket: "cortexai-54a5c.firebasestorage.app",
  messagingSenderId: "1014638696380",
  appId: "1:1014638696380:web:bdb05470aff4b8efc4bdb9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()