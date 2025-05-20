import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from "react-icons/fa";
import Base from '../../../util/Base';
import ChatDTO from './ChatDTO';
import './chat.css';
import { useParams } from 'react-router-dom';
import FriendsListDTO from '../FriendsList/FriendsListDTO';
import ChatHeader from './ChatHeader';

const Chat = () => {
    const loginDetails = JSON.parse(localStorage.getItem('globalObj')) || {};
    const { chatId, userId: senderId, receiverId } = useParams();
    const userId = loginDetails.userId || senderId;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showLoader, setShowLoader] = useState(false);
    const [friend, setFriends] = useState(null);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const wsRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const lastTypingEventRef = useRef(null);
    const messagesEndRef = useRef(null);

    const { fetchData, apiPathAction, formatTime, getDateLabel } = Base();
    const { handleSendMessage, groupMessagesByDate, isOnline } = ChatDTO({ setError, fetchData, apiPathAction, chatId, userId, receiverId, newMessage, setNewMessage, getDateLabel });
    const { fetchFriendsList } = FriendsListDTO({ fetchData, setShowLoader, apiPathAction, setFriends });

    // Fetch friend details
    useEffect(() => {
        const fetchFriendDetails = async () => {
            if (receiverId) {
                try {
                    setIsLoading(true);
                    await fetchFriendsList({ userId: receiverId });
                } catch (err) {
                    console.error('Error fetching friend:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchFriendDetails();
    }, [receiverId]);

    // WebSocket setup
    useEffect(() => {
        if (!userId || !chatId || !receiverId) {
            return <div>Error: Missing user ID, chat ID, or receiver ID</div>;
        }

        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const baseDelay = 5000;

        const reconnect = () => {
            if (reconnectAttempts >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached. Giving up.');
                return;
            }

            const delay = baseDelay * Math.pow(2, reconnectAttempts);
            console.log(`Reconnecting to WebSocket in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1})`);

            setTimeout(() => {
                reconnectAttempts++;
                wsRef.current = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3005');

                wsRef.current.onopen = () => {
                    if (wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ chatId, userId }));
                        reconnectAttempts = 0;
                    } else {
                        console.warn('WebSocket is not in OPEN state:', wsRef.current.readyState);
                    }
                };

                wsRef.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'typing') {
                        if (data.userId !== userId) {
                            setIsTyping(true);
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                        }
                    } else {
                        setMessages(prev => {
                            const newMessages = data.filter(newMsg => !prev.some(msg => msg.id === newMsg.id));
                            return [...prev, ...newMessages];
                        });
                    }
                };

                wsRef.current.onerror = (err) => {
                    console.error('WebSocket error:', err);
                    setError('WebSocket error: ' + err.message);
                    setTimeout(() => setError(null), 5000);
                };

                wsRef.current.onclose = (event) => {
                    reconnect();
                };

                wsRef.current.onping = () => {
                    wsRef.current.pong();
                };
            }, delay);
        };

        reconnect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [chatId, userId]);

    // Auto-scroll to latest message
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

    // Handle typing event with throttling
    const handleTyping = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const now = Date.now();
            if (!lastTypingEventRef.current || now - lastTypingEventRef.current > 1000) {
                wsRef.current.send(JSON.stringify({ type: 'typing', chatId, userId }));
                lastTypingEventRef.current = now;
            }
        }
    };

    // Group messages by date
    const groupedMessages = groupMessagesByDate(messages);

    return (
        <main className="flex flex-col h-full bg-gray-100 flex-1 min-h-0">
            {/* Header - static at top */}
            <ChatHeader friend={friend} isLoading={isLoading} isOnline={isOnline} />

            {/* Messages - scrollable */}
            <div className="flex-1 p-2 overflow-y-auto bg-gray-50 chat-messages">
                {groupedMessages.map((item, index) => (
                    item.type === 'date' ? (
                        <div key={`date-${index}`} className="text-center my-4">
                            <span className="inline-block bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1 rounded-full">
                                {item.label}
                            </span>
                        </div>
                    ) : (
                        <div
                            key={item.data.id}
                            className={`mb-3 flex ${item.data.senderId === userId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs min-w-[90px] px-2 py-1 rounded-lg shadow-sm ${item.data.senderId === userId
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-white text-gray-800'
                                    }`}
                            >
                                <p>{item.data.message}</p>
                                <p className="text-[10px] mt-1 opacity-75 d-flex justify-content-end">
                                    {formatTime(item.data.timestamp)}
                                </p>
                            </div>
                        </div>
                    )
                ))}
                {isTyping && (
                    <div className="text-gray-500 text-sm italic mb-2">
                        {friend?.name || 'Friend'} is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - static at bottom */}
            <div className="bg-white p-2 flex items-center border-t border-gray-200 flex-shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={handleKeyPress}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Type a message..."
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-3 bg-teal-700 text-white px-3 py-2 rounded-lg hover:bg-teal-800 transition duration-200"
                >
                    <FaPaperPlane className="text-lg" />
                </button>
            </div>
        </main>
    );
};

export default Chat;