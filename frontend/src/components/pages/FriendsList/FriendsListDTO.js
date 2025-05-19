import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const FriendsListDTO = (fetchData, setShowLoader, apiPathAction, setNotification, setFriends) => {
    // Fetch all users
    const fetchFriendsList = async (propsState) => {
        setShowLoader(true);
        try {
            const responseJson = await fetchData('GET', apiPathAction(ENDPOINTS.GET_FRIENDS_LIST_ACTION));
            const { friendsList } = responseJson || {};

            if (responseJson && responseJson.responseStatus === 'SUCCESS') {
                setFriends(friendsList);
            }
            setShowLoader(false);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchNotifications = async (userId) => {
        setShowLoader(true);
        const payload = { userId };
        try {
            const actionName = apiPathAction(ENDPOINTS.NOTIFICATION);
            const responseJson = await fetchData('POST', actionName, payload);
            const { notifications } = responseJson || {};
            if (notifications.length === 0) {
                console.log('No notifications found for user:', userId);
                return;
            }

            notifications.forEach(notif => {
                setNotification({ message: notif.message, chatId: notif.chatId });
                const actionName = `${apiPathAction(ENDPOINTS.NOTIFICATION)}/${notif.id}`;
                // Mark as read via API
                fetchData('POST', actionName, {});
            });

        } catch (err) {
            setShowLoader(false);
            console.error('Error fetching notifications:', err);
        }
    };

    return { fetchFriendsList, fetchNotifications };
};

export default FriendsListDTO;