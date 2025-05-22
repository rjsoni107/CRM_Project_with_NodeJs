const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { createDefaultAdmin } = require("./controllers/mainController");
const dotenv = require("dotenv");
const { WebSocketServer } = require('ws');
const db = require('./firebase');
const http = require('http');
const { setUserClients } = require('./util/websocket');
const { timeLog } = require('./util/logger');
const rateLimit = require('express-rate-limit');

dotenv.config();
const { FRONTEND_URL, PORT } = process.env;

const app = express();

// Define allowed origins
const allowedOrigins = [
    FRONTEND_URL,
    'http://192.168.1.111:3006',
    'http://localhost:3006',
].filter(Boolean);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use((req, res, next) => {
    next();
});

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Routes
app.use('/api', userRoutes);
// Create HTTP server with Express app
const server = http.createServer(app);

// Create WebSocket server and attach to the same HTTP server
const ws = new WebSocketServer({ server });

// Map to store chatId -> WebSocket clients
const clients = new Map();
// Map to store userId -> WebSocket clients (for notifications)
const userClients = new Map();

// Function to update lastSeen
const updateLastSeen = async (userId) => {
    try {
        const userQuery = db.collection("users").where("userId", "==", userId);
        const userSnapshot = await userQuery.get();
        const userDocId = userSnapshot.docs[0].id;
        await db.collection("users").doc(userDocId).update(
            { lastSeen: new Date().toISOString() }
        );
        timeLog(`Updated lastSeen for user ${userId}`);
    } catch (err) {
        console.error('Error updating lastSeen:', err);
    }
};

// Function to fetch lastSeen
const userLastSeen = async (receiverId) => {
    try {
        const userQuery = db.collection("users").where("userId", "==", receiverId);
        const userSnapshot = await userQuery.get();
        const user = userSnapshot.docs[0].data();
        if (user) return user.lastSeen || null;
    } catch (error) {
        console.error('Error fetching user lastSeen:', error);
        return null;
    }
};

// WebSocket connection handling
ws.on('connection', async (ws, req) => {
    // CORS validation
    const origin = req.headers.origin;
    if (!allowedOrigins.includes(origin)) {
        timeLog(`[wss.on-connection] Unauthorized origin: ${origin}`);
        ws.close(1008, 'CORS policy violation');
        return;
    }

    timeLog('[wss.on-connection] New WebSocket client connected');

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            console.error('Invalid message format:', err);
            return;
        }
        const { chatId, userId, receiverId } = data;

        if (!chatId || !userId) {
            console.error('Missing chatId or userId in WebSocket message');
            return;
        }
        await updateLastSeen(userId);

        if (chatId && userId && receiverId) {
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

            if (data.type === 'typing') {
                await updateLastSeen(userId);
                const lastSeen = await userLastSeen(receiverId);
                const chatClients = clients.get(data.chatId) || new Set();
                chatClients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'typing',
                            chatId: data.chatId,
                            userId: data.userId,
                            lastSeen: lastSeen,
                        }));
                    }
                });
            } else {
                const lastSeen = await userLastSeen(receiverId);
                const unsubscribe = db.collection('chats')
                    .where('chatId', '==', chatId)
                    .orderBy('timestamp', 'asc')
                    .onSnapshot((snapshot) => {
                        const messages = snapshot.docs.map(doc => ({
                            id: doc.id,
                            lastSeen: lastSeen,
                            ...doc.data(),
                        }));

                        if (clients.has(chatId)) {
                            clients.get(chatId).forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify(messages));
                                }
                            });
                        }
                    }, (err) => {
                        console.error('Error listening to messages:', err);
                        if (clients.has(chatId)) {
                            clients.get(chatId).forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({ type: 'error', message: 'Failed to fetch messages' }));
                                }
                            });
                        }
                    });

                ws.on('close', (code, reason) => {
                    timeLog(`[ws.on-close] WebSocket client disconnected. Code: ${code}, Reason: ${reason.toString()}`);
                    if (clients.has(chatId)) {
                        clients.get(chatId).delete(ws);
                        if (clients.get(chatId).size === 0) {
                            clients.delete(chatId);
                            unsubscribe();
                        }
                    }
                    if (userClients.has(userId)) {
                        userClients.get(userId).delete(ws);
                        if (userClients.get(userId).size === 0) {
                            userClients.delete(userId);
                        }
                    }
                    setUserClients(userClients);
                });
            }
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Heartbeat to clean up stale clients
const interval = setInterval(() => {
    ws.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

ws.on('close', () => {
    clearInterval(interval);
    timeLog('WebSocket server closed');
});

server.listen(PORT, async () => {
    timeLog(`[server.listen] Server running on port ${PORT}`);
    await createDefaultAdmin();
});

module.exports = app;