const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { timeLog } = require('./util/logger');
require('dotenv').config();

initializeApp({
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
timeLog(db ? 'Firestore initialized' : 'Firestore not initialized');

module.exports = db;