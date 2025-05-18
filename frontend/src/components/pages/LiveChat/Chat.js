import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from "react-icons/fa";
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

    const { fetchData, apiPathAction, formatTime } = Base();
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

                newWs.onclose = (event) => {
                    console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
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
        <main className="flex flex-col h-full bg-gray-100 flex-1 min-h-0">
            {/* Header - static at top */}
            <div className="bg-blue-600 p-2 flex items-center shadow-md flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {friend ? friend.name[0] : 'F'}
                </div>
                <h2 className="ml-3 text-xl font-bold text-white">
                    {friend ? friend.name : 'Friend'}
                </h2>
            </div>

            {/* Messages - scrollable */}
            <div className="flex-1 p-2 overflow-y-auto bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-3 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs min-w-[90px] px-2 py-1 rounded-lg shadow-sm ${msg.senderId === userId
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-800'
                                }`}
                        >
                            <p>{msg.message}</p>
                            <p className="text-[10px] mt-1 opacity-75 d-flex justify-content-end">
                                {formatTime(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - static at bottom */}
            <div className="bg-white p-2     flex items-center border-t border-gray-200 flex-shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-3 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                >
                    <FaPaperPlane className="text-lg" />
                </button>
            </div>
        </main>
    );
};

export default Chat;