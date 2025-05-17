import { useState, useEffect, useRef } from 'react';
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
    const messagesEndRef = useRef(null);
    const [friend, setFriend] = useState(null);
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
                const newWs = new WebSocket(`${process.env.REACT_APP_WS_URL}`);

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle Enter key press to send message
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <main>
            {/* <div className="chat-container">
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
            </div> */}

            <div className="min-h-screen bg-gray-100 flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 p-4 flex items-center shadow-md">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {friend ? friend.name[0] : 'F'}
                    </div>
                    <h2 className="ml-3 text-xl font-bold text-white">
                        {friend ? friend.name : 'Friend'}
                    </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`mb-3 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            <div
                                className={`max-w-xs p-3 rounded-lg shadow-sm ${msg.senderId === 'me'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-800'
                                    }`}
                            >
                                <p>{msg.message}</p>
                                <p className="text-xs mt-1 opacity-75">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Just now'}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white p-4 flex items-center border-t border-gray-200">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={handleSendMessage}
                        className="ml-3 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-200"
                    >
                        Send
                    </button>
                </div>
            </div>
        </main>
    );
};

export default Chat;