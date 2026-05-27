// firebase.ts - الإعداد والربط المركزي لقاعدة بيانات وخدمة الهوية لـ SNNS.PRO
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  collection, addDoc, getDocs, query, where, 
  orderBy, onSnapshot, limit, serverTimestamp
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Database ID from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Authentication helpers
export const googleProvider = new GoogleAuthProvider();

export { 
  doc, getDoc, setDoc, updateDoc, 
  collection, addDoc, getDocs, query, where, 
  orderBy, onSnapshot, limit, serverTimestamp,
  signInWithPopup, signOut
};
