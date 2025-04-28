import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const LoginDTO = ({ setError, fetchData, basePathAction, setState, state, setShowLoader, validateFormHandler }) => {
    const { mobile, pin } = state.payload;

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
            const payload = { mobile, pin };
            const fetchAction = basePathAction(ENDPOINTS.LOGIN_ACTION);
            const redirectAction = basePathAction(ENDPOINTS.DASHBOARD);
            setShowLoader(true)
            try {
                const response = await fetchData('POST', fetchAction, payload);
                const { responseStatus, responseMsg, userDetails, token } = response;

                if (response && responseStatus === "SUCCESS") {
                    localStorage.setItem("authToken", token);
                    localStorage.setItem('globalObj', JSON.stringify(userDetails));
                    openPage(redirectAction, userDetails)
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
    };

    const handleGenerateOtp = async (event, type) => {
        event.preventDefault();
        if (!mobile) {
            alert("Mobile No. can not be blank");
            return;
        }
        
        const payload = { mobile, type };
        const fetchAction = basePathAction(ENDPOINTS.GENERATE_OTP_ACTION);
        const redirectAction = basePathAction(ENDPOINTS.VERIFY_OTP_ACTION);
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
        if (!mobile) {
            alert("Mobile No. can not be blank");
            return;
        }
        const payload = { mobile: mobile };
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