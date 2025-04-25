import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../../utility/ApiEndpoints";
import ValidationHandler from "../../../../utility/ValidationHandler";
import { useRef } from "react";

const UserEditDTO = ({setShowLoader, setUserDetails, id, setDialogState, fetchData, basePathAction}) => {
    const { validateFormHandler } = ValidationHandler();
    const userDetailsRef = useRef(null);
    const navigate = useNavigate(); 
    const execute = async () => {
        getUserDetail()
    }
    
    // Fetch all users
    const getUserDetail = async () => {
        const payload = { id: id };
        const actionName = basePathAction(ENDPOINTS.GET_USER_DETAILS);

        setShowLoader(true);
        try {
            const responseJson = await fetchData("POST", actionName, payload);
            const { responseCode, responseStatus, user } = responseJson;
            if (responseCode === "200" && responseStatus.toUpperCase() === "SUCCESS" && user !== undefined) {
                setUserDetails(user);
            } else {
                console.log("User not found or error in response");
                navigate(basePathAction(ENDPOINTS.ERROR));
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setShowLoader(false);
        }
    };

    const submitHandler = (evt) => {
        evt.preventDefault();

        const that = evt.target;

        if (validateFormHandler(that)) {
            const userPayload = userDetailsRef.current.getPayload();
            const userId = {'id': id}
            const payload = { ...userPayload, ...userId };
            const actionName = basePathAction(ENDPOINTS.UPDATE_USER_DATA);

            setShowLoader(true);
            fetchData('PUT', actionName, payload).then(responseJson => {
                const { responseStatus, responseMsg } = responseJson;
                setDialogState(prevState => ({
                    ...prevState,
                    dialog: {
                        ...prevState.dialog,
                        dialogBoxType: responseStatus === "Success" ? 'success' : 'error',
                        dialogBoxMsg: <h5>{responseMsg}</h5>,
                        isDialogOpen: true,
                        dialogFooter: (
                            <>
                                <button className='btn btn-primary'
                                    onClick={(e) => {
                                        setDialogState({ dialog: { isDialogOpen: false } });
                                        window.history.back();
                                    }}>
                                    Close It
                                </button>
                            </>
                        )
                    },
                }));
                setShowLoader(false);
            });
        }
    }

    // Update an existing user
    // const updateUser = async (id, updatedData) => {
    //     try {
    //         const responseJson = await fetchData('PUT', `${ENDPOINTS.UPDATE_USER_DATA}/${id}`, updatedData);
    //         if (responseJson && responseJson.responseStatus === 'Success') {
    //             alert(responseJson.responseMsg);
    //             setUserList(userList => userList.map(user => (user._id === id ? { ...user, ...updatedData } : user)));
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error updating user:', error);
    //         return null;
    //     }
    // };


    return { execute, submitHandler, userDetailsRef };
};

export default UserEditDTO;