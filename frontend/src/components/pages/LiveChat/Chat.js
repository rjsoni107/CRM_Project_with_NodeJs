import { useState, useEffect } from 'react';
import Base from '../../../util/Base';
import ChatDTO from './ChatDTO';
import './chat.css';
import { useParams } from 'react-router-dom';

const Chat = () => {
    const loginDetails = JSON.parse(localStorage.getItem('globalObj'));
    const { id } = useParams();
    const chatId = `chat_${id}`;
    const userId = loginDetails.userId;
    const receiverId = id;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState(null);
    const { fetchData, apiPathAction } = Base();
    const { handleSendMessage } = ChatDTO({ setError, fetchData, apiPathAction, chatId, userId, receiverId, newMessage, setNewMessage });

    useEffect(() => {
        if (!chatId) return;
        console.log(process.env)
        console.log(window.wsPath)

        // Connect to WebSocket
        const ws = new WebSocket(window.wsPath);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Send chatId to listen to
            ws.send(JSON.stringify({ chatId }));
        };

        ws.onmessage = (event) => {
            const updatedMessages = JSON.parse(event.data);
            setMessages(updatedMessages);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('WebSocket error: ' + err.message);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            ws.close();
        };
    }, [chatId]);

    if (!chatId) {
        return <div>Error: Chat ID is missing</div>;
    }

    return (
        <div className="chat-container">
            <h3 className="chat-title">Chat</h3>
            {error && <div className="chat-error">{error}</div>}
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div
                        key={msg.id || idx}
                        className={`chat-message ${msg.senderId === userId ? 'right' : 'left'}`}
                    >
                        <strong>{msg.senderId === userId ? 'You' : 'Them'}:</strong> {msg.message}
                        <small> ({msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'})</small>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
            />
            <button onClick={handleSendMessage} className="chat-send-btn">Send</button>
        </div>
    );
};

export default Chat;