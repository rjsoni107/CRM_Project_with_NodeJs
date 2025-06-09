const express = require('express')
const { Server } = require('socket.io')
const http = require('http')
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken')
const { ConversationModel, MessageModel } = require('../modules/ConversationModel')
const User = require("../modules/userModelMongo");
const getConversation = require('../helpers/getConversation')
const dotenv = require("dotenv");
const { timeLog } = require('../util/logger')
dotenv.config();

const { FRONTEND_URL, PORT } = process.env;
const app = express()
// Define allowed origins
const allowedOrigins = [
    FRONTEND_URL,
    'http://192.168.1.111:3006',
    'http://localhost:3006',
].filter(Boolean);

/***socket connection */
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
})

// Track online users
const onlineUser = new Set();
const activeChats = new Map();

io.on('connection', async (socket) => {
    console.log("User connected:", socket.id)

    const token = socket.handshake.auth.token

    // Get current user details
    let user
    try {
        user = await getUserDetailsFromToken(token)
    } catch (err) {
        console.error('Token validation error:', err)
        socket.emit('auth-error', { message: 'Session expired, please log in again' })
        socket.disconnect()
        return
    }

    // Check if user is valid
    if (!user?._id) {
        socket.emit('auth-error', { message: 'Session expired, please log in again' })
        socket.disconnect()
        return
    }

    // Create a room for the user
    const userId = user._id.toString();
    socket.join(userId);
    onlineUser.add(userId);
    io.emit('onlineUser', Array.from(onlineUser));

    // Track active chat screen
    socket.on('chat-screen', (targetUserId) => {
        activeChats.set(userId, targetUserId);
        socket.emit('seen', targetUserId); // Trigger seen update
    });

    // New event to clear active chat
    socket.on('clear-chat-screen', (data) => {
        console.log(`Clearing active chat for user ${userId}`);
        activeChats.delete(userId);
        console.log('Active chats:', Array.from(activeChats.entries()));
    });

    // Handle message-page event
    socket.on('message-page', async (targetUserId) => {
        timeLog('targetUserId', targetUserId)
        try {
            const userDetails = await User.findById(targetUserId).select("-password")
            const payload = {
                _id: userDetails?._id,
                name: userDetails?.name,
                mobile: userDetails?.mobile,
                profile_pic: userDetails?.profile_pic,
                online: onlineUser.has(targetUserId),
                lastSeen: userDetails?.lastSeen
            }
            socket.emit('message-user', payload)

            // Get previous messages
            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: userId, receiver: targetUserId },
                    { sender: targetUserId, receiver: userId }
                ]
            }).populate('messages').sort({ updatedAt: -1 })

            socket.emit('message', conversation?.messages || [])
        } catch (err) {
            console.error('Error in message-page:', err)
            socket.emit('error', { message: 'Failed to load messages' })
        }
    })

    // Handle new message event
    socket.on('new message', async (data) => {
        try {
            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data?.sender, receiver: data?.receiver },
                    { sender: data?.receiver, receiver: data?.sender }
                ]
            })

            // If conversation does not exist, create it
            if (!conversation) {
                conversation = await new ConversationModel({
                    sender: data?.sender,
                    receiver: data?.receiver
                }).save()
            }

            const message = new MessageModel({
                text: data.text,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                msgByUserId: data?.msgByUserId,
                status: onlineUser.has(data?.receiver) ? 'delivered' : 'sent'
            })
            const saveMessage = await message.save()

            await ConversationModel.updateOne(
                { _id: conversation?._id },
                { "$push": { messages: saveMessage?._id } }
            )

            const updatedConversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data?.sender, receiver: data?.receiver },
                    { sender: data?.receiver, receiver: data?.sender }
                ]
            }).populate('messages').sort({ updatedAt: -1 })

            io.to(data?.sender).emit('message', updatedConversation?.messages || [])
            io.to(data?.receiver).emit('message', updatedConversation?.messages || [])

            // Send updated conversation lists
            const conversationSender = await getConversation(data?.sender)
            const conversationReceiver = await getConversation(data?.receiver)

            io.to(data?.sender).emit('conversation', conversationSender)
            io.to(data?.receiver).emit('conversation', conversationReceiver)
        } catch (err) {
            console.error('Error in new message:', err)
            socket.emit('error', { message: 'Failed to send message' })
        }
    })

    // Handle sidebar event
    socket.on('sidebar', async (currentUserId) => {
        try {
            const conversation = await getConversation(currentUserId)
            socket.emit('conversation', conversation)
        } catch (err) {
            console.error('Error in sidebar:', err)
            socket.emit('error', { message: 'Failed to load conversations' })
        }
    })

    // Handle seen event
    socket.on('seen', async (msgByUserId) => {
        // if (activeChats.get(userId) !== msgByUserId) return; // Only update if user is on the chat screen
        try {
            console.log('activeChats', activeChats)

            console.log(`Seen event: User ${userId} for messages from ${msgByUserId}`);
            const isActiveChat = activeChats.get(userId) === msgByUserId;
            console.log('isActiveChat', isActiveChat)
            if (!isActiveChat) {
                console.log(`User ${userId} not on chat screen with ${msgByUserId}`);
                return;
            }

            // Find the conversation between the two users
            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: userId, receiver: msgByUserId },
                    { sender: msgByUserId, receiver: userId }
                ]
            });

            if (!conversation) {
                console.log(`No conversation found between ${userId} and ${msgByUserId}`);
                return;
            }

            const conversationMessageIds = conversation?.messages || [];

            // Update all messages sent by msgByUserId in this conversation to seen
            await MessageModel.updateMany(
                { _id: { "$in": conversationMessageIds }, msgByUserId: msgByUserId },
                { $set: { seen: true, status: 'seen' } }
            );

            // Fetch the updated conversation with populated messages
            const updatedConversation = await ConversationModel.findOne({
                "$or": [
                    { sender: userId, receiver: msgByUserId },
                    { sender: msgByUserId, receiver: userId }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            // Emit updated messages to both users for live UI update
            io.to(userId).emit('message', updatedConversation?.messages || []);
            io.to(msgByUserId).emit('message', updatedConversation?.messages || []);

            // Also update the conversation list for both users
            const conversationSender = await getConversation(userId);
            const conversationReceiver = await getConversation(msgByUserId);

            io.to(userId).emit('conversation', conversationSender);
            io.to(msgByUserId).emit('conversation', conversationReceiver);
        } catch (err) {
            console.error('Error in seen:', err);
            socket.emit('error', { message: 'Failed to update seen status' });
        }
    });

    socket.on('typing', (data) => {
        // Send to the receiver only
        io.to(data.receiver).emit('typing', { sender: data.sender });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        timeLog('userId', userId);
        await User.updateOne({ _id: userId }, { lastSeen: new Date() });
        onlineUser.delete(userId);
        activeChats.delete(userId);
        io.emit('onlineUser', Array.from(onlineUser));
        console.log('User disconnected:', socket.id);
    });
})

module.exports = { app, server }