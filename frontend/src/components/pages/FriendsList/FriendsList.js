import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Base from '../../../util/Base';
import FriendsListDTO from './FriendsListDTO';
import { ENDPOINTS } from '../../../utility/ApiEndpoints';
import Loader from '../../loader/Loader';
import { useSelector } from 'react-redux';

const FriendsList = () => {
    const [friends, setFriends] = useState([]);
    const [showLoader, setShowLoader] = useState(false);
    const [notification, setNotification] = useState(null);
    const loginDetails = useSelector(state => state?.user);
    const userId = loginDetails.userId || 0;

    const { fetchData, basePathAction, apiPathAction } = Base();
    const { fetchFriendsList, fetchNotifications } = FriendsListDTO({ fetchData, setShowLoader, apiPathAction, setNotification, setFriends });
    useEffect(() => {
        fetchFriendsList({userId: 'All'});
    }, []);
    const navigate = useNavigate();

    const handleUserSelect = (evt, receiverId, name) => {
        if (receiverId && loginDetails.userId) {
            evt.preventDefault();
            setShowLoader(true);
            const chatId = `chat_${Math.min(userId, receiverId)}${Math.max(userId, receiverId)}`;
            navigate(`${basePathAction(ENDPOINTS.CHAT)}/${chatId}/${loginDetails.userId}/${receiverId}`);
        } else {
            console.error('UserId or loginDetails.userId is undefined:', receiverId, loginDetails.userId);
        }
    };

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-teal-900 p-2 shadow-md">
                <h1 className="text-2xl font-bold text-white text-center">Friends List</h1>
            </div>

            {/* Friends List */}
            <div className="p-4">
                {friends.length === 0 ? (
                    <p className="text-gray-500 text-center">No friends found.</p>
                ) : (
                    friends.map((friend) => (
                        <Link
                            key={friend.userId}
                            onClick={(e) => handleUserSelect(e, friend.userId, friend.name)}
                            className="flex items-center p-3 mb-3 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition duration-200"
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {friend.name ? friend.name[0] : 'U'}
                            </div>
                            {/* Friend Info */}
                            <div className="ml-4 flex-1">
                                <h2 className="text-lg font-semibold text-gray-800">{friend.name || 'Unknown User'}</h2>
                                <p className="text-sm text-gray-500">Tap to chat</p>
                            </div>
                            {/* Last Message Time (Dummy) */}
                            <div className="text-xs text-gray-400">Just now</div>
                        </Link>
                    ))
                )}
            </div>
            {loader}
        </div>
    );
};

export default FriendsList;