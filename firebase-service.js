// firebase-service.js
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { 
  ref, uploadString, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

window.FirebaseService = {
  isAvailable: () => {
    return window.firebaseDB !== undefined;
  },

  // 1. Load all data from Firestore
  loadAllData: async () => {
    if (!window.FirebaseService.isAvailable()) return null;
    const db = window.firebaseDB;
    try {
      const collections = ['clients', 'inventory', 'contracts', 'installments', 'collectorCustodies', 'treasuryTransactions', 'users', 'auditLogs', 'settings'];
      const data = {};
      
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        data[colName] = [];
        querySnapshot.forEach((doc) => {
          data[colName].push(doc.data());
        });
      }
      
      // Settings is usually a single document, handle differently if needed
      if (data.settings && data.settings.length > 0) {
        data.settings = data.settings[0]; // Assuming one settings doc
      } else {
        data.settings = null;
      }

      return data;
    } catch (error) {
      console.error("Firebase Load Error:", error);
      return null;
    }
  },

  // 2. Sync an action to Firestore
  syncAction: async (action, payload) => {
    if (!window.FirebaseService.isAvailable()) return { success: false, reason: 'not_initialized' };
    const db = window.firebaseDB;
    try {
      switch (action) {
        case 'addClient':
          await setDoc(doc(db, "clients", payload.id), payload);
          break;
        case 'updateClient':
          await updateDoc(doc(db, "clients", payload.id), payload);
          break;
        case 'deleteClient':
          await deleteDoc(doc(db, "clients", payload.id));
          break;
          
        case 'addDevice':
          await setDoc(doc(db, "inventory", payload.newDevice.id), payload.newDevice);
          // Also handle transaction if present
          break;
        case 'updateDevice':
          await updateDoc(doc(db, "inventory", payload.id), payload);
          break;
        case 'deleteDevice':
          await deleteDoc(doc(db, "inventory", payload.id));
          break;

        case 'addContract':
          await setDoc(doc(db, "contracts", payload.contract.id), payload.contract);
          // Assuming installments are passed or generated. 
          // For a real app, you might do this in a batch.
          break;
        case 'updateContract':
          await updateDoc(doc(db, "contracts", payload.id), payload);
          break;
        case 'deleteContract':
          await deleteDoc(doc(db, "contracts", payload.id));
          // Delete related installments too
          break;

        // ... Add other cases (transactions, users, audit logs) ...
        case 'addAuditLog':
          // Use timestamp as ID or generate random
          const logId = 'log_' + Date.now();
          await setDoc(doc(db, "auditLogs", logId), payload);
          break;

        default:
          console.warn("Firebase sync action not fully implemented yet:", action);
          break;
      }
      return { success: true };
    } catch (error) {
      console.error("Firebase Sync Error:", error);
      return { success: false, error: error.message };
    }
  },

  // 3. Upload Image to Firebase Storage securely
  uploadImage: async (base64Data, folder, filename) => {
    if (!window.FirebaseService.isAvailable()) return base64Data;
    if (!base64Data) return null;
    if (!base64Data.startsWith('data:image')) return base64Data; // Already a URL
    
    // تم إيقاف الرفع إلى Firebase Storage لأن خطة Firebase المجانية أصبحت تطلب بطاقة بنكية للتفعيل.
    // للنسخة التجريبية الحالية سنكتفي بإرجاع الصورة كنص (Base64) لحفظها مباشرة في قاعدة البيانات.
    return base64Data;
  }
};
