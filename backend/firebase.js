// const { initializeApp } = require('firebase/app');
// const { getFirestore } = require('firebase/firestore');
// const dotenv = require("dotenv");
// dotenv.config();

// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// module.exports = db;

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Admin SDK with service account credentials
const serviceAccount = require('./service-account-key.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

module.exports = db;