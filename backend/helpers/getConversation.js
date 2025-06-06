const { ConversationModel } = require("../modules/ConversationModel")

/**
 * Get all conversations for a user, including unseen message count and last message.
 * @param {string} currentUserId
 * @returns {Promise<Array>}
 */
const getConversation = async (currentUserId) => {
    if (!currentUserId) return []

    try {
        const conversations = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
            .sort({ updatedAt: -1 })
            .populate('messages')
            .populate('sender')
            .populate('receiver')

        return conversations.map((conv) => {
            const messages = Array.isArray(conv?.messages) ? conv.messages : []
            // Count unseen messages not sent by current user
            const unseenMsg = messages.reduce((prev, curr) => {
                const msgByUserId = curr?.msgByUserId?.toString()
                return (msgByUserId !== currentUserId && !curr?.seen) ? prev + 1 : prev
            }, 0)

            return {
                _id: conv?._id,
                sender: conv?.sender,
                receiver: conv?.receiver,
                unseenMsg,
                lastMsg: messages.length > 0 ? messages[messages.length - 1] : null
            }
        })
    } catch (err) {
        console.error('Error in getConversation:', err)
        return []
    }
}

module.exports = getConversation