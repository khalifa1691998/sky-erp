// firebase-config.js
// --- إعدادات Firebase ---
// سيتم وضع مفاتيح الربط هنا لاحقاً بعد إنشاء مشروع Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// استبدل هذا الكود لاحقاً بالكود الخاص بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyC0UmVMet6emQSY7ZjlGmAOYlEen_sJn8o",
  authDomain: "sky-erp-89b78.firebaseapp.com",
  projectId: "sky-erp-89b78",
  storageBucket: "sky-erp-89b78.firebasestorage.app",
  messagingSenderId: "592994986030",
  appId: "1:592994986030:web:68c6f6a62b097b1d0757bf"
};

let app, db, storage, auth;

try {
  // تفعيل Firebase إذا كانت الإعدادات متوفرة
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is missing. App is running in Local Mode only.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// جعل كائنات Firebase متاحة عالمياً لباقي النظام
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseStorage = storage;
window.firebaseAuth = auth;
