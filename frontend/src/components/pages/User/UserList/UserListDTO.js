import { ENDPOINTS } from "../../../../utility/ApiEndpoints";

const UserListDTO = (fetchData, setState, setShowLoader, state, setDialogState, apiPathAction) => {
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

    // Delete a user
    const deleteUser = async (id) => {
        setShowLoader(true)
        try {
            const responseJson = await fetchData('DELETE', `${ENDPOINTS.DELETE_USER_ACTION}/${id}`);
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

    return { fetchUsers, deleteUser };
};

export default UserListDTO;