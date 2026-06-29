// firebase-config.js
// --- إعدادات Firebase ---

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0UmVMet6emQSY7ZjlGmAOYlEen_sJn8o",
  authDomain: "sky-erp-89b78.firebaseapp.com",
  projectId: "sky-erp-89b78",
  storageBucket: "sky-erp-89b78.firebasestorage.app",
  messagingSenderId: "592994986030",
  appId: "1:592994986030:web:68c6f6a62b097b1d0757bf"
};

let app, db, storage, auth;
let firebaseReady = false;

// Initialize Firebase with error handling
export async function initFirebase() {
  try {
    if (!Object.keys(firebaseConfig).length) {
      console.warn("❌ Firebase config is missing. Running in Local Mode only.");
      firebaseReady = false;
      return false;
    }

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

    // Enable offline persistence for Firestore
    try {
      await enableIndexedDbPersistence(db);
      console.log("✅ Firestore offline persistence enabled");
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn("⚠️ Multiple tabs open, offline persistence disabled");
      } else if (err.code === 'unimplemented') {
        console.warn("⚠️ Browser doesn't support offline persistence");
      }
    }

    console.log("✅ Firebase initialized successfully");
    firebaseReady = true;
    
    // Make available globally
    window.firebaseApp = app;
    window.firebaseDB = db;
    window.firebaseStorage = storage;
    window.firebaseAuth = auth;
    window.firebaseReady = true;

    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    firebaseReady = false;
    window.firebaseReady = false;
    return false;
  }
}

// Check if Firebase is ready
export function isFirebaseReady() {
  return firebaseReady;
}

// Get Firebase instances
export { app, db, storage, auth };

// Initialize on module load
initFirebase().catch(err => console.error("Failed to initialize Firebase:", err));
