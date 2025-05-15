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
require('dotenv').config();

// Initialize Admin SDK with service account credentials
// const serviceAccount = require('./service-account-key.json');

initializeApp({
  // credential: cert(serviceAccount),
  credential: cert({
    projectId: process.env.GOOGLE_PROJECT_ID,
    privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID,
    clientId: process.env.GOOGLE_CLIENT_ID,
    authUri: process.env.GOOGLE_AUTH_URI,
    tokenUri: process.env.GOOGLE_TOKEN_URI,
    authProviderX509CertUrl: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    clientC509CertUrl: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universeDomain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  }),
});

const db = getFirestore();

module.exports = db;