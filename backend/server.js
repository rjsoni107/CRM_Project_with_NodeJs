const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { createDefaultAdmin } = require("./controllers/mainController");
const dotenv = require("dotenv");
const { WebSocketServer } = require('ws');
const db = require('./firebase');
const http = require('http');
const https = require('https');
const { setUserClients } = require('./util/websocket');
const { timeLog } = require('./util/logger');

dotenv.config();
const { FRONTEND_URL, SERVER, PORT } = process.env;

const app = express();

// Middleware
app.use(cors({
    origin: FRONTEND_URL || 'http://localhost:3006',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', userRoutes);
console.log(SERVER)
// Create HTTP server with Express app
const server = SERVER === 'production'
  ? https.createServer(app)
    : http.createServer(app);
    
  console.log(server, 'server')

// Create WebSocket server and attach to the same HTTP server
const wss = new WebSocketServer({ server });

// Map to store chatId -> WebSocket clients
const clients = new Map();
// Map to store userId -> WebSocket clients (for notifications)
const userClients = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    timeLog('[wss.on-connection] New WebSocket client connected');

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error('Invalid message format:', err);
            return;
        }
        const { chatId, userId } = data;

        if (chatId && userId) {
            if (!clients.has(chatId)) {
                clients.set(chatId, new Set());
            }
            clients.get(chatId).add(ws);

            if (!userClients.has(userId)) {
                userClients.set(userId, new Set());
            }
            userClients.get(userId).add(ws);
            timeLog(`[ws.on-message] User ${userId} subscribed to chatId: ${chatId}`);

            setUserClients(userClients);

            const unsubscribe = db.collection('chats')
                .where('chatId', '==', chatId)
                .orderBy('timestamp', 'asc')
                .onSnapshot((snapshot) => {
                    const messages = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    if (clients.has(chatId)) {
                        clients.get(chatId).forEach(client => {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify(messages));
                            }
                        });
                    }
                }, (err) => {
                    console.error('Error listening to messages:', err);
                    if (clients.has(chatId)) {
                        clients.get(chatId).forEach(client => {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify({ type: 'error', message: 'Failed to fetch messages' }));
                            }
                        });
                    }
                });

            ws.on('close', async (code, reason) => {
                timeLog(`[ws.on-close] WebSocket client disconnected. Code: ${code}, Reason: ${reason}`);
                clients.get(chatId).delete(ws);
                if (clients.get(chatId).size === 0) {
                    clients.delete(chatId);
                    unsubscribe();
                }
                userClients.get(userId).delete(ws);
                if (userClients.get(userId).size === 0) {
                    userClients.delete(userId);
                }
                setUserClients(userClients);
            });
        }
    });
});

// Heartbeat to clean up stale clients
const interval = setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, async () => {
    timeLog(`[server.listen] Server running on port ${PORT}`);
    await createDefaultAdmin();
});

module.exports = app;