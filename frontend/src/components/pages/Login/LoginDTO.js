import { useDispatch } from "react-redux";
import { setToken, setUser } from "../../../redux/userSlice";
import { ENDPOINTS } from "../../../utility/ApiEndpoints";
import ValidationHandler from "../../../utility/ValidationHandler";

const LoginDTO = ({ setError, fetchData, basePathAction, setState, state, setShowLoader, apiPathAction }) => {
    const { validateFormHandler, validateBlankField } = ValidationHandler();
    const { mobile, pin, userName } = state.payload;
    const dispatch = useDispatch();

    const openPage = (pathName, obj) => {
        setState(prevState => ({
            ...prevState,
            redirect: pathName,
            redirectState: obj,
        }));
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        const that = event.target;

        if (validateFormHandler(that)) {
            const payload = { userName, pin };
            const fetchAction = apiPathAction(ENDPOINTS.LOGIN_ACTION);
            const redirectAdminPanal = basePathAction(ENDPOINTS.DASHBOARD);
            const redirectUserPanal = basePathAction(ENDPOINTS.FRIENDS_LIST);
            setShowLoader(true)
            try {
                const response = await fetchData('POST', fetchAction, payload);
                const { responseStatus, responseMsg, userDetails, token } = response;
                const isManagment = userDetails?.userType === "ADMIN" || userDetails?.userType === "SUBADMIN";
                const redirectAction = isManagment ? redirectAdminPanal : redirectUserPanal;

                if (response && responseStatus === "SUCCESS") {
                    localStorage.setItem("authToken", token);
                    localStorage.setItem('globalObj', JSON.stringify(userDetails));
                    dispatch(setUser(userDetails))
                    dispatch(setToken(token))
                    openPage(redirectAction, userDetails)
                } else {
                    setError(responseMsg);
                }
            } catch (err) {
                console.error("Error during login:", err);
            } finally {
                setShowLoader(false)
            }
        }
    };

    const handleGenerateOtp = async (event, type) => {
        event.preventDefault();

         if (!validateBlankField(userName, 'userName', 'mobile')) return;

        const payload = { userName, type };
        const fetchAction = apiPathAction(ENDPOINTS.GENERATE_OTP_ACTION);
        const redirectAction = basePathAction(ENDPOINTS.VERIFY_OTP);
        setShowLoader(true)
        try {
            const response = await fetchData('POST', fetchAction, payload);
            const { responseStatus, responseMsg } = response;

            if (response && responseStatus === "SUCCESS") {
                openPage(redirectAction, response)
            } else {
                setError(responseMsg);
            }
        } catch (err) {
            setError(err.message);
            console.error("Error during login:", err);
        } finally {
            setShowLoader(false)
        }
    }

    const handleForgotPin = async (event) => {
        event.preventDefault();
        
        if (!validateBlankField(userName, 'userName', 'mobile')) return;

        const payload = { userName: userName };
        setShowLoader(true)
        try {
            const response = await fetchData('POST', basePathAction(ENDPOINTS.FORGOT_PIN), payload);
            const { responseStatus, responseMsg } = response;

            if (response && responseStatus === "SUCCESS") {
                setError(responseMsg);
            } else {
                setError(responseMsg);
            }
        } catch (err) {
            setError(err.message);
            console.error("Error during login:", err);
        } finally {
            setShowLoader(false)
        }
    }

    return {
        handleLogin,
        handleGenerateOtp,
        handleForgotPin
    };
}

export default LoginDTO;