import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../../utility/ApiEndpoints";
import ValidationHandler from "../../../../utility/ValidationHandler";
import { useRef } from "react";

const UserEditDTO = ({ setShowLoader, setUserDetails, id, setDialogState, fetchData, basePathAction }) => {
    const { validateFormHandler } = ValidationHandler();
    const userDetailsRef = useRef(null);
    const navigate = useNavigate();
    const execute = async () => {
        getUserDetail()
    }

    // Fetch all users
    const getUserDetail = async () => {
        const payload = { id: id };
        const actionName = basePathAction(ENDPOINTS.GET_USER_DETAILS_ACTION);

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

    const submitHandler = async (evt) => {
        evt.preventDefault();
        const that = evt.target;

        if (validateFormHandler(that)) {
            const userPayload = userDetailsRef.current.getPayload();
            const userId = { 'id': id }
            const payload = { ...userPayload, ...userId };
            const actionName = basePathAction(ENDPOINTS.UPDATE_USER_ACTION);

            setShowLoader(true);
            try {
                const responseJson = await fetchData('PUT', actionName, payload)
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
                                        if (responseStatus === "SUCCESS") window.history.back();
                                    }}>
                                    Close It
                                </button>
                            </>
                        )
                    },
                }));
            } catch (error) {
                console.error("Error update user:", error)
            } finally {
                setShowLoader(false);
            }
        }
    }

    return { execute, submitHandler, userDetailsRef };
};

export default UserEditDTO;