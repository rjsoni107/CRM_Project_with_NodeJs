import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const ChatDTO = ({ setError, fetchData, apiPathAction, chatId, userId, receiverId, newMessage, setNewMessage }) => {

    const handleSendMessage = async (evt) => {
        if (!newMessage.trim()) return;
        if (!userId || !receiverId) {
            console.error('userId or receiverId is undefined');
            return;
        }

        const actionName = apiPathAction(ENDPOINTS.SEND_CHAT_ACTION);
        try {
            const payload = {
                chatId,
                senderId: userId,
                receiverId,
                message: newMessage,
                timestamp: new Date()
            };
            const responseJson = await fetchData('POST', actionName, payload);
            const { responseMsg, responseStatus } = responseJson;

            if (responseStatus === "SUCCESS") {
                setNewMessage('');
            } else {
                setError(responseMsg);
                // if (responseMsg.includes("token")) {
                //     localStorage.removeItem('authToken');
                //     localStorage.removeItem('globalObj');
                //     // window.location.href = '/login';
                // }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message: ' + error.message);
        }
    };

    return { handleSendMessage };
}

export default ChatDTO;