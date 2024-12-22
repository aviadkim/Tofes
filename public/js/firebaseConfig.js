// public/js/firebaseConfig.js
class FirebaseService {
    constructor() {
        this.debugSystem = window.debugSystem;
        this.isInitialized = false;
        
        this.config = {
            apiKey: "AIzaSyABz82yg01JJcbNZBzlVWqYEu3LlzFP7PM",
            authDomain: "forms-7f40e.firebaseapp.com",
            projectId: "forms-7f40e",
            storageBucket: "forms-7f40e.appspot.com",
            messagingSenderId: "256898537105",
            appId: "1:256898537105:web:2c74f85e2cb2e170c7c84f"
        };
    }

    async initialize() {
        try {
            if (this.isInitialized) {
                this.debugSystem?.log('Firebase already initialized', 'info', 'firebase');
                return true;
            }

            firebase.initializeApp(this.config);
            
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            this.isInitialized = true;
            window.db = this.db;
            window.storage = this.storage;
            
            this.debugSystem?.log('Firebase initialized successfully', 'info', 'firebase');
            return true;

        } catch (error) {
            this.debugSystem?.error('Firebase initialization failed', error, 'firebase');
            throw error;
        }
    }

    async saveSectionOne(formData) {
        try {
            this.debugSystem?.log('Saving section 1', 'info', 'firebase');

            const docRef = await this.db.collection('section1').add({
                ...formData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.debugSystem?.log('Section 1 saved successfully', 'info', 'firebase');
            return docRef.id;

        } catch (error) {
            this.debugSystem?.error('Failed to save section 1', error, 'firebase');
            throw error;
        }
    }

    async saveFullForm(formData, pdfUrl, signatures) {
        try {
            this.debugSystem?.log('Saving complete form', 'info', 'firebase');
            
            const submission = {
                ...formData,
                pdfUrl,
                signatures,
                status: 'submitted',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('submissions').add(submission);
            
            this.debugSystem?.log('Complete form saved successfully', 'info', 'firebase');
            return docRef.id;

        } catch (error) {
            this.debugSystem?.error('Failed to save complete form', error, 'firebase');
            throw error;
        }
    }

    async uploadFile(file, path) {
        try {
            this.debugSystem?.log(`Uploading file to ${path}`, 'info', 'firebase');
            
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            this.debugSystem?.log('File uploaded successfully', 'info', 'firebase');
            return downloadURL;

        } catch (error) {
            this.debugSystem?.error('File upload failed', error, 'firebase');
            throw error;
        }
    }

    async checkExistingId(idNumber) {
        try {
            const snapshot = await this.db.collection('submissions')
                .where('idNumber', '==', idNumber)
                .get();

            return !snapshot.empty;

        } catch (error) {
            this.debugSystem?.error('Failed to check ID', error, 'firebase');
            throw error;
        }
    }

    async getSubmissionHistory(idNumber) {
        try {
            const snapshot = await this.db.collection('submissions')
                .where('idNumber', '==', idNumber)
                .orderBy('submittedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            this.debugSystem?.error('Failed to get submission history', error, 'firebase');
            throw error;
        }
    }
}

// Create single instance
const firebaseService = new FirebaseService();
window.firebaseService = firebaseService;  // Make it globally available

// Helper functions
window.isFirebaseReady = () => {
    return firebase.apps?.length > 0 && window.db && window.storage;
};

window.waitForFirebase = () => {
    return new Promise((resolve, reject) => {
        if (window.isFirebaseReady()) {
            resolve();
        } else {
            window.addEventListener('firebase-ready', resolve);
            window.addEventListener('firebase-error', reject);
            setTimeout(() => reject(new Error('Firebase initialization timeout')), 10000);
        }
    });
};

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', () => {
    firebaseService.initialize().catch(console.error);
});