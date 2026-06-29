// firebase-service.js
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { 
  ref, uploadString, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

window.FirebaseService = {
  isAvailable: () => {
    return window.firebaseReady === true && window.firebaseDB !== undefined;
  },

  // 1. Load all data from Firestore with proper document IDs
  loadAllData: async () => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn("⚠️ Firebase not available - using local data only");
      return null;
    }

    const db = window.firebaseDB;
    try {
      const collections = [
        'clients', 
        'inventory', 
        'contracts', 
        'installments', 
        'collectorCustodies', 
        'treasuryTransactions', 
        'users', 
        'auditLogs', 
        'settings'
      ];
      
      const data = {};
      
      for (const colName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, colName));
          data[colName] = [];
          
          querySnapshot.forEach((document) => {
            const docData = document.data();
            // IMPORTANT: Include the document ID!
            docData.id = document.id;
            data[colName].push(docData);
          });
          
          console.log(`✅ Loaded ${data[colName].length} documents from ${colName}`);
        } catch (colError) {
          console.error(`❌ Error loading ${colName}:`, colError);
          data[colName] = [];
        }
      }
      
      // Handle settings as single doc
      if (data.settings && data.settings.length > 0) {
        data.settings = data.settings[0];
      } else {
        data.settings = null;
      }

      console.log("✅ All data loaded successfully from Firebase");
      return data;
    } catch (error) {
      console.error("❌ Firebase Load Error:", error);
      return null;
    }
  },

  // 1b. Real-time listener for specific collection
  listenToCollection: (collectionName, callback) => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn(`⚠️ Firebase not available for ${collectionName}`);
      return null;
    }

    const db = window.firebaseDB;
    try {
      const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          docData.id = doc.id;
          data.push(docData);
        });
        callback(data);
      }, (error) => {
        console.error(`❌ Error listening to ${collectionName}:`, error);
      });

      return unsubscribe; // Call this to stop listening
    } catch (error) {
      console.error(`❌ Failed to setup listener for ${collectionName}:`, error);
      return null;
    }
  },

  // 2. Sync an action to Firestore with better error handling
  syncAction: async (action, payload) => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn("⚠️ Firebase not available - action queued for offline sync");
      return { success: false, reason: 'not_initialized', offline: true };
    }

    const db = window.firebaseDB;
    try {
      switch (action) {
        // ===== CLIENT OPERATIONS =====
        case 'addClient':
          if (!payload.id) throw new Error("Client ID is required");
          await setDoc(doc(db, "clients", payload.id), payload);
          console.log(`✅ Client added: ${payload.id}`);
          break;

        case 'updateClient':
          if (!payload.id) throw new Error("Client ID is required");
          await updateDoc(doc(db, "clients", payload.id), payload);
          console.log(`✅ Client updated: ${payload.id}`);
          break;

        case 'deleteClient':
          if (!payload.id) throw new Error("Client ID is required");
          await deleteDoc(doc(db, "clients", payload.id));
          console.log(`✅ Client deleted: ${payload.id}`);
          break;

        // ===== DEVICE/INVENTORY OPERATIONS =====
        case 'addDevice':
          if (!payload.newDevice?.id) throw new Error("Device ID is required");
          await setDoc(doc(db, "inventory", payload.newDevice.id), payload.newDevice);
          console.log(`✅ Device added: ${payload.newDevice.id}`);
          break;

        case 'updateDevice':
          if (!payload.id) throw new Error("Device ID is required");
          await updateDoc(doc(db, "inventory", payload.id), payload);
          console.log(`✅ Device updated: ${payload.id}`);
          break;

        case 'deleteDevice':
          if (!payload.id) throw new Error("Device ID is required");
          await deleteDoc(doc(db, "inventory", payload.id));
          console.log(`✅ Device deleted: ${payload.id}`);
          break;

        // ===== CONTRACT OPERATIONS =====
        case 'addContract':
          if (!payload.contract?.id) throw new Error("Contract ID is required");
          
          const batch = writeBatch(db);
          batch.set(doc(db, "contracts", payload.contract.id), payload.contract);
          
          // Add installments if provided
          if (payload.installments && Array.isArray(payload.installments)) {
            payload.installments.forEach(installment => {
              if (installment.id) {
                batch.set(doc(db, "installments", installment.id), installment);
              }
            });
          }
          
          await batch.commit();
          console.log(`✅ Contract added with installments: ${payload.contract.id}`);
          break;

        case 'updateContract':
          if (!payload.id) throw new Error("Contract ID is required");
          await updateDoc(doc(db, "contracts", payload.id), payload);
          console.log(`✅ Contract updated: ${payload.id}`);
          break;

        case 'deleteContract':
          if (!payload.id) throw new Error("Contract ID is required");
          
          const deleteBatch = writeBatch(db);
          deleteBatch.delete(doc(db, "contracts", payload.id));
          
          // Delete related installments
          if (payload.installmentIds && Array.isArray(payload.installmentIds)) {
            payload.installmentIds.forEach(instId => {
              deleteBatch.delete(doc(db, "installments", instId));
            });
          }
          
          await deleteBatch.commit();
          console.log(`✅ Contract deleted: ${payload.id}`);
          break;

        // ===== AUDIT LOG OPERATIONS =====
        case 'addAuditLog':
          const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "auditLogs", logId), {
            ...payload,
            timestamp: new Date().toISOString(),
            id: logId
          });
          console.log(`✅ Audit log added: ${logId}`);
          break;

        // ===== GENERIC OPERATIONS =====
        case 'addToCollection':
          if (!payload.collection || !payload.docId) {
            throw new Error("collection and docId are required");
          }
          await setDoc(doc(db, payload.collection, payload.docId), payload.data);
          console.log(`✅ Document added to ${payload.collection}: ${payload.docId}`);
          break;

        case 'updateInCollection':
          if (!payload.collection || !payload.docId) {
            throw new Error("collection and docId are required");
          }
          await updateDoc(doc(db, payload.collection, payload.docId), payload.data);
          console.log(`✅ Document updated in ${payload.collection}: ${payload.docId}`);
          break;

        case 'deleteFromCollection':
          if (!payload.collection || !payload.docId) {
            throw new Error("collection and docId are required");
          }
          await deleteDoc(doc(db, payload.collection, payload.docId));
          console.log(`✅ Document deleted from ${payload.collection}: ${payload.docId}`);
          break;

        default:
          console.warn(`⚠️ Firebase sync action not implemented: ${action}`);
          return { success: false, reason: 'action_not_implemented' };
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Firebase Sync Error (${action}):`, error);
      return { 
        success: false, 
        error: error.message,
        action: action,
        offline: false
      };
    }
  },

  // 3. Upload Image to Firebase Storage
  uploadImage: async (base64Data, folder, filename) => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn("⚠️ Firebase Storage not available - using Base64");
      return base64Data;
    }

    if (!base64Data) return null;
    if (!base64Data.startsWith('data:image')) return base64Data;
    
    try {
      const storage = window.firebaseStorage;
      const filePath = `${folder}/${filename}`;
      const fileRef = ref(storage, filePath);
      
      // Upload the image
      await uploadString(fileRef, base64Data, 'data_url');
      
      // Get download URL
      const url = await getDownloadURL(fileRef);
      console.log(`✅ Image uploaded: ${filePath}`);
      
      return url;
    } catch (error) {
      console.error(`❌ Image upload error:`, error);
      // Fallback to Base64
      return base64Data;
    }
  },

  // 4. Delete image from Storage
  deleteImage: async (imagePath) => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn("⚠️ Firebase Storage not available");
      return false;
    }

    try {
      const storage = window.firebaseStorage;
      const fileRef = ref(storage, imagePath);
      await deleteObject(fileRef);
      console.log(`✅ Image deleted: ${imagePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Image deletion error:`, error);
      return false;
    }
  },

  // 5. Query with filters
  queryCollection: async (collectionName, filters = []) => {
    if (!window.FirebaseService.isAvailable()) {
      console.warn(`⚠️ Firebase not available for query on ${collectionName}`);
      return [];
    }

    const db = window.firebaseDB;
    try {
      let q = collection(db, collectionName);
      
      if (filters.length > 0) {
        const conditions = filters.map(f => where(f.field, f.operator, f.value));
        q = query(q, ...conditions);
      }
      
      const snapshot = await getDocs(q);
      const results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        results.push(data);
      });
      
      console.log(`✅ Query completed: ${results.length} results from ${collectionName}`);
      return results;
    } catch (error) {
      console.error(`❌ Query error on ${collectionName}:`, error);
      return [];
    }
  }
};

// Initialize Firebase on load
if (window.firebaseReady) {
  console.log("✅ FirebaseService ready");
} else {
  console.warn("⚠️ Firebase not initialized - using local mode");
}
