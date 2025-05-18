import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const ChatDTO = ({ setError, fetchData, apiPathAction, chatId, userId, receiverId, newMessage, setNewMessage, getDateLabel }) => {

    const handleSendMessage = async () => {
        console.log(receiverId, 'receiverId');
        console.log(userId, 'userId');
        if (!newMessage.trim()) return;
        if (!userId || !receiverId) {
            console.error('userId or receiverId is undefined');
            return;
        }

        try {
            const payload = {
                chatId,
                senderId: userId,
                receiverId,
                message: newMessage,
                timestamp: new Date().toISOString()
            };
            const actionName = apiPathAction(ENDPOINTS.SEND_CHAT_ACTION);
            const responseJson = await fetchData('POST', actionName, payload);
            const { responseMsg, responseStatus } = responseJson;

            if (responseStatus === "SUCCESS") {
                setNewMessage('');
                setError(null);
            } else {
                setError(responseMsg);
                setTimeout(() => setError(null), 5000);
                // if (responseMsg.includes("token")) {
                //     localStorage.removeItem('authToken');
                //     localStorage.removeItem('globalObj');
                //     // window.location.href = '/login';
                // }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message: ' + error.message);
            setTimeout(() => setError(null), 5000);
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const grouped = [];
        let currentDate = null;

        messages.forEach((msg) => {
            const msgDate = new Date(msg.timestamp);
            const dateLabel = getDateLabel(msgDate);

            if (dateLabel !== currentDate) {
                grouped.push({ type: 'date', label: dateLabel });
                currentDate = dateLabel;
            }
            grouped.push({ type: 'message', data: msg });
        });

        return grouped;
    };

    return { handleSendMessage, groupMessagesByDate };
}

export default ChatDTO;