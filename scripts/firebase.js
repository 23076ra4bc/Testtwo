// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYi1_1M34c1qk8AUfsZWSxZWx-C-LripI",
  authDomain: "test-f1489.firebaseapp.com",
  databaseURL: "https://test-f1489-default-rtdb.firebaseio.com",
  projectId: "test-f1489",
  storageBucket: "test-f1489.firebasestorage.app",
  messagingSenderId: "832491175641",
  appId: "1:832491175641:web:df540c7e8749a3e2d288c8",
  measurementId: "G-SXK9FFWBHW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = getFirestore(app);

class FirestoreStorage {
    // Save visitor data to Firestore
    static async saveData(data) {
        try {
            const docRef = await addDoc(collection(db, "visitors"), {
                ...data,
                serverTimestamp: serverTimestamp()
            });
            
            console.log("Document written with ID: ", docRef.id);
            return { 
                success: true, 
                id: docRef.id,
                message: 'Data saved to Firestore successfully'
            };
        } catch (error) {
            console.error("Error adding document: ", error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Get all visitor data from Firestore
    static async getAllData() {
        try {
            const q = query(collection(db, "visitors"), orderBy("serverTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            
            const visitors = [];
            querySnapshot.forEach((doc) => {
                visitors.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            
            return { 
                success: true, 
                visitors: visitors 
            };
        } catch (error) {
            console.error("Error getting documents: ", error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Test Firestore connection
    static async testConnection() {
        try {
            const testDoc = await addDoc(collection(db, "test"), {
                message: "Firestore connection test",
                timestamp: new Date().toISOString()
            });
            return { 
                success: true, 
                message: 'Firestore connected successfully!',
                docId: testDoc.id 
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
}

// Make available globally
window.FirestoreStorage = FirestoreStorage;
window.firebaseApp = app;
window.firestoreDB = db;
