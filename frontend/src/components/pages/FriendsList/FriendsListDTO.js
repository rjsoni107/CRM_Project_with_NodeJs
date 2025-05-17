import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const FriendsListDTO = (fetchData, setShowLoader, apiPathAction, setNotification, setFriends) => {
    // Fetch all users
    const fetchUsers = async (propsState) => {
        setShowLoader(true);
        const payload = {
            ...propsState.payload,
        };
        try {
            const responseJson = await fetchData('POST', apiPathAction(ENDPOINTS.GET_USER_LIST_ACTION), payload);
            const { userList } = responseJson || {};

            if (responseJson && responseJson.responseStatus === 'SUCCESS') {
                setFriends(userList);
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

    return { fetchUsers, fetchNotifications };
};

export default FriendsListDTO;