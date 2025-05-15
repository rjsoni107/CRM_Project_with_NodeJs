const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { createDefaultAdmin } = require("./controllers/mainController");
const dotenv = require("dotenv");
const { WebSocketServer } = require('ws');
const db = require('./firebase'); // Ensure Firestore initialized
const http = require('http'); // Add http module
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Create HTTP server with Express app
const server = http.createServer(app);

// Create WebSocket server and attach to the same HTTP server
const wss = new WebSocketServer({ server });

// Map to store chatId -> WebSocket clients
const clients = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { chatId } = data;

        if (chatId) {
            // Store client for this chatId
            if (!clients.has(chatId)) {
                clients.set(chatId, new Set());
            }
            clients.get(chatId).add(ws);

            // Set up Firestore onSnapshot listener for this chatId
            const unsubscribe = db.collection('chats')
                .where('chatId', '==', chatId)
                .orderBy('timestamp', 'asc')
                .onSnapshot((snapshot) => {
                    const messages = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Send updated messages to all clients for this chatId
                    if (clients.has(chatId)) {
                        clients.get(chatId).forEach(client => {
                            if (client.readyState === 1) { // 1 = OPEN
                                client.send(JSON.stringify(messages));
                            }
                        });
                    }
                }, (err) => {
                    console.error('Error listening to messages:', err);
                });

            // Clean up listener when client disconnects
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                clients.get(chatId).delete(ws);
                if (clients.get(chatId).size === 0) {
                    clients.delete(chatId);
                    unsubscribe(); // Stop listening when no clients
                }
            });
        }
    });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    createDefaultAdmin();
});

module.exports = app;