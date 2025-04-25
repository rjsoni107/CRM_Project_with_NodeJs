import { ENDPOINTS } from "../../../../utility/ApiEndpoints";

const UserListDTO = (fetchData, setState, setShowLoader) => {
    // Fetch all users
    const fetchUsers = async (state) => {
        setShowLoader(true);
        const payload = {
            ...state.payload,
            start: state.start,
            length: state.length,
        };
        try {
            const responseJson = await fetchData('POST', ENDPOINTS.GET_USER_LIST, payload);
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

    // Add a new user
    const addUser = async (newData) => {
        try {
            const responseJson = await fetchData('POST', ENDPOINTS.ADD_USER, newData);
            if (responseJson && responseJson.responseStatus === 'Success') {
                alert(responseJson.responseMsg);
                // setUserList(userList => [...userList, responseJson.user]);
            }
        } catch (error) {
            console.error('Error adding user:', error);
            return null;
        }
    };

    // Update an existing user
    const updateUser = async (id, updatedData) => {
        try {
            const responseJson = await fetchData('PUT', `${ENDPOINTS.UPDATE_USER_DATA}/${id}`, updatedData);
            if (responseJson && responseJson.responseStatus === 'Success') {
                alert(responseJson.responseMsg);
                // setUserList(userList => userList.map(user => (user._id === id ? { ...user, ...updatedData } : user)));
            }
            return null;
        } catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    };

    // Delete a user
    const deleteUser = async (id) => {
        try {
            const responseJson = await fetchData('DELETE', `${ENDPOINTS.DELETE_USER_DATA}/${id}`);
            if (responseJson && responseJson.responseStatus === 'Success') {
                alert(responseJson.responseMsg);
                // setUserList(userList => userList.filter(user => user._id !== id));
                return true;
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return { fetchUsers, deleteUser, addUser, updateUser };
};

export default UserListDTO;