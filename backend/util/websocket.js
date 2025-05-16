const db = require("../firebase");
const { timeLog } = require("./logger");

// Map to store userId -> WebSocket clients (for notifications)
const userClients = new Map();

let isUpdating = false;

// Function to set userClients (called from server.js)
const setUserClients = (clients) => {
  if (isUpdating) {
    console.warn('[setUserClients] setUserClients called while already updating, skipping...');
    return;
  }
  isUpdating = true;
  try {
    userClients.clear();
    clients.forEach((value, key) => {
      userClients.set(key, new Set(value));
    });
  } finally {
    isUpdating = false;
  }
};

// Function to notify user about new messages
const notifyUser = async (userId, message) => {
  if (userClients.has(userId)) {
    timeLog(`[notifyUser] Notifying user ${userId} with message:`, message);
    const clients = userClients.get(userId);
    const activeClients = new Set();
    clients.forEach(client => {
      if (client.readyState === 1) {
        try {
          client.send(JSON.stringify({ type: 'notification', message }));
          activeClients.add(client);
        } catch (err) {
          console.error(`Error sending notification to user ${userId}:`, err);
        }
      }
    });
    if (activeClients.size !== clients.size) {
      userClients.set(userId, activeClients);
      if (activeClients.size === 0) {
        userClients.delete(userId);
      }
    }
  } else {
    timeLog(`[notifyUser] No active clients found for user ${userId}, saving to Firestore`);
    // Save notification to Firestore
    try {
      await db.collection('notifications').add({
        userId,
        message: message.message,
        chatId: message.chatId,
        receiverId: message.senderId,
        status: 'unread',
        timestamp: new Date().toISOString(),
      });
      timeLog(`[notifyUser] Notification saved to Firestore for user ${userId}`);
    } catch (err) {
      console.error(`[notifyUser] Error saving notification to Firestore for user ${userId}:`, err);
    }
  }
};

module.exports = { setUserClients, notifyUser };