// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class OnlineStorage {
    static async saveData(data) {
        try {
            const timestamp = Date.now();
            const visitorRef = database.ref('visitors/' + timestamp);
            
            await visitorRef.set({
                ...data,
                onlineTimestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            return { success: true, id: timestamp };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getAllData() {
        try {
            const snapshot = await database.ref('visitors').once('value');
            const visitors = [];
            
            snapshot.forEach(childSnapshot => {
                visitors.push({
                    id: childSnapshot.key,
                    data: childSnapshot.val()
                });
            });
            
            return { success: true, visitors: visitors.reverse() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
