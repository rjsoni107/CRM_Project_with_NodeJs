import { useState, useEffect } from 'react';
import Base from '../../../util/Base';
import ChatDTO from './ChatDTO';
import './chat.css';
import { useParams } from 'react-router-dom';

const Chat = () => {
    const loginDetails = JSON.parse(localStorage.getItem('globalObj')) || {};
    const { chatId, userId: senderId, receiverId } = useParams();
    const userId = loginDetails.userId || senderId;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    const { fetchData, apiPathAction } = Base();
    const { handleSendMessage } = ChatDTO({ setError, fetchData, apiPathAction, chatId, userId, receiverId, newMessage, setNewMessage });

    useEffect(() => {
        if (!userId || !chatId || !receiverId) {
            return <div>Error: Missing user ID, chat ID, or receiver ID</div>;
        }
        // Fetch unread notifications from Firestore

        let ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3005');
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const baseDelay = 5000;

        const reconnect = () => {
            if (reconnectAttempts >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached. Giving up.');
                setError('Unable to reconnect to WebSocket server. Please refresh the page.');
                return;
            }

            const delay = baseDelay * Math.pow(2, reconnectAttempts);
            console.log(`Reconnecting to WebSocket in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1})`);

            setTimeout(() => {
                reconnectAttempts++;
                const newWs = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3005');

                newWs.onopen = () => {
                    if (newWs.readyState === WebSocket.OPEN) {
                        console.log('Connected to WebSocket server');
                        newWs.send(JSON.stringify({ chatId, userId }));
                        reconnectAttempts = 0;
                    } else {
                        console.warn('WebSocket is not in OPEN state:', newWs.readyState);
                    }
                };

                newWs.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        setNotification(data.message);
                        // setTimeout(() => setNotification(null), 5000);
                    } else {
                        setMessages(prev => {
                            const newMessages = data.filter(newMsg => !prev.some(msg => msg.id === newMsg.id));
                            return [...prev, ...newMessages];
                        });
                    }
                };

                newWs.onerror = (err) => {
                    console.error('WebSocket error:', err);
                    setError('WebSocket error: ' + err.message);
                    setTimeout(() => setError(null), 5000);
                };

                newWs.onclose = () => {
                    console.log('WebSocket connection closed');
                    reconnect();
                };

                ws = newWs;
            }, delay);
        };

        ws.onopen = () => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('Connected to WebSocket server');
                ws.send(JSON.stringify({ chatId, userId }));
            } else {
                console.warn('WebSocket is not in OPEN state:', ws.readyState);
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
                setNotification(data.message);
                setTimeout(() => setNotification(null), 5000);
            } else {
                setMessages(prev => {
                    const newMessages = data.filter(newMsg => !prev.some(msg => msg.id === newMsg.id));
                    return [...prev, ...newMessages];
                });
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('WebSocket error: ' + err.message);
            setTimeout(() => setError(null), 5000);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            reconnect();
        };

        return () => {
            ws.close();
        };
    }, [chatId, userId]);

    useEffect(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chat-container">
            <h3 className="chat-title">Chat</h3>
            {error && <div className="chat-error">{error}</div>}
            {notification && <div style={{ color: 'blue', marginBottom: '10px' }} className='mb-10 text-blue'>{notification.message}</div>}
            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.senderId === userId ? 'right' : 'left'}`}>
                        <strong>{msg.senderId === userId ? 'You' : 'Them'}:</strong> {msg.message}
                        <small> ({msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'N/A'})</small>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
                aria-label="Type a message"
            />
            <button onClick={handleSendMessage} className="chat-send-btn" aria-label="Send message">Send</button>
        </div>
    );
};

export default Chat;