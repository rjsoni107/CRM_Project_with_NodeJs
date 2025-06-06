const mongoose = require('mongoose')

// Message Schema
const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    imageUrl: {
        type: String,
        default: ""
    },
    videoUrl: {
        type: String,
        default: ""
    },
    seen: {
        type: Boolean,
        default: false
    },
    msgByUserId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: process.env.MONGO_DB_MESSAGE
})

// Conversation Schema
const conversationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    receiver: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    messages: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Message'
        }
    ]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: process.env.MONGO_DB_CONVERSATION
})

// Compound index for sender and receiver for faster lookups
conversationSchema.index({ sender: 1, receiver: 1 })

const MessageModel = mongoose.model('Message', messageSchema)
const ConversationModel = mongoose.model('Conversation', conversationSchema)

module.exports = {
    MessageModel,
    ConversationModel
}