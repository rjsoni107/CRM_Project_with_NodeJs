import { ENDPOINTS } from "../../../../utility/ApiEndpoints";

const UserListDTO = (fetchData, setState, setShowLoader, state, setDialogState, apiPathAction, setNotification) => {
    // Fetch all users
    const fetchUsers = async (propsState) => {
        setShowLoader(true);
        const payload = {
            ...propsState.payload,
            start: propsState.start,
            length: propsState.length,
        };
        try {
            const responseJson = await fetchData('POST', apiPathAction(ENDPOINTS.GET_USER_LIST_ACTION), payload);
            const { userList, countPerPage } = responseJson || {};

            if (responseJson && responseJson.responseStatus === 'SUCCESS') {
                setState(prevState => ({
                    ...prevState,
                    countPerPage: countPerPage,
                    row: userList,
                }));
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
            const { notifications } = responseJson|| {};
            if (notifications.length === 0) {
                console.log('No notifications found for user:', userId);
                return;
            }

            notifications.forEach(notif => {
                setNotification({ message: notif.message, chatId: notif.chatId });
                // const actionName = `${apiPathAction(ENDPOINTS.NOTIFICATION)}/${notif.id}`;
                // // Mark as read via API
                // fetchData('POST', actionName, {});
            });

        } catch (err) {
            setShowLoader(false);
            console.error('Error fetching notifications:', err);
        }
    };

    // Delete a user
    const deleteUser = async (userId) => {
        setShowLoader(true)
        try {
            const responseJson = await fetchData('DELETE', apiPathAction(`${ENDPOINTS.DELETE_USER_ACTION}/${userId}`));
            const { responseStatus, responseMsg } = responseJson;
            setDialogState(prevState => ({
                ...prevState,
                dialog: {
                    ...prevState.dialog,
                    dialogBoxType: responseStatus === "SUCCESS" ? 'success' : 'error',
                    dialogBoxMsg: <h5>{responseMsg}</h5>,
                    isDialogOpen: true,
                    dialogFooter: (
                        <>
                            <button className='btn btn-primary'
                                onClick={(e) => {
                                    setDialogState({ dialog: { isDialogOpen: false } });
                                    if (responseStatus === "SUCCESS") fetchUsers(state);
                                }}>
                                Ok
                            </button>
                        </>
                    )
                },
            }));
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setShowLoader(false)
        }
    };

    return { fetchUsers, deleteUser, fetchNotifications };
};

export default UserListDTO;